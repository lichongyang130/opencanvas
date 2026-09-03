import { resolveShare, type SharePayload } from "@/lib/share";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 分享码统一解析：GET /api/shares/:code
 * 返回 { kind, title, description, data }（PPT/文档/图片/报告/智能体/模板/案例通用结构）。
 */
export async function GET(_req: Request, props: { params: Promise<{ code: string }> }) {
 const params = await props.params;
 const payload = resolveShare(params.code);
 if (!payload) return Response.json({ error: "分享不存在或已取消" }, { status: 404 });
 return Response.json(payload satisfies SharePayload);
}
