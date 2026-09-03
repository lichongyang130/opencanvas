#!/usr/bin/env node
/**
 * SQLite → PostgreSQL 全量数据导入（幂等：按主键 UPSERT，可重复执行）。
 * 用法：DATABASE_URL=postgres://... node scripts/pg-import.mjs [--clear]
 *   --clear 先清空 PG 同名表再导入（推荐首次迁移后使用，避免残留孤儿数据）。
 *
 * 注意：布尔列由 SQLite 0/1 → boolean 转换；上传文件（filePath）不搬迁，
 * 需手动把 data/uploads 复制到生产存储目录（后续接入 R2/S3 后由存储层负责）。
 */
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import pg from "pg";

const url = process.env.DATABASE_URL;
const sqlitePath = process.env.SQLITE_PATH ?? path.join(process.cwd(), "data", "dev.db");
const clear = process.argv.includes("--clear");

const TABLES = [
  { name: "users", pk: ["id"], bool: [] },
  { name: "sessions", pk: ["token"], bool: [] },
  { name: "conversations", pk: ["id"], bool: ["archived", "pinned"] },
  { name: "messages", pk: ["id"], bool: ["error"] },
  { name: "documents", pk: ["id"], bool: ["favorite", "deleted"] },
  { name: "knowledge_bases", pk: ["id"], bool: ["semantic", "qa", "cite"] },
  { name: "kb_documents", pk: ["kbId", "documentId"], bool: [] },
  { name: "prompt_templates", pk: ["id"], bool: ["shared"] },
  { name: "agents", pk: ["id"], bool: ["shared"] },
  { name: "case_shares", pk: ["code"], bool: [] },
  { name: "artifact_shares", pk: ["code"], bool: [] },
  { name: "membership", pk: ["id"], bool: ["autoRenew"] },
  { name: "orders", pk: ["id"], bool: [] },
  { name: "notifications", pk: ["id"], bool: ["read"] },
  { name: "client_errors", pk: ["id"], bool: [] },
  { name: "gateway_usage", pk: ["id"], bool: ["fallback"] },
  { name: "credit_ledger", pk: ["id"], bool: [] },
];

if (!url) {
  console.error("缺少 DATABASE_URL（示例：postgresql://user:pass@localhost:5432/opencanvas）");
  process.exit(1);
}

const db = new DatabaseSync(sqlitePath);
const client = new pg.Client({ connectionString: url });
await client.connect();

let total = 0;
for (const t of TABLES) {
  const rows = db.prepare(`SELECT * FROM ${t.name}`).all();
  if (clear && t.name !== "_schema_migrations") {
    await client.query(`DELETE FROM "${t.name}"`);
  }
  if (rows.length === 0) {
    console.log(`  ${t.name}: 0`);
    continue;
  }
  const cols = Object.keys(rows[0]);
  const boolCols = new Set(t.bool);
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
  const upd = cols
    .filter((c) => !t.pk.includes(c))
    .map((c) => `"${c}" = EXCLUDED."${c}"`)
    .join(", ");
  const q = `INSERT INTO "${t.name}" (${cols.map((c) => `"${c}"`).join(", ")})
             VALUES (${placeholders})
             ON CONFLICT (${t.pk.map((c) => `"${c}"`).join(", ")})
             DO UPDATE SET ${upd || '"__noupdate__" = EXCLUDED."__noupdate__"'}`;
  for (const row of rows) {
    const vals = cols.map((c) => (boolCols.has(c) ? !!row[c] : row[c]));
    await client.query(q, vals);
  }
  total += rows.length;
  console.log(`  ${t.name}: ${rows.length}`);
}

await client.end();
console.log(`✅ 导入完成，共 ${total} 行`);
