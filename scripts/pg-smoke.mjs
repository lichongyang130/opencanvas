#!/usr/bin/env node
/**
 * PostgreSQL 用户体系冒烟测试（真实 PG 连接）。
 * 验证：17 张表结构、用户注册/会话、数据隔离、积分记账、删号清理（应用层删除顺序）。
 * 用法：DATABASE_URL=postgres://... node scripts/pg-smoke.mjs
 */
import pg from "pg";
import { randomUUID } from "node:crypto";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("缺少 DATABASE_URL");
  process.exit(1);
}

const TABLES = [
  "users", "sessions", "conversations", "messages", "documents", "knowledge_bases",
  "kb_documents", "prompt_templates", "agents", "case_shares", "artifact_shares",
  "membership", "orders", "notifications", "client_errors", "gateway_usage", "credit_ledger",
];

let failed = 0;
function check(name, ok, extra = "") {
  console.log(`${ok ? "  ✅" : "  ❌"} ${name}${extra ? ` (${extra})` : ""}`);
  if (!ok) failed++;
}

const client = new pg.Client({ connectionString: url });
await client.connect();

// 1) 表结构
const tables = new Set(
  (await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
  )).rows.map((r) => r.table_name)
);
console.log("── 1. 表结构 ──");
check("17 张业务表全部存在", TABLES.every((t) => tables.has(t)),
  TABLES.filter((t) => !tables.has(t)).join(",") || "全部就绪");

const u1 = `smoke-a-${randomUUID().slice(0, 8)}`;
const u2 = `smoke-b-${randomUUID().slice(0, 8)}`;
const now = Date.now();

try {
  await client.query("BEGIN");

  // 2) 用户注册
  console.log("── 2. 用户 / 会话 ──");
  await client.query(
    `INSERT INTO users (id, email, name, "passwordHash", provider, "providerUserId", "createdAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [u1, `${u1}@example.com`, "冒烟A", "scrypt$x$y", "", "", now]
  );
  await client.query(
    `INSERT INTO users (id, email, name, "passwordHash", provider, "providerUserId", "createdAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [u2, `${u2}@example.com`, "冒烟B", "scrypt$x$y", "", "", now]
  );
  const tok = `tok-${randomUUID().slice(0, 8)}`;
  await client.query(
    `INSERT INTO sessions (token, "userId", "createdAt", "expiresAt") VALUES ($1,$2,$3,$4)`,
    [tok, u1, now, now + 86400000]
  );
  const me = (await client.query(
    `SELECT u.email, s.token FROM sessions s JOIN users u ON u.id = s."userId" WHERE s.token = $1`,
    [tok]
  )).rows[0];
  check("注册用户 A/B + 会话查询", me?.email === `${u1}@example.com` && me?.token === tok);

  // 3) 数据隔离
  console.log("── 3. 数据隔离 ──");
  const d1 = `doc-${randomUUID().slice(0, 8)}`;
  const d2 = `doc-${randomUUID().slice(0, 8)}`;
  await client.query(
    `INSERT INTO documents (id, name, type, size, ext, content, tags, favorite, deleted, "userId", "createdAt", "updatedAt")
     VALUES ($1,'A的机密','text',10,'txt','secret Phoenix','[]',false,false,$2,$3,$3)`,
    [d1, u1, now]
  );
  await client.query(
    `INSERT INTO documents (id, name, type, size, ext, content, tags, favorite, deleted, "userId", "createdAt", "updatedAt")
     VALUES ($1,'本地文档','text',10,'txt','local','[]',false,false,NULL,$2,$2)`,
    [d2, now]
  );
  const seenA = (await client.query(
    `SELECT id FROM documents WHERE ("userId" IS NULL OR "userId" = $1) AND deleted = false`,
    [u1]
  )).rows.map((r) => r.id);
  const seenB = (await client.query(
    `SELECT id FROM documents WHERE ("userId" IS NULL OR "userId" = $1) AND deleted = false`,
    [u2]
  )).rows.map((r) => r.id);
  check("A 可见：本人 + 本地文档", seenA.includes(d1) && seenA.includes(d2));
  check("B 不可见 A 的文档（隔离）", !seenB.includes(d1) && seenB.includes(d2));

  // 4) 积分
  console.log("── 4. 积分 ──");
  await client.query(
    `INSERT INTO credit_ledger (id, delta, reason, "userId", "createdAt") VALUES ($1,10,'每日签到',$2,$3)`,
    [`c-${randomUUID().slice(0, 8)}`, u1, now]
  );
  const bal = Number((await client.query(
    `SELECT COALESCE(SUM(delta),0) AS n FROM credit_ledger WHERE ("userId" IS NULL OR "userId" = $1)`,
    [u1]
  )).rows[0].n);
  check("A 积分余额 = 10", bal === 10);
  const balB = Number((await client.query(
    `SELECT COALESCE(SUM(delta),0) AS n FROM credit_ledger WHERE "userId" = $1`,
    [u2]
  )).rows[0].n);
  check("B 积分余额 = 0（隔离）", balB === 0);

  // 5) 删号清理（模拟 repo.deleteUserAccount 顺序）
  console.log("── 5. 删号清理 ──");
  const deletes = [
    `DELETE FROM sessions WHERE "userId" = $1`,
    `DELETE FROM kb_documents WHERE "kbId" IN (SELECT id FROM knowledge_bases WHERE "userId" = $1)`,
    `DELETE FROM knowledge_bases WHERE "userId" = $1`,
    `DELETE FROM documents WHERE "userId" = $1`,
    `DELETE FROM notifications WHERE "userId" = $1`,
    `DELETE FROM credit_ledger WHERE "userId" = $1`,
    `DELETE FROM client_errors WHERE "userId" = $1`,
    `DELETE FROM conversations WHERE "userId" = $1`,
    `DELETE FROM gateway_usage WHERE "userId" = $1`,
    `DELETE FROM users WHERE id = $1`,
  ];
  for (const q of deletes) await client.query(q, [u1]);
  const remain = Number((await client.query(
    `SELECT (SELECT COUNT(*) FROM users WHERE id = $1)
          + (SELECT COUNT(*) FROM sessions WHERE "userId" = $1)
          + (SELECT COUNT(*) FROM documents WHERE "userId" = $1)
          + (SELECT COUNT(*) FROM credit_ledger WHERE "userId" = $1) AS n`,
    [u1]
  )).rows[0].n);
  check("删号后用户数据全部清理", remain === 0);
  const bAlive = Number((await client.query(`SELECT COUNT(*) AS n FROM users WHERE id = $1`, [u2])).rows[0].n);
  check("B 账号不受影响", bAlive === 1);

  // 6) 事务回滚（不留测试数据）
  await client.query("ROLLBACK");
} catch (e) {
  await client.query("ROLLBACK").catch(() => {});
  check("冒烟执行", false, e.message);
}

await client.end();
console.log(failed === 0 ? "\n🎉 PG SMOKE: PASS" : `\n💥 PG SMOKE: FAIL（${failed} 项）`);
process.exit(failed === 0 ? 0 : 1);
