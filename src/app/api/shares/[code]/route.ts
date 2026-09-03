import { resolveShare, type SharePayload } from "@/lib/share";
import { getShareComments, trackShareView } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 分享码统一解析：GET /api/shares/:code
 * 返回 { kind, title, description, data, views, comments }（PPT/文档/图片/报告/智能体/模板/案例通用）。
 * 每次真实分享页加载会计数一次访问（views）。
 */
export async function GET(_req: Request, props: { params: Promise<{ code: string }> }) {
  const params = await props.params;
  const payload = resolveShare(params.code);
  if (!payload) return Response.json({ error: "分享不存在或已取消" }, { status: 404 });
  const views = trackShareView(params.code, payload.kind);
  return Response.json({
    ...(payload satisfies SharePayload),
    views,
    comments: getShareComments(params.code),
  });
}
