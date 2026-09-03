import { getDb } from "./sqlite";
import { randomUUID } from "node:crypto";

export interface StoredConversation {
  id: string;
  title: string;
  mode: string;
  model: string;
  modelProvider: string | null;
  deck: unknown | null;
  deckStatus: string | null;
  images: StoredImage[];
  report: unknown | null;
  doc: unknown | null;
  personaId: string | null;
  /** 自定义智能体的 system prompt（内置智能体为空，运行时按 personaId 查 personas.ts） */
  personaSystem: string | null;
  /** 代码沙箱预览（AI 生成的 HTML） */
  codePreview: unknown | null;
  /** 会话绑定的知识库 id（RAG 检索来源） */
  kbId: string | null;
  /** 归属用户（NULL = 本地/未登录旧会话） */
  userId: string | null;
  archived: boolean;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface StoredMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  error: boolean;
  /** 引用来源（知识库 RAG 命中，JSON） */
  refs: unknown | null;
  createdAt: number;
}

export interface StoredImage {
  id: string;
  prompt: string;
  model: string;
  url: string; // data: 或 http(s)
  createdAt: number;
}

export interface StoredTemplate {
  id: string;
  label: string;
  desc: string;
  category: string;
  mode: string;
  prompt: string;
  author: string;
  uses: number;
  shared: boolean;
  shareCode: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface StoredAgent {
  id: string;
  name: string;
  desc: string;
  category: string;
  emoji: string;
  system: string;
  starter: string;
  shared: boolean;
  shareCode: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface StoredKnowledgeBase {
  id: string;
  name: string;
  desc: string;
  tags: string[];
  semantic: boolean;
  qa: boolean;
  cite: boolean;
  createdAt: number;
  updatedAt: number;
  /** 聚合：关联文档数 */
  docCount: number;
  /** 聚合：关联文档总大小（字节） */
  totalSize: number;
}

export interface StoredNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: number;
}

function rowToTemplate(r: Record<string, unknown>): StoredTemplate {
  return {
    id: r.id as string,
    label: r.label as string,
    desc: (r.desc as string) ?? "",
    category: (r.category as string) ?? "productivity",
    mode: (r.mode as string) ?? "chat",
    prompt: (r.prompt as string) ?? "",
    author: (r.author as string) ?? "我",
    uses: (r.uses as number) ?? 0,
    shared: Boolean(r.shared),
    shareCode: (r.shareCode as string | null) ?? null,
    createdAt: r.createdAt as number,
    updatedAt: r.updatedAt as number,
  };
}

function rowToAgent(r: Record<string, unknown>): StoredAgent {
  return {
    id: r.id as string,
    name: r.name as string,
    desc: (r.desc as string) ?? "",
    category: (r.category as string) ?? "自定义",
    emoji: (r.emoji as string) ?? "🤖",
    system: (r.system as string) ?? "",
    starter: (r.starter as string) ?? "",
    shared: Boolean(r.shared),
    shareCode: (r.shareCode as string | null) ?? null,
    createdAt: r.createdAt as number,
    updatedAt: r.updatedAt as number,
  };
}

function rowToKnowledgeBase(r: Record<string, unknown>): Omit<StoredKnowledgeBase, "docCount" | "totalSize"> {
  return {
    id: r.id as string,
    name: r.name as string,
    desc: (r.desc as string) ?? "",
    tags: parseJson<string[]>(r.tags as string | null, []),
    semantic: Boolean(r.semantic),
    qa: Boolean(r.qa),
    cite: Boolean(r.cite),
    createdAt: r.createdAt as number,
    updatedAt: r.updatedAt as number,
  };
}

function withKbStats(kb: Omit<StoredKnowledgeBase, "docCount" | "totalSize">): StoredKnowledgeBase {
  const db = getDb();
  const agg = db
    .prepare(
      `SELECT COUNT(*) AS n, COALESCE(SUM(d.size), 0) AS size
       FROM kb_documents k JOIN documents d ON d.id = k.documentId
       WHERE k.kbId = ?`
    )
    .get(kb.id) as { n: number; size: number };
  return { ...kb, docCount: agg.n, totalSize: agg.size };
}

function rowToNotification(r: Record<string, unknown>): StoredNotification {
  return {
    id: r.id as string,
    type: (r.type as string) ?? "info",
    title: r.title as string,
    body: (r.body as string) ?? "",
    link: (r.link as string | null) ?? null,
    read: Boolean(r.read),
    createdAt: r.createdAt as number,
  };
}

export interface StoredDocument {
  id: string;
  name: string;
  /** text / markdown / pdf / word / excel / ppt / other */
  type: string;
  size: number;
  ext: string;
  content: string;
  filePath: string | null;
  tags: string[];
  favorite: boolean;
  deleted: boolean;
  createdAt: number;
  updatedAt: number;
}

function rowToDocument(r: Record<string, unknown>): StoredDocument {
  return {
    id: r.id as string,
    name: r.name as string,
    type: (r.type as string) ?? "text",
    size: (r.size as number) ?? 0,
    ext: (r.ext as string) ?? "",
    content: (r.content as string) ?? "",
    filePath: (r.filePath as string) ?? null,
    tags: parseJson<string[]>(r.tags as string | null, []),
    favorite: Boolean(r.favorite),
    deleted: Boolean(r.deleted),
    createdAt: r.createdAt as number,
    updatedAt: r.updatedAt as number,
  };
}

const parseJson = <T>(s: string | null | undefined, fallback: T): T => {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
};

function rowToConversation(r: Record<string, unknown>): StoredConversation {
  return {
    id: r.id as string,
    title: r.title as string,
    mode: r.mode as string,
    model: r.model as string,
    modelProvider: (r.modelProvider as string | null) ?? null,
    deck: parseJson(r.deck as string | null, null),
    deckStatus: (r.deckStatus as string | null) ?? null,
    images: parseJson<StoredImage[]>(r.images as string | null, []),
    report: parseJson(r.report as string | null, null),
    doc: parseJson(r.doc as string | null, null),
    personaId: (r.personaId as string | null) ?? null,
    personaSystem: (r.personaSystem as string | null) ?? null,
    codePreview: parseJson(r.codePreview as string | null, null),
    kbId: (r.kbId as string | null) ?? null,
    userId: (r.userId as string | null) ?? null,
    archived: Boolean(r.archived),
    pinned: Boolean(r.pinned),
    createdAt: r.createdAt as number,
    updatedAt: r.updatedAt as number,
  };
}

export const repo = {
  /** archivedFilter: 0=活跃 1=归档 undefined=全部 */
  /**
   * 会话列表。
   * userId 语义：undefined=全部（管理/统计）；null=仅本地 NULL 归属；字符串=该用户 + 本地 NULL（迁移兼容）。
   */
  listConversations(archivedFilter?: 0 | 1, userId?: string | null): StoredConversation[] {
    const conds: string[] = [];
    const params: (string | number)[] = [];
    if (archivedFilter !== undefined) {
      conds.push(`archived = ${archivedFilter ? 1 : 0}`);
    }
    if (userId === null) {
      conds.push("userId IS NULL");
    } else if (typeof userId === "string") {
      conds.push("(userId IS NULL OR userId = ?)");
      params.push(userId);
    }
    const where = conds.length > 0 ? ` WHERE ${conds.join(" AND ")}` : "";
    const rows = getDb()
      .prepare(`SELECT * FROM conversations${where} ORDER BY pinned DESC, updatedAt DESC`)
      .all(...params) as Record<string, unknown>[];
    return rows.map(rowToConversation);
  },

  getConversation(id: string): StoredConversation | null {
    const row = getDb()
      .prepare("SELECT * FROM conversations WHERE id = ?")
      .get(id) as Record<string, unknown> | undefined;
    return row ? rowToConversation(row) : null;
  },

  getMessages(conversationId: string): StoredMessage[] {
    const rows = getDb()
      .prepare("SELECT * FROM messages WHERE conversationId = ? ORDER BY createdAt ASC")
      .all(conversationId) as Record<string, unknown>[];
    return rows.map((r) => ({
      id: r.id as string,
      conversationId: r.conversationId as string,
      role: r.role as "user" | "assistant",
      content: r.content as string,
      error: Boolean(r.error),
      refs: parseJson(r.refs as string | null, null),
      createdAt: r.createdAt as number,
    }));
  },

  upsertConversation(c: {
    id: string;
    title?: string;
    mode?: string;
    model?: string;
    modelProvider?: string | null;
    deck?: unknown;
    deckStatus?: string | null;
    images?: StoredImage[];
    report?: unknown;
    doc?: unknown;
    personaId?: string | null;
    personaSystem?: string | null;
    codePreview?: unknown;
    kbId?: string | null;
    userId?: string | null;
    archived?: boolean;
    pinned?: boolean;
  }): void {
    const db = getDb();
    const now = Date.now();
    const existing = db
      .prepare("SELECT id FROM conversations WHERE id = ?")
      .get(c.id) as Record<string, unknown> | undefined;

    if (existing) {
      // 动态拼 SET：undefined = 不改动；显式 null = 清空为 NULL。
      // （旧版用 COALESCE(?, col)，导致任何字段都写不进 NULL，
      //   「取消角色 / 清空 deckStatus」等静默失效。）
      const sets: string[] = [];
      const params: (string | number | null)[] = [];
      const set = (col: string, val: string | number | null) => {
        sets.push(`${col} = ?`);
        params.push(val);
      };
      if (c.title !== undefined) set("title", c.title);
      if (c.mode !== undefined) set("mode", c.mode);
      if (c.model !== undefined) set("model", c.model);
      if (c.modelProvider !== undefined) set("modelProvider", c.modelProvider);
      if (c.deck !== undefined) set("deck", c.deck === null ? null : JSON.stringify(c.deck));
      if (c.deckStatus !== undefined) set("deckStatus", c.deckStatus);
      if (c.images !== undefined) set("images", JSON.stringify(c.images));
      if (c.report !== undefined) set("report", c.report === null ? null : JSON.stringify(c.report));
      if (c.doc !== undefined) set("doc", c.doc === null ? null : JSON.stringify(c.doc));
      if (c.personaId !== undefined) set("personaId", c.personaId);
      if (c.personaSystem !== undefined) set("personaSystem", c.personaSystem);
      if (c.codePreview !== undefined) set("codePreview", c.codePreview === null ? null : JSON.stringify(c.codePreview));
      if (c.kbId !== undefined) set("kbId", c.kbId);
      if (c.userId !== undefined) set("userId", c.userId);
      if (c.archived !== undefined) set("archived", c.archived ? 1 : 0);
      if (c.pinned !== undefined) set("pinned", c.pinned ? 1 : 0);

      if (sets.length > 0) {
        sets.push("updatedAt = ?");
        params.push(now, c.id);
        db.prepare(`UPDATE conversations SET ${sets.join(", ")} WHERE id = ?`).run(...params);
      }
    } else {
      db.prepare(
        `INSERT INTO conversations (id, title, mode, model, modelProvider, deck, deckStatus, images, report, doc, personaId, personaSystem, codePreview, kbId, userId, archived, pinned, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        c.id,
        c.title ?? "新任务",
        c.mode ?? "chat",
        c.model ?? "demo",
        c.modelProvider ?? null,
        c.deck === undefined || c.deck === null ? null : JSON.stringify(c.deck),
        c.deckStatus ?? null,
        c.images === undefined ? "[]" : JSON.stringify(c.images),
        c.report === undefined || c.report === null ? null : JSON.stringify(c.report),
        c.doc === undefined || c.doc === null ? null : JSON.stringify(c.doc),
        c.personaId ?? null,
        c.personaSystem ?? null,
        c.codePreview === undefined || c.codePreview === null ? null : JSON.stringify(c.codePreview),
        c.kbId ?? null,
        c.userId ?? null,
        c.archived ? 1 : 0,
        c.pinned ? 1 : 0,
        now,
        now
      );
    }
  },

  insertMessage(m: {
    id: string;
    conversationId: string;
    role: string;
    content: string;
    error?: boolean;
    refs?: unknown;
  }): void {
    getDb()
      .prepare(
        "INSERT INTO messages (id, conversationId, role, content, error, refs, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        m.id,
        m.conversationId,
        m.role,
        m.content,
        m.error ? 1 : 0,
        m.refs === undefined || m.refs === null ? null : JSON.stringify(m.refs),
        Date.now()
      );
    getDb().prepare("UPDATE conversations SET updatedAt = ? WHERE id = ?").run(Date.now(), m.conversationId);
  },

  /** 更新归档/置顶/标题等标记 */
  patchFlags(id: string, flags: { archived?: boolean; pinned?: boolean; title?: string }): void {
    const sets: string[] = [];
    const params: (string | number)[] = [];
    if (flags.archived !== undefined) {
      sets.push("archived = ?");
      params.push(flags.archived ? 1 : 0);
    }
    if (flags.pinned !== undefined) {
      sets.push("pinned = ?");
      params.push(flags.pinned ? 1 : 0);
    }
    if (flags.title !== undefined) {
      sets.push("title = ?");
      params.push(flags.title);
    }
    if (sets.length === 0) return;
    sets.push("updatedAt = ?");
    params.push(Date.now(), id);
    getDb().prepare(`UPDATE conversations SET ${sets.join(", ")} WHERE id = ?`).run(...params);
  },

  setArchivedBatch(ids: string[], archived: boolean): void {
    const db = getDb();
    const stmt = db.prepare("UPDATE conversations SET archived = ?, updatedAt = ? WHERE id = ?");
    for (const id of ids) stmt.run(archived ? 1 : 0, Date.now(), id);
  },

  /** 删除会话内指定消息（重新生成 / 编辑重发用） */
  deleteMessages(conversationId: string, ids: string[]): void {
    if (ids.length === 0) return;
    const db = getDb();
    const stmt = db.prepare("DELETE FROM messages WHERE conversationId = ? AND id = ?");
    for (const id of ids) stmt.run(conversationId, id);
  },

  deleteConversation(id: string): void {
    const db = getDb();
    db.prepare("DELETE FROM messages WHERE conversationId = ?").run(id);
    db.prepare("DELETE FROM conversations WHERE id = ?").run(id);
  },

  deleteConversations(ids: string[]): void {
    const db = getDb();
    for (const id of ids) {
      db.prepare("DELETE FROM messages WHERE conversationId = ?").run(id);
      db.prepare("DELETE FROM conversations WHERE id = ?").run(id);
    }
  },

  /* ─────────────────────────── 文档中心 ─────────────────────────── */

  /** 文档列表（支持关键字搜索；deleted=1 为回收站） */
  listDocuments(q = "", includeDeleted = false): StoredDocument[] {
    const db = getDb();
    const where = includeDeleted ? "" : " AND deleted = 0";
    const rows = q.trim()
      ? (db
          .prepare(
            `SELECT * FROM documents WHERE (name LIKE ? OR content LIKE ?)${where} ORDER BY updatedAt DESC`
          )
          .all(`%${q.trim()}%`, `%${q.trim()}%`) as Record<string, unknown>[])
      : (db
          .prepare(`SELECT * FROM documents WHERE 1=1${where} ORDER BY updatedAt DESC`)
          .all() as Record<string, unknown>[]);
    return rows.map(rowToDocument);
  },

  getDocument(id: string): StoredDocument | null {
    const row = getDb().prepare("SELECT * FROM documents WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    return row ? rowToDocument(row) : null;
  },

  createDocument(d: StoredDocument): void {
    const db = getDb();
    db.prepare(
      `INSERT INTO documents (id, name, type, size, ext, content, filePath, tags, favorite, deleted, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      d.id,
      d.name,
      d.type,
      d.size,
      d.ext,
      d.content ?? "",
      d.filePath ?? null,
      JSON.stringify(d.tags ?? []),
      d.favorite ? 1 : 0,
      d.deleted ? 1 : 0,
      d.createdAt,
      d.updatedAt
    );
  },

  updateDocument(id: string, patch: Partial<StoredDocument>): void {
    const db = getDb();
    const row = db.prepare("SELECT * FROM documents WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    if (!row) return;
    const cur = rowToDocument(row);
    const next = { ...cur, ...patch, updatedAt: Date.now() };
    db.prepare(
      `UPDATE documents SET name=?, type=?, size=?, ext=?, content=?, filePath=?, tags=?, favorite=?, deleted=?, updatedAt=? WHERE id=?`
    ).run(
      next.name,
      next.type,
      next.size,
      next.ext,
      next.content ?? "",
      next.filePath ?? null,
      JSON.stringify(next.tags ?? []),
      next.favorite ? 1 : 0,
      next.deleted ? 1 : 0,
      next.updatedAt,
      id
    );
  },

  deleteDocument(id: string, hard = false): void {
    const db = getDb();
    if (hard) db.prepare("DELETE FROM documents WHERE id = ?").run(id);
    else db.prepare("UPDATE documents SET deleted = 1, updatedAt = ? WHERE id = ?").run(Date.now(), id);
  },

  documentStats(): { total: number; favorite: number; size: number } {
    const db = getDb();
    const total = (
      db.prepare("SELECT COUNT(*) AS n FROM documents WHERE deleted = 0").get() as { n: number }
    ).n;
    const favorite = (
      db.prepare("SELECT COUNT(*) AS n FROM documents WHERE deleted = 0 AND favorite = 1").get() as { n: number }
    ).n;
    const size = (
      db.prepare("SELECT COALESCE(SUM(size), 0) AS n FROM documents WHERE deleted = 0").get() as { n: number }
    ).n;
    return { total, favorite, size };
  },

  /* ─────────────────────────── 模板中心 ─────────────────────────── */

  /** 用户提交的模板列表（不含内置） */
  listTemplates(): StoredTemplate[] {
    const rows = getDb()
      .prepare("SELECT * FROM prompt_templates ORDER BY uses DESC, updatedAt DESC")
      .all() as Record<string, unknown>[];
    return rows.map(rowToTemplate);
  },

  getTemplate(id: string): StoredTemplate | null {
    const row = getDb().prepare("SELECT * FROM prompt_templates WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    return row ? rowToTemplate(row) : null;
  },

  createTemplate(t: StoredTemplate): void {
    getDb()
      .prepare(
        `INSERT INTO prompt_templates (id, label, desc, category, mode, prompt, author, uses, shared, shareCode, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        t.id, t.label, t.desc, t.category, t.mode, t.prompt, t.author, t.uses ?? 0,
        t.shared ? 1 : 0, t.shareCode ?? null, t.createdAt, t.updatedAt
      );
  },

  updateTemplate(id: string, patch: Partial<StoredTemplate>): void {
    const row = getDb().prepare("SELECT * FROM prompt_templates WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    if (!row) return;
    const cur = rowToTemplate(row);
    const next = { ...cur, ...patch, updatedAt: Date.now() };
    getDb()
      .prepare(
        `UPDATE prompt_templates SET label=?, desc=?, category=?, mode=?, prompt=?, author=?, uses=?, shared=?, shareCode=?, updatedAt=? WHERE id=?`
      )
      .run(
        next.label, next.desc, next.category, next.mode, next.prompt, next.author, next.uses,
        next.shared ? 1 : 0, next.shareCode ?? null, next.updatedAt, id
      );
  },

  incrTemplateUses(id: string): void {
    getDb().prepare("UPDATE prompt_templates SET uses = uses + 1, updatedAt = ? WHERE id = ?").run(Date.now(), id);
  },

  deleteTemplate(id: string): void {
    getDb().prepare("DELETE FROM prompt_templates WHERE id = ?").run(id);
  },

  /** 生成/复用模板分享码（shared=1），返回分享码 */
  shareTemplate(id: string): string | null {
    const db = getDb();
    const row = db.prepare("SELECT shareCode FROM prompt_templates WHERE id = ?").get(id) as
      | { shareCode: string | null }
      | undefined;
    if (!row) return null;
    let code = row.shareCode;
    if (!code) {
      code = randomUUID().replace(/-/g, "").slice(0, 12);
      db.prepare("UPDATE prompt_templates SET shared = 1, shareCode = ?, updatedAt = ? WHERE id = ?")
        .run(code, Date.now(), id);
    } else {
      db.prepare("UPDATE prompt_templates SET shared = 1, updatedAt = ? WHERE id = ?").run(Date.now(), id);
    }
    return code;
  },

  unshareTemplate(id: string): void {
    getDb()
      .prepare("UPDATE prompt_templates SET shared = 0, shareCode = NULL, updatedAt = ? WHERE id = ?")
      .run(Date.now(), id);
  },

  getTemplateByShareCode(code: string): StoredTemplate | null {
    const row = getDb()
      .prepare("SELECT * FROM prompt_templates WHERE shareCode = ? AND shared = 1")
      .get(code) as Record<string, unknown> | undefined;
    return row ? rowToTemplate(row) : null;
  },

  templateStats(): { total: number; totalUses: number } {
    const db = getDb();
    const total = (db.prepare("SELECT COUNT(*) AS n FROM prompt_templates").get() as { n: number }).n;
    const totalUses = (
      db.prepare("SELECT COALESCE(SUM(uses), 0) AS n FROM prompt_templates").get() as { n: number }
    ).n;
    return { total, totalUses };
  },

  // ---------------- 智能体 ----------------

  listAgents(): StoredAgent[] {
    const rows = getDb()
      .prepare("SELECT * FROM agents ORDER BY updatedAt DESC")
      .all() as Record<string, unknown>[];
    return rows.map(rowToAgent);
  },

  getAgent(id: string): StoredAgent | null {
    const row = getDb().prepare("SELECT * FROM agents WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    return row ? rowToAgent(row) : null;
  },

  getAgentByShareCode(code: string): StoredAgent | null {
    const row = getDb().prepare("SELECT * FROM agents WHERE shareCode = ? AND shared = 1").get(code) as
      | Record<string, unknown>
      | undefined;
    return row ? rowToAgent(row) : null;
  },

  createAgent(a: StoredAgent): void {
    getDb()
      .prepare(
        `INSERT INTO agents (id, name, desc, category, emoji, system, starter, shared, shareCode, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        a.id,
        a.name,
        a.desc,
        a.category,
        a.emoji,
        a.system,
        a.starter,
        a.shared ? 1 : 0,
        a.shareCode,
        a.createdAt,
        a.updatedAt
      );
  },

  updateAgent(id: string, patch: Partial<StoredAgent>): void {
    const row = getDb().prepare("SELECT * FROM agents WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    if (!row) return;
    const cur = rowToAgent(row);
    const next = { ...cur, ...patch, updatedAt: Date.now() };
    getDb()
      .prepare(
        `UPDATE agents SET name=?, desc=?, category=?, emoji=?, system=?, starter=?, shared=?, shareCode=?, updatedAt=? WHERE id=?`
      )
      .run(
        next.name,
        next.desc,
        next.category,
        next.emoji,
        next.system,
        next.starter,
        next.shared ? 1 : 0,
        next.shareCode,
        next.updatedAt,
        id
      );
  },

  deleteAgent(id: string): void {
    getDb().prepare("DELETE FROM agents WHERE id = ?").run(id);
  },

  agentStats(): { total: number; totalUses: number } {
    const db = getDb();
    const total = (db.prepare("SELECT COUNT(*) AS n FROM agents").get() as { n: number }).n;
    const totalUses = (
      db.prepare("SELECT COUNT(*) AS n FROM conversations WHERE personaId IS NOT NULL").get() as {
        n: number;
      }
    ).n;
    return { total, totalUses };
  },

  /** 各角色/智能体的真实使用次数：conversations 里绑定 personaId 的会话数 */
  personaUseCounts(): Record<string, number> {
    const rows = getDb()
      .prepare("SELECT personaId, COUNT(*) AS n FROM conversations WHERE personaId IS NOT NULL GROUP BY personaId")
      .all() as Array<{ personaId: string; n: number }>;
    const map: Record<string, number> = {};
    for (const r of rows) map[r.personaId] = r.n;
    return map;
  },

  // ---------------- 知识库 ----------------

  listKnowledgeBases(): StoredKnowledgeBase[] {
    const rows = getDb()
      .prepare("SELECT * FROM knowledge_bases ORDER BY updatedAt DESC")
      .all() as Record<string, unknown>[];
    return rows.map((r) => withKbStats(rowToKnowledgeBase(r)));
  },

  getKnowledgeBase(id: string): StoredKnowledgeBase | null {
    const row = getDb().prepare("SELECT * FROM knowledge_bases WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    return row ? withKbStats(rowToKnowledgeBase(row)) : null;
  },

  createKnowledgeBase(a: {
    id: string;
    name: string;
    desc?: string;
    tags?: string[];
    semantic?: boolean;
    qa?: boolean;
    cite?: boolean;
    createdAt: number;
  }): void {
    getDb()
      .prepare(
        `INSERT INTO knowledge_bases (id, name, desc, tags, semantic, qa, cite, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        a.id,
        a.name,
        a.desc ?? "",
        JSON.stringify(a.tags ?? []),
        a.semantic === false ? 0 : 1,
        a.qa === false ? 0 : 1,
        a.cite === false ? 0 : 1,
        a.createdAt,
        a.createdAt
      );
  },

  updateKnowledgeBase(
    id: string,
    patch: Partial<Pick<StoredKnowledgeBase, "name" | "desc" | "tags" | "semantic" | "qa" | "cite">>
  ): void {
    const row = getDb().prepare("SELECT * FROM knowledge_bases WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    if (!row) return;
    const cur = rowToKnowledgeBase(row);
    const next = { ...cur, ...patch, updatedAt: Date.now() };
    getDb()
      .prepare(
        `UPDATE knowledge_bases SET name=?, desc=?, tags=?, semantic=?, qa=?, cite=?, updatedAt=? WHERE id=?`
      )
      .run(
        next.name,
        next.desc,
        JSON.stringify(next.tags),
        next.semantic ? 1 : 0,
        next.qa ? 1 : 0,
        next.cite ? 1 : 0,
        next.updatedAt,
        id
      );
  },

  deleteKnowledgeBase(id: string): void {
    const db = getDb();
    db.prepare("DELETE FROM kb_documents WHERE kbId = ?").run(id);
    db.prepare("DELETE FROM knowledge_bases WHERE id = ?").run(id);
  },

  listKbDocuments(kbId: string): StoredDocument[] {
    const rows = getDb()
      .prepare(
        `SELECT d.* FROM kb_documents k JOIN documents d ON d.id = k.documentId
         WHERE k.kbId = ? ORDER BY k.createdAt DESC`
      )
      .all(kbId) as Record<string, unknown>[];
    return rows.map(rowToDocument);
  },

  addKbDocument(kbId: string, documentId: string): boolean {
    const kb = getDb().prepare("SELECT id FROM knowledge_bases WHERE id = ?").get(kbId);
    const doc = getDb().prepare("SELECT id FROM documents WHERE id = ?").get(documentId);
    if (!kb || !doc) return false;
    getDb()
      .prepare("INSERT OR IGNORE INTO kb_documents (kbId, documentId, createdAt) VALUES (?, ?, ?)")
      .run(kbId, documentId, Date.now());
    return true;
  },

  removeKbDocument(kbId: string, documentId: string): void {
    getDb().prepare("DELETE FROM kb_documents WHERE kbId = ? AND documentId = ?").run(kbId, documentId);
  },

  // ---------------- 通知 ----------------

  listNotifications(limit = 30): StoredNotification[] {
    const rows = getDb()
      .prepare("SELECT * FROM notifications ORDER BY createdAt DESC LIMIT ?")
      .all(limit) as Record<string, unknown>[];
    return rows.map(rowToNotification);
  },

  addNotification(n: {
    type?: string;
    title: string;
    body?: string;
    link?: string | null;
  }): StoredNotification {
    const rec: StoredNotification = {
      id: `n-${Date.now()}-${randomUUID().slice(0, 8)}`,
      type: n.type ?? "info",
      title: n.title,
      body: n.body ?? "",
      link: n.link ?? null,
      read: false,
      createdAt: Date.now(),
    };
    getDb()
      .prepare("INSERT INTO notifications (id, type, title, body, link, read, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(rec.id, rec.type, rec.title, rec.body, rec.link, 0, rec.createdAt);
    return rec;
  },

  markNotificationsRead(ids?: string[]): void {
    const db = getDb();
    if (!ids || ids.length === 0) {
      db.prepare("UPDATE notifications SET read = 1 WHERE read = 0").run();
      return;
    }
    const placeholders = ids.map(() => "?").join(",");
    db.prepare(`UPDATE notifications SET read = 1 WHERE id IN (${placeholders})`).run(...ids);
  },

  unreadCount(): number {
    const row = getDb().prepare("SELECT COUNT(*) AS n FROM notifications WHERE read = 0").get() as {
      n: number;
    };
    return row.n;
  },

  // ---------------- 积分 ----------------

  creditBalance(): number {
    const row = getDb().prepare("SELECT COALESCE(SUM(delta), 0) AS n FROM credit_ledger").get() as {
      n: number;
    };
    return row.n;
  },

  creditLedger(limit = 50): Array<{ id: string; delta: number; reason: string; ref: string | null; createdAt: number }> {
    const rows = getDb()
      .prepare("SELECT * FROM credit_ledger ORDER BY createdAt DESC LIMIT ?")
      .all(limit) as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      id: r.id as string,
      delta: r.delta as number,
      reason: (r.reason as string) ?? "",
      ref: (r.ref as string | null) ?? null,
      createdAt: r.createdAt as number,
    }));
  },

  addCredits(delta: number, reason: string, ref?: string | null): void {
    if (!delta) return;
    getDb()
      .prepare("INSERT INTO credit_ledger (id, delta, reason, ref, createdAt) VALUES (?, ?, ?, ?, ?)")
      .run(`c-${Date.now()}-${randomUUID().slice(0, 8)}`, delta, reason, ref ?? null, Date.now());
  },

  /** 今日是否已签到 */
  checkedInToday(): boolean {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const row = getDb()
      .prepare("SELECT COUNT(*) AS n FROM credit_ledger WHERE reason = ? AND createdAt >= ?")
      .get("每日签到", start.getTime()) as { n: number };
    return row.n > 0;
  },

  /* ─────────────────────────── 账号（本地版） ─────────────────────────── */

  createUser(u: {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    provider?: string;
    providerUserId?: string;
  }): void {
    getDb()
      .prepare(
        "INSERT INTO users (id, email, name, passwordHash, provider, providerUserId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(u.id, u.email, u.name, u.passwordHash, u.provider ?? "", u.providerUserId ?? "", Date.now());
  },

  findUserByEmail(email: string): {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    provider: string;
    providerUserId: string;
    createdAt: number;
  } | null {
    const r = getDb().prepare("SELECT * FROM users WHERE email = ?").get(email) as
      | Record<string, unknown>
      | undefined;
    return r
      ? {
          id: r.id as string,
          email: r.email as string,
          name: r.name as string,
          passwordHash: r.passwordHash as string,
          provider: (r.provider as string) ?? "",
          providerUserId: (r.providerUserId as string) ?? "",
          createdAt: r.createdAt as number,
        }
      : null;
  },

  /** 按 OAuth 三方身份查找用户 */
  findUserByProvider(provider: string, providerUserId: string): {
    id: string;
    email: string;
    name: string;
    provider: string;
    providerUserId: string;
    createdAt: number;
  } | null {
    const r = getDb()
      .prepare("SELECT * FROM users WHERE provider = ? AND providerUserId = ?")
      .get(provider, providerUserId) as Record<string, unknown> | undefined;
    return r
      ? {
          id: r.id as string,
          email: r.email as string,
          name: r.name as string,
          provider: (r.provider as string) ?? "",
          providerUserId: (r.providerUserId as string) ?? "",
          createdAt: r.createdAt as number,
        }
      : null;
  },

  /** 为已有本地账号绑定 OAuth 身份（邮箱相同即视为同一人） */
  setUserProvider(userId: string, provider: string, providerUserId: string): void {
    getDb()
      .prepare("UPDATE users SET provider = ?, providerUserId = ? WHERE id = ?")
      .run(provider, providerUserId, userId);
  },

  findUserById(id: string): { id: string; email: string; name: string; createdAt: number } | null {
    const r = getDb().prepare("SELECT id, email, name, createdAt FROM users WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    return r
      ? { id: r.id as string, email: r.email as string, name: r.name as string, createdAt: r.createdAt as number }
      : null;
  },

  createSession(token: string, userId: string, expiresAt: number): void {
    getDb()
      .prepare("INSERT INTO sessions (token, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)")
      .run(token, userId, Date.now(), expiresAt);
  },

  findSessionUser(token: string): { id: string; email: string; name: string; createdAt: number } | null {
    const db = getDb();
    const r = db
      .prepare("SELECT * FROM sessions WHERE token = ? AND expiresAt > ?")
      .get(token, Date.now()) as Record<string, unknown> | undefined;
    if (!r) return null;
    const u = db
      .prepare("SELECT id, email, name, createdAt FROM users WHERE id = ?")
      .get(r.userId as string) as Record<string, unknown> | undefined;
    return u
      ? { id: u.id as string, email: u.email as string, name: u.name as string, createdAt: u.createdAt as number }
      : null;
  },

  /** 删除账号：用户 + 会话（级联消息）+ 网关用量；积分账本为全局记录，不随删号变动 */
  deleteUserAccount(userId: string): void {
    const db = getDb();
    db.prepare("DELETE FROM conversations WHERE userId = ?").run(userId);
    db.prepare("DELETE FROM gateway_usage WHERE userId = ?").run(userId);
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);
  },

  /** 账号数据导出（GDPR 风格）：资料 + 会话/消息 + 用量汇总 */
  getUserAccountExport(userId: string) {
    const db = getDb();
    const user = db.prepare("SELECT id, email, name, provider, createdAt FROM users WHERE id = ?").get(userId) as
      | Record<string, unknown>
      | undefined;
    if (!user) return null;
    const conversations = this.listConversations(undefined, userId).map((c) => ({
      ...c,
      messages: this.getMessages(c.id),
    }));
    const usage = db
      .prepare(
        `SELECT modelId, providerId, fallback, status, inputTokens, outputTokens, costUsd, credits, latencyMs, createdAt
         FROM gateway_usage WHERE userId = ? ORDER BY createdAt DESC`
      )
      .all(userId);
    return {
      app: "opencanvas",
      schema: "account-export-v1",
      exportedAt: new Date().toISOString(),
      account: { id: user.id, email: user.email, name: user.name, provider: user.provider, createdAt: user.createdAt },
      conversations,
      gatewayUsage: usage,
      note: "本地版提示词模板/知识库/积分账本为全局共享数据，不含个人归属字段，故未包含在本导出中。",
    };
  },

  deleteSession(token: string): void {
    getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
  },
};

/** 案例分享（方案 B：服务器公开链接） */
export interface CaseShareRecord {
  code: string;
  templateId: string;
  label: string;
  prompt: string;
  values: Record<string, string>;
  output?: string;
  image?: string;
  source?: string;
}

export function createCaseShare(rec: Omit<CaseShareRecord, "code">): string {
  const db = getDb();
  const code = randomUUID().replace(/-/g, "").slice(0, 12);
  db.prepare("INSERT INTO case_shares (code, data, createdAt) VALUES (?, ?, ?)").run(
    code,
    JSON.stringify(rec),
    Date.now()
  );
  return code;
}

/* ---------------- 网关用量 & 成本 ---------------- */

export interface GatewayUsageInput {
  userId?: string | null;
  sessionId?: string | null;
  modelId: string;
  providerId: string;
  fallback?: boolean;
  status?: "success" | "error";
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  credits?: number;
  latencyMs?: number;
  error?: string;
}

export interface GatewayStatsPoint {
  date: string; // YYYY-MM-DD
  calls: number;
  errors: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  credits: number;
}

export interface GatewayStats {
  /** 今日 */
  today: GatewayStatsPoint;
  /** 近 7 天（含今日） */
  week: GatewayStatsPoint[];
  totals: GatewayStatsPoint;
  /** 按模型聚合（近 7 天，按成本降序） */
  byModel: { modelId: string; providerId: string; calls: number; costUsd: number; credits: number }[];
  latest: { modelId: string; providerId: string; status: string; costUsd: number; createdAt: number }[];
}

export function logGatewayUsage(r: GatewayUsageInput): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO gateway_usage (id, userId, sessionId, modelId, providerId, fallback, status, inputTokens, outputTokens, costUsd, credits, latencyMs, error, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    randomUUID(),
    r.userId ?? null,
    r.sessionId ?? null,
    r.modelId,
    r.providerId,
    r.fallback ? 1 : 0,
    r.status ?? "success",
    r.inputTokens ?? 0,
    r.outputTokens ?? 0,
    r.costUsd ?? 0,
    r.credits ?? 0,
    r.latencyMs ?? 0,
    (r.error ?? "").slice(0, 500),
    Date.now()
  );
}

function toStatsPoint(rows: { date?: string; calls: number; errors: number; inputTokens: number; outputTokens: number; costUsd: number; credits: number }[]): GatewayStatsPoint {
  const out: GatewayStatsPoint = {
    date: rows[0]?.date ?? "",
    calls: 0,
    errors: 0,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    credits: 0,
  };
  for (const r of rows) {
    out.calls += r.calls;
    out.errors += r.errors;
    out.inputTokens += r.inputTokens;
    out.outputTokens += r.outputTokens;
    out.costUsd += r.costUsd;
    out.credits += r.credits;
  }
  return out;
}

const dateKey = (ts: number) => new Date(ts).toISOString().slice(0, 10);
const dayStart = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** 用量统计：scope=null 当前显式 userId；scope="all" 全局（仅管理端调用） */
export function getGatewayStats(userId: string | null, scopeAll = false): GatewayStats {
  const db = getDb();
  const where = scopeAll ? "" : userId ? "WHERE userId = ?" : "WHERE userId IS NULL";
  const params = scopeAll ? [] : userId ? [userId] : [];

  const today0 = dayStart(Date.now());
  const todayRows = db
    .prepare(
      `SELECT COUNT(*) AS calls,
              SUM(CASE WHEN status='error' THEN 1 ELSE 0 END) AS errors,
              COALESCE(SUM(inputTokens),0) AS inputTokens,
              COALESCE(SUM(outputTokens),0) AS outputTokens,
              COALESCE(SUM(costUsd),0) AS costUsd,
              COALESCE(SUM(credits),0) AS credits
       FROM gateway_usage ${where} AND createdAt >= ?`
    )
    .all(...params, today0) as unknown as { calls: number; errors: number; inputTokens: number; outputTokens: number; costUsd: number; credits: number }[];
  const today = { ...toStatsPoint(todayRows), date: dateKey(today0) };

  // 近 7 天逐日
  const week0 = today0 - 6 * 86_400_000;
  const weekRows = db
    .prepare(
      `SELECT date(createdAt/1000, 'unixepoch') AS date,
              COUNT(*) AS calls,
              SUM(CASE WHEN status='error' THEN 1 ELSE 0 END) AS errors,
              COALESCE(SUM(inputTokens),0) AS inputTokens,
              COALESCE(SUM(outputTokens),0) AS outputTokens,
              COALESCE(SUM(costUsd),0) AS costUsd,
              COALESCE(SUM(credits),0) AS credits
       FROM gateway_usage ${where} AND createdAt >= ?
       GROUP BY date ORDER BY date`
    )
    .all(...params, week0) as unknown as { date: string; calls: number; errors: number; inputTokens: number; outputTokens: number; costUsd: number; credits: number }[];
  const byDay = new Map(weekRows.map((r) => [r.date, r]));
  const week: GatewayStatsPoint[] = [];
  for (let i = 0; i < 7; i++) {
    const t = week0 + i * 86_400_000;
    const k = dateKey(t);
    const row = byDay.get(k);
    week.push({ date: k, calls: row?.calls ?? 0, errors: row?.errors ?? 0, inputTokens: row?.inputTokens ?? 0, outputTokens: row?.outputTokens ?? 0, costUsd: row?.costUsd ?? 0, credits: row?.credits ?? 0 });
  }

  const totals = { ...toStatsPoint(weekRows), date: week[0]?.date ?? "" };

  const byModel = db
    .prepare(
      `SELECT modelId, providerId,
              COUNT(*) AS calls,
              COALESCE(SUM(costUsd),0) AS costUsd,
              COALESCE(SUM(credits),0) AS credits
       FROM gateway_usage ${where} AND createdAt >= ?
       GROUP BY modelId, providerId ORDER BY costUsd DESC LIMIT 8`
    )
    .all(...params, week0) as unknown as { modelId: string; providerId: string; calls: number; costUsd: number; credits: number }[];

  const latest = db
    .prepare(
      `SELECT modelId, providerId, status, costUsd, createdAt
       FROM gateway_usage ${where}
       ORDER BY createdAt DESC LIMIT 5`
    )
    .all(...params) as unknown as { modelId: string; providerId: string; status: string; costUsd: number; createdAt: number }[];

  return { today, week, totals, byModel, latest };
}

/** 产物分享（只读公开页：PPT / 文档 / 图片 / 研究报告） */
export type ArtifactShareKind = "slides" | "docs" | "image" | "report";

export interface ArtifactShareRecord {
  code: string;
  kind: ArtifactShareKind;
  data: Record<string, unknown>;
  createdAt: number;
}

export function createArtifactShare(kind: ArtifactShareKind, data: Record<string, unknown>): string {
  const db = getDb();
  const code = randomUUID().replace(/-/g, "").slice(0, 12);
  db.prepare("INSERT INTO artifact_shares (code, kind, data, createdAt) VALUES (?, ?, ?, ?)").run(
    code,
    kind,
    JSON.stringify(data),
    Date.now()
  );
  return code;
}

export function getArtifactShare(code: string): ArtifactShareRecord | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM artifact_shares WHERE code = ?").get(code) as
    | { kind: string; data: string; createdAt: number }
    | undefined;
  if (!row) return null;
  try {
    return { code, kind: row.kind as ArtifactShareKind, data: JSON.parse(row.data) as Record<string, unknown>, createdAt: row.createdAt };
  } catch {
    return null;
  }
}

export function getCaseShare(code: string): CaseShareRecord | null {
  const db = getDb();
  const row = db.prepare("SELECT data FROM case_shares WHERE code = ?").get(code) as
    | { data: string }
    | undefined;
  if (!row) return null;
  try {
    return { code, ...(JSON.parse(row.data) as Omit<CaseShareRecord, "code">) };
  } catch {
    return null;
  }
}

/* ---------------- 会员 & 订单 ---------------- */

export type MembershipPlan = "free" | "pro" | "team";

export interface StoredMembership {
  id: string;
  plan: MembershipPlan;
  autoRenew: boolean;
  renewAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface StoredOrder {
  id: string;
  plan: MembershipPlan;
  amount: number; // 元
  status: "paid" | "pending" | "cancelled";
  createdAt: number;
}

const SELF_ID = "self";

function rowToMembership(r: Record<string, unknown>): StoredMembership {
  return {
    id: r.id as string,
    plan: (r.plan as MembershipPlan) ?? "free",
    autoRenew: Boolean(r.autoRenew),
    renewAt: r.renewAt ? (r.renewAt as number) : null,
    createdAt: r.createdAt as number,
    updatedAt: r.updatedAt as number,
  };
}

function rowToOrder(r: Record<string, unknown>): StoredOrder {
  return {
    id: r.id as string,
    plan: (r.plan as MembershipPlan) ?? "free",
    amount: (r.amount as number) ?? 0,
    status: (r.status as StoredOrder["status"]) ?? "paid",
    createdAt: r.createdAt as number,
  };
}

export const membershipRepo = {
  /** 获取当前会员；若无则自动创建默认“专业版”试用会员 */
  get(): StoredMembership {
    const db = getDb();
    const row = db.prepare("SELECT * FROM membership WHERE id = ?").get(SELF_ID) as
      | Record<string, unknown>
      | undefined;
    if (row) return rowToMembership(row);

    const now = Date.now();
    const renewAt = now + 30 * 24 * 60 * 60 * 1000;
    db.prepare(
      "INSERT INTO membership (id, plan, autoRenew, renewAt, createdAt, updatedAt) VALUES (?, 'pro', 1, ?, ?, ?)"
    ).run(SELF_ID, renewAt, now, now);
    return membershipRepo.get();
  },

  upgrade(plan: MembershipPlan, amount: number): { membership: StoredMembership; order: StoredOrder } {
    const db = getDb();
    const now = Date.now();
    const id = randomUUID();
    db.prepare("INSERT INTO orders (id, plan, amount, status, createdAt) VALUES (?, ?, ?, 'paid', ?)").run(
      id,
      plan,
      amount,
      now
    );
    const renewAt = now + 30 * 24 * 60 * 60 * 1000;
    db.prepare(
      "UPDATE membership SET plan = ?, autoRenew = 1, renewAt = ?, updatedAt = ? WHERE id = ?"
    ).run(plan, renewAt, now, SELF_ID);
    return {
      membership: membershipRepo.get(),
      order: { id, plan, amount, status: "paid", createdAt: now },
    };
  },

  cancelAutoRenew(): StoredMembership {
    const db = getDb();
    db.prepare("UPDATE membership SET autoRenew = 0, updatedAt = ? WHERE id = ?").run(Date.now(), SELF_ID);
    return membershipRepo.get();
  },

  listOrders(): StoredOrder[] {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM orders ORDER BY createdAt DESC").all() as Record<string, unknown>[];
    return rows.map(rowToOrder);
  },

  stats(): { conversations: number; messages: number; exports: number } {
    const db = getDb();
    const conversations = (
      db.prepare("SELECT COUNT(*) AS n FROM conversations").get() as { n: number }
    ).n;
    const messages = (db.prepare("SELECT COUNT(*) AS n FROM messages").get() as { n: number }).n;
    const exports = (
      db.prepare(
        "SELECT COUNT(*) AS n FROM conversations WHERE deck IS NOT NULL OR report IS NOT NULL OR doc IS NOT NULL"
      ).get() as { n: number }
    ).n;
    return { conversations, messages, exports };
  },
};
