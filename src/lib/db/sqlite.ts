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
      userId     TEXT,
      createdAt  REAL NOT NULL,
      updatedAt  REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id           TEXT PRIMARY KEY,
      email        TEXT NOT NULL UNIQUE,
      name         TEXT NOT NULL DEFAULT '',
      passwordHash TEXT NOT NULL,
      createdAt    REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token     TEXT PRIMARY KEY,
      userId    TEXT NOT NULL,
      createdAt REAL NOT NULL,
      expiresAt REAL NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS messages (
      id             TEXT PRIMARY KEY,
      conversationId TEXT NOT NULL,
      role           TEXT NOT NULL,
      content        TEXT NOT NULL,
      error          INTEGER NOT NULL DEFAULT 0,
      refs           TEXT,
      createdAt      REAL NOT NULL,
      FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS case_shares (
      code      TEXT PRIMARY KEY,
      data      TEXT NOT NULL,
      createdAt REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS artifact_shares (
      code      TEXT PRIMARY KEY,
      kind      TEXT NOT NULL,
      data      TEXT NOT NULL,
      createdAt REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS share_views (
      code         TEXT PRIMARY KEY,
      kind         TEXT NOT NULL DEFAULT '',
      views        INTEGER NOT NULL DEFAULT 0,
      lastViewedAt REAL
    );
    CREATE TABLE IF NOT EXISTS share_comments (
      id        TEXT PRIMARY KEY,
      code      TEXT NOT NULL,
      nickname  TEXT NOT NULL DEFAULT '',
      content   TEXT NOT NULL,
      createdAt REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS membership (
      id        TEXT PRIMARY KEY,
      plan      TEXT NOT NULL DEFAULT 'free',
      autoRenew INTEGER NOT NULL DEFAULT 1,
      renewAt   REAL,
      createdAt REAL NOT NULL,
      updatedAt REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id        TEXT PRIMARY KEY,
      plan      TEXT NOT NULL,
      amount    INTEGER NOT NULL,
      status    TEXT NOT NULL,
      createdAt REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS documents (
      id        TEXT PRIMARY KEY,
      name      TEXT NOT NULL,
      type      TEXT NOT NULL DEFAULT 'text',
      size      INTEGER NOT NULL DEFAULT 0,
      ext       TEXT NOT NULL DEFAULT '',
      content   TEXT NOT NULL DEFAULT '',
      filePath  TEXT,
      tags      TEXT NOT NULL DEFAULT '[]',
      favorite  INTEGER NOT NULL DEFAULT 0,
      deleted   INTEGER NOT NULL DEFAULT 0,
      userId    TEXT,
      createdAt REAL NOT NULL,
      updatedAt REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS prompt_templates (
      id        TEXT PRIMARY KEY,
      label     TEXT NOT NULL,
      desc      TEXT NOT NULL DEFAULT '',
      category  TEXT NOT NULL DEFAULT 'productivity',
      mode      TEXT NOT NULL DEFAULT 'chat',
      prompt    TEXT NOT NULL,
      author    TEXT NOT NULL DEFAULT '我',
      uses      INTEGER NOT NULL DEFAULT 0,
      shared    INTEGER NOT NULL DEFAULT 0,
      shareCode TEXT,
      createdAt REAL NOT NULL,
      updatedAt REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS agents (
      id        TEXT PRIMARY KEY,
      name      TEXT NOT NULL,
      desc      TEXT NOT NULL DEFAULT '',
      category  TEXT NOT NULL DEFAULT '自定义',
      emoji     TEXT NOT NULL DEFAULT '🤖',
      system    TEXT NOT NULL DEFAULT '',
      starter   TEXT NOT NULL DEFAULT '',
      shared    INTEGER NOT NULL DEFAULT 0,
      shareCode TEXT,
      createdAt REAL NOT NULL,
      updatedAt REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS knowledge_bases (
      id        TEXT PRIMARY KEY,
      name      TEXT NOT NULL,
      desc      TEXT NOT NULL DEFAULT '',
      tags      TEXT NOT NULL DEFAULT '[]',
      semantic  INTEGER NOT NULL DEFAULT 1,
      qa        INTEGER NOT NULL DEFAULT 1,
      cite      INTEGER NOT NULL DEFAULT 1,
      userId    TEXT,
      createdAt REAL NOT NULL,
      updatedAt REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS kb_documents (
      kbId       TEXT NOT NULL,
      documentId TEXT NOT NULL,
      createdAt  REAL NOT NULL,
      PRIMARY KEY (kbId, documentId),
      FOREIGN KEY (kbId) REFERENCES knowledge_bases(id) ON DELETE CASCADE,
      FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id        TEXT PRIMARY KEY,
      type      TEXT NOT NULL DEFAULT 'info',
      title     TEXT NOT NULL,
      body      TEXT NOT NULL DEFAULT '',
      link      TEXT,
      read      INTEGER NOT NULL DEFAULT 0,
      userId    TEXT,
      createdAt REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS client_errors (
      id        TEXT PRIMARY KEY,
      message   TEXT NOT NULL DEFAULT '',
      source    TEXT NOT NULL DEFAULT '',
      stack     TEXT NOT NULL DEFAULT '',
      url       TEXT NOT NULL DEFAULT '',
      userAgent TEXT NOT NULL DEFAULT '',
      userId    TEXT,
      createdAt REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS gateway_usage (
      id          TEXT PRIMARY KEY,
      userId      TEXT,
      sessionId   TEXT,
      modelId     TEXT NOT NULL,
      providerId  TEXT NOT NULL,
      fallback    INTEGER NOT NULL DEFAULT 0,
      status      TEXT NOT NULL DEFAULT 'success',
      inputTokens INTEGER NOT NULL DEFAULT 0,
      outputTokens INTEGER NOT NULL DEFAULT 0,
      costUsd     REAL NOT NULL DEFAULT 0,
      credits     INTEGER NOT NULL DEFAULT 0,
      latencyMs   INTEGER NOT NULL DEFAULT 0,
      error       TEXT DEFAULT '',
      createdAt   REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS credit_ledger (
      id        TEXT PRIMARY KEY,
      delta     INTEGER NOT NULL,
      reason    TEXT NOT NULL DEFAULT '',
      ref       TEXT,
      userId    TEXT,
      createdAt REAL NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_credit_ledger_created ON credit_ledger(createdAt);
    CREATE INDEX IF NOT EXISTS idx_gateway_usage_created ON gateway_usage(createdAt);
    CREATE INDEX IF NOT EXISTS idx_client_errors_created ON client_errors(createdAt);
    CREATE INDEX IF NOT EXISTS idx_gateway_usage_user ON gateway_usage(userId, createdAt);
    CREATE INDEX IF NOT EXISTS idx_gateway_usage_model ON gateway_usage(modelId, createdAt);
    CREATE INDEX IF NOT EXISTS idx_kb_docs_kb ON kb_documents(kbId);
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(createdAt);
    CREATE INDEX IF NOT EXISTS idx_agents_updated ON agents(updatedAt);
    CREATE INDEX IF NOT EXISTS idx_agents_share ON agents(shareCode);
    CREATE INDEX IF NOT EXISTS idx_prompt_templates_updated ON prompt_templates(updatedAt);
    CREATE INDEX IF NOT EXISTS idx_artifact_shares_created ON artifact_shares(createdAt);
    CREATE INDEX IF NOT EXISTS idx_share_comments_code ON share_comments(code, createdAt);
    CREATE INDEX IF NOT EXISTS idx_documents_updated ON documents(updatedAt);
    CREATE INDEX IF NOT EXISTS idx_documents_name ON documents(name);
    CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(userId, updatedAt);
    CREATE INDEX IF NOT EXISTS idx_kb_user ON knowledge_bases(userId, updatedAt);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId, createdAt);
    CREATE INDEX IF NOT EXISTS idx_credit_ledger_user ON credit_ledger(userId, createdAt);
    CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updatedAt);
    CREATE INDEX IF NOT EXISTS idx_messages_convo ON messages(conversationId);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(createdAt);
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
  if (!cols.some((c) => c.name === "personaSystem")) {
    db.exec("ALTER TABLE conversations ADD COLUMN personaSystem TEXT");
  }
  if (!cols.some((c) => c.name === "codePreview")) {
    db.exec("ALTER TABLE conversations ADD COLUMN codePreview TEXT");
  }
  if (!cols.some((c) => c.name === "kbId")) {
    db.exec("ALTER TABLE conversations ADD COLUMN kbId TEXT");
  }
  if (!cols.some((c) => c.name === "userId")) {
    db.exec("ALTER TABLE conversations ADD COLUMN userId TEXT");
  }
  const tplCols = db.prepare("PRAGMA table_info(prompt_templates)").all() as { name: string }[];
  if (!tplCols.some((c) => c.name === "shared")) {
    db.exec("ALTER TABLE prompt_templates ADD COLUMN shared INTEGER NOT NULL DEFAULT 0");
  }
  if (!tplCols.some((c) => c.name === "shareCode")) {
    db.exec("ALTER TABLE prompt_templates ADD COLUMN shareCode TEXT");
    db.exec("CREATE INDEX IF NOT EXISTS idx_prompt_templates_share ON prompt_templates(shareCode)");
  }
  const msgCols = db.prepare("PRAGMA table_info(messages)").all() as { name: string }[];
  if (!msgCols.some((c) => c.name === "refs")) {
    db.exec("ALTER TABLE messages ADD COLUMN refs TEXT");
  }
  // 账号：OAuth 绑定信息（无密码的第三方账号 passwordHash 为空串）
  const userCols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!userCols.some((c) => c.name === "provider")) {
    db.exec("ALTER TABLE users ADD COLUMN provider TEXT NOT NULL DEFAULT ''");
  }
  if (!userCols.some((c) => c.name === "providerUserId")) {
    db.exec("ALTER TABLE users ADD COLUMN providerUserId TEXT NOT NULL DEFAULT ''");
  }

  // 全表隔离：个人数据表补 userId（NULL = 未登录本地数据）
  const d = db;
  const addColIfMissing = (table: string, col: string, ddl: string) => {
    const cols = d.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!cols.some((c) => c.name === col)) d.exec(ddl);
  };
  addColIfMissing("documents", "userId", "ALTER TABLE documents ADD COLUMN userId TEXT");
  addColIfMissing("knowledge_bases", "userId", "ALTER TABLE knowledge_bases ADD COLUMN userId TEXT");
  addColIfMissing("notifications", "userId", "ALTER TABLE notifications ADD COLUMN userId TEXT");
  addColIfMissing("credit_ledger", "userId", "ALTER TABLE credit_ledger ADD COLUMN userId TEXT");

  return db;
}
