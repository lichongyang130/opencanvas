import { repo } from "@/lib/db/repo";
import { getUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 列出会话（不含消息，用于侧栏）。
 * ?archived=0（默认，活跃） | 1（归档） | all（全部）
 * 账号隔离：登录用户见「自己的 + 本地旧会话」，未登录仅见本地旧会话。
 */
export async function GET(req: Request) {
  const archivedParam = new URL(req.url).searchParams.get("archived");
  const filter = archivedParam === "1" ? 1 : archivedParam === "all" ? undefined : 0;
  const user = getUserFromRequest(req);
  return Response.json({ conversations: repo.listConversations(filter, user ? user.id : null) });
}

/** 创建会话（归属当前登录用户；未登录为本地 NULL） */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    title?: string;
    mode?: string;
    model?: string;
  };
  if (!body.id) {
    return Response.json({ error: "缺少 id" }, { status: 400 });
  }
  const user = getUserFromRequest(req);
  repo.upsertConversation({
    id: body.id,
    title: body.title ?? "新任务",
    mode: body.mode ?? "chat",
    model: body.model ?? "demo",
    userId: user ? user.id : null,
  });
  return Response.json({ ok: true });
}
