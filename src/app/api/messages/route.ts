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
  });
  return Response.json({ ok: true });
}

/** 覆盖已有消息内容（「重新生成」用：同一条消息就地更新，不新增历史版本） */
export async function PATCH(req: Request) {
  const body = (await req.json()) as { id?: string; content?: string; error?: boolean };
  if (!body.id || body.content === undefined) {
    return Response.json({ error: "参数不完整" }, { status: 400 });
  }
  repo.updateMessage(body.id, body.content, body.error ?? false);
  return Response.json({ ok: true });
}
