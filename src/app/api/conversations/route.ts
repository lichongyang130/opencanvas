import { repo } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 列出会话（不含消息，用于侧栏）。
 * ?archived=0（默认，活跃） | 1（归档） | all（全部）
 */
export async function GET(req: Request) {
  const archivedParam = new URL(req.url).searchParams.get("archived");
  const filter = archivedParam === "1" ? 1 : archivedParam === "all" ? undefined : 0;
  return Response.json({ conversations: repo.listConversations(filter) });
}

/** 创建会话 */
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
  repo.upsertConversation({
    id: body.id,
    title: body.title ?? "新任务",
    mode: body.mode ?? "chat",
    model: body.model ?? "demo",
  });
  return Response.json({ ok: true });
}
