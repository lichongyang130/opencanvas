import { randomUUID } from "node:crypto";
import { getArtifactShare, repo, type ArtifactShareKind } from "@/lib/db/repo";
import { getUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODE_BY_KIND: Record<ArtifactShareKind, string> = {
  slides: "slides",
  docs: "docs",
  image: "image",
  report: "research",
};

/**
 * 复制共享产物到自己的工作台：POST /api/shares/:code/import
 * 服务端创建会话并写入产物（未登录归属本地 NULL，与普通新建会话一致），
 * 返回 { conversationId }，前端跳 /chat 并选中该会话。
 */
export async function POST(_req: Request, props: { params: Promise<{ code: string }> }) {
  const params = await props.params;
  const share = getArtifactShare(params.code);
  if (!share) {
    return Response.json({ error: "分享不存在或已取消" }, { status: 404 });
  }

  const user = getUserFromRequest(_req);
  const id = randomUUID();
  const now = Date.now();
  const data = share.data as Record<string, unknown>;

  const mode = MODE_BY_KIND[share.kind] ?? "chat";
  const patch: Record<string, unknown> = { mode };
  if (share.kind === "slides" && data.deck) patch.deck = data.deck;
  if (share.kind === "docs" && data.doc) patch.doc = data.doc;
  if (share.kind === "image" && data.images) patch.images = data.images;
  if (share.kind === "report" && data.report) patch.report = data.report;

  repo.upsertConversation({
    id,
    title: (data.title as string) ?? "分享产物",
    mode,
    model: "demo",
    userId: user ? user.id : null,
    ...patch,
  });

  return Response.json({ conversationId: id });
}
