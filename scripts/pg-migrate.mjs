#!/usr/bin/env node
/**
 * PostgreSQL 迁移执行器（无 psql 环境可用）。
 * 逐字执行 prisma/migrations/postgresql 目录下各版本的 migration.sql，
 * 已在 _schema_migrations 记录过的跳过。
 * 用法：DATABASE_URL=postgres://... node scripts/pg-migrate.mjs
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("缺少 DATABASE_URL（示例：postgresql://user:pass@localhost:5432/opencanvas）");
  process.exit(1);
}

const dir = path.join(process.cwd(), "prisma", "migrations", "postgresql");
if (!existsSync(dir)) {
  console.error(`迁移目录不存在：${dir}`);
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

await client.query(
  `CREATE TABLE IF NOT EXISTS _schema_migrations (
     id TEXT PRIMARY KEY,
     appliedAt TIMESTAMPTZ NOT NULL DEFAULT now()
   )`
);

const applied = new Set(
  (await client.query("SELECT id FROM _schema_migrations")).rows.map((r) => r.id)
);

for (const m of readdirSync(dir).sort()) {
  const file = path.join(dir, m, "migration.sql");
  if (!existsSync(file)) continue;
  if (applied.has(m)) {
    console.log(`跳过（已应用）：${m}`);
    continue;
  }
  await client.query("BEGIN");
  try {
    await client.query(readFileSync(file, "utf8"));
    await client.query("INSERT INTO _schema_migrations (id) VALUES ($1)", [m]);
    await client.query("COMMIT");
    console.log(`已应用：${m}`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(`应用失败 ${m}：${e.message}`);
    process.exit(1);
  }
}

await client.end();
console.log("✅ PostgreSQL 迁移完成");
