import { repo } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 新增一条消息（流式结束后保存最终内容） */
export async function POST(req: Request) {
  const body = (await req.json()) as {
    id?: string;
    conversationId?: string;
    role?: string;
    content?: string;
    error?: boolean;
    refs?: unknown;
  };
  if (!body.id || !body.conversationId || !body.role || body.content === undefined) {
    return Response.json({ error: "参数不完整" }, { status: 400 });
  }
  repo.insertMessage({
    id: body.id,
    conversationId: body.conversationId,
    role: body.role,
    content: body.content,
    error: body.error ?? false,
    refs: body.refs ?? null,
  });
  return Response.json({ ok: true });
}

/** 删除消息：DELETE /api/messages?conversationId=..&ids=a,b（重新生成/编辑重发用） */
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const conversationId = url.searchParams.get("conversationId");
  const ids = (url.searchParams.get("ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!conversationId || ids.length === 0) {
    return Response.json({ error: "参数不完整" }, { status: 400 });
  }
  repo.deleteMessages(conversationId, ids);
  return Response.json({ ok: true });
}
