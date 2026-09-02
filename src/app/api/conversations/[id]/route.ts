import { repo } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 取单个会话 + 全部消息（切换会话时加载） */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const convo = repo.getConversation(params.id);
  if (!convo) return Response.json({ error: "不存在" }, { status: 404 });
  const messages = repo.getMessages(params.id);
  return Response.json({ conversation: convo, messages });
}

/** 更新会话（标题/模式/模型/PPT 产物/归档/置顶） */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = (await req.json()) as {
    title?: string;
    mode?: string;
    model?: string;
    modelProvider?: string | null;
    deck?: unknown;
    deckStatus?: string | null;
    images?: unknown;
    report?: unknown;
    doc?: unknown;
    personaId?: string | null;
    personaSystem?: string | null;
    codePreview?: unknown;
    kbId?: string | null;
    archived?: boolean;
    pinned?: boolean;
  };
  if (!repo.getConversation(params.id)) {
    return Response.json({ error: "不存在" }, { status: 404 });
  }

  // 标记类字段（归档/置顶/重命名）单独处理，避免覆盖
  if (body.archived !== undefined || body.pinned !== undefined || body.title !== undefined) {
    repo.patchFlags(params.id, {
      archived: body.archived,
      pinned: body.pinned,
      title: body.title,
    });
  }

  // 产物类字段
  if (
    body.mode !== undefined ||
    body.model !== undefined ||
    body.modelProvider !== undefined ||
    body.deck !== undefined ||
    body.deckStatus !== undefined ||
    body.images !== undefined ||
    body.report !== undefined ||
    body.doc !== undefined ||
    body.personaId !== undefined ||
    body.personaSystem !== undefined ||
    body.codePreview !== undefined ||
    body.kbId !== undefined
  ) {
    repo.upsertConversation({
      id: params.id,
      mode: body.mode,
      model: body.model,
      modelProvider: body.modelProvider,
      deck: body.deck,
      deckStatus: body.deckStatus,
      images: body.images as never,
      report: body.report,
      doc: body.doc,
      personaId: body.personaId,
      personaSystem: body.personaSystem,
      codePreview: body.codePreview,
      kbId: body.kbId,
    });
  }
  return Response.json({ ok: true });
}

/** 删除会话（级联删消息） */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  repo.deleteConversation(params.id);
  return Response.json({ ok: true });
}
