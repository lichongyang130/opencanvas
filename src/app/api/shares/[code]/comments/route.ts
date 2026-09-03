import { resolveShare } from "@/lib/share";
import { addShareComment, getShareComments, getShareViews } from "@/lib/db/repo";
import { checkText } from "@/lib/moderation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CONTENT = 500;
const MAX_NICK = 24;

/** 评论列表：GET /api/shares/:code/comments */
export async function GET(_req: Request, props: { params: Promise<{ code: string }> }) {
  const params = await props.params;
  const payload = resolveShare(params.code);
  if (!payload) return Response.json({ error: "分享不存在或已取消" }, { status: 404 });
  return Response.json({ comments: getShareComments(params.code), views: getShareViews(params.code) });
}

/** 发表评论：POST /api/shares/:code/comments { nickname?, content } */
export async function POST(req: Request, props: { params: Promise<{ code: string }> }) {
  const params = await props.params;
  const payload = resolveShare(params.code);
  if (!payload) return Response.json({ error: "分享不存在或已取消" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { nickname?: string; content?: string };
  const content = (body.content ?? "").trim();
  if (!content) return Response.json({ error: "评论内容不能为空" }, { status: 400 });
  if (content.length > MAX_CONTENT) {
    return Response.json({ error: `评论过长（最多 ${MAX_CONTENT} 字）` }, { status: 400 });
  }
  const mod = checkText(content);
  if (!mod.ok) return Response.json({ error: mod.reason }, { status: 400 });

  const rawNick = (body.nickname ?? "").trim().replace(/\s+/g, " ");
  const nickname = rawNick.length > MAX_NICK ? rawNick.slice(0, MAX_NICK) : rawNick;

  const comment = addShareComment(params.code, nickname, content);
  return Response.json({ ok: true, comment, views: getShareViews(params.code) });
}
