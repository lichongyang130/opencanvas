import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

/**
 * 数据库层（开发/沙箱）：Node 22 内置 node:sqlite，零外部依赖、零下载。
 * 生产环境可平滑切换 PostgreSQL（prisma/schema.prisma 已备好等价模型）。
 */

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;

  const dir = path.join(process.cwd(), "data");
  mkdirSync(dir, { recursive: true });
  db = new DatabaseSync(path.join(dir, "dev.db"));
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id         TEXT PRIMARY KEY,
      title      TEXT NOT NULL DEFAULT '新任务',
      mode       TEXT NOT NULL DEFAULT 'chat',
      model      TEXT NOT NULL DEFAULT 'demo',
      deck       TEXT,
      deckStatus TEXT,
      images     TEXT,
      archived   INTEGER NOT NULL DEFAULT 0,
      pinned     INTEGER NOT NULL DEFAULT 0,
      createdAt  REAL NOT NULL,
      updatedAt  REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id             TEXT PRIMARY KEY,
      conversationId TEXT NOT NULL,
      role           TEXT NOT NULL,
      content        TEXT NOT NULL,
      error          INTEGER NOT NULL DEFAULT 0,
      createdAt      REAL NOT NULL,
      FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS case_shares (
      code      TEXT PRIMARY KEY,
      data      TEXT NOT NULL,
      createdAt REAL NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updatedAt);
    CREATE INDEX IF NOT EXISTS idx_messages_convo ON messages(conversationId);
  `);

  // 老库自动迁移：补充 pinned / archived / report 列
  const cols = db.prepare("PRAGMA table_info(conversations)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "archived")) {
    db.exec("ALTER TABLE conversations ADD COLUMN archived INTEGER NOT NULL DEFAULT 0");
  }
  if (!cols.some((c) => c.name === "pinned")) {
    db.exec("ALTER TABLE conversations ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0");
  }
  if (!cols.some((c) => c.name === "report")) {
    db.exec("ALTER TABLE conversations ADD COLUMN report TEXT");
  }
  if (!cols.some((c) => c.name === "modelProvider")) {
    db.exec("ALTER TABLE conversations ADD COLUMN modelProvider TEXT");
  }
  if (!cols.some((c) => c.name === "doc")) {
    db.exec("ALTER TABLE conversations ADD COLUMN doc TEXT");
  }
  if (!cols.some((c) => c.name === "personaId")) {
    db.exec("ALTER TABLE conversations ADD COLUMN personaId TEXT");
  }

  return db;
}
