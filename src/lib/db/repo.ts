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
  createdAt: number;
}

export interface StoredImage {
  id: string;
  prompt: string;
  model: string;
  url: string; // data: 或 http(s)
  createdAt: number;
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
    archived: Boolean(r.archived),
    pinned: Boolean(r.pinned),
    createdAt: r.createdAt as number,
    updatedAt: r.updatedAt as number,
  };
}

export const repo = {
  /** archivedFilter: 0=活跃 1=归档 undefined=全部 */
  listConversations(archivedFilter?: 0 | 1): StoredConversation[] {
    const where =
      archivedFilter === undefined ? "" : ` WHERE archived = ${archivedFilter ? 1 : 0}`;
    const rows = getDb()
      .prepare(
        `SELECT * FROM conversations${where} ORDER BY pinned DESC, updatedAt DESC`
      )
      .all() as Record<string, unknown>[];
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
      if (c.archived !== undefined) set("archived", c.archived ? 1 : 0);
      if (c.pinned !== undefined) set("pinned", c.pinned ? 1 : 0);

      if (sets.length > 0) {
        sets.push("updatedAt = ?");
        params.push(now, c.id);
        db.prepare(`UPDATE conversations SET ${sets.join(", ")} WHERE id = ?`).run(...params);
      }
    } else {
      db.prepare(
        `INSERT INTO conversations (id, title, mode, model, modelProvider, deck, deckStatus, images, report, doc, personaId, archived, pinned, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
  }): void {
    getDb()
      .prepare(
        "INSERT INTO messages (id, conversationId, role, content, error, createdAt) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(m.id, m.conversationId, m.role, m.content, m.error ? 1 : 0, Date.now());
    getDb().prepare("UPDATE conversations SET updatedAt = ? WHERE id = ?").run(Date.now(), m.conversationId);
  },

  /** 更新消息内容（重新生成时覆盖同一条，避免历史里堆叠旧版本） */
  updateMessage(id: string, content: string, error?: boolean): void {
    getDb()
      .prepare("UPDATE messages SET content = ?, error = ? WHERE id = ?")
      .run(content, error ? 1 : 0, id);
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
