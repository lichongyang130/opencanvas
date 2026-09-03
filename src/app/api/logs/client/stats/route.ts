import { getClientErrorStats } from "@/lib/db/repo";
import { getUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/logs/client/stats：诊断摘要（仅登录用户；不含 stack，消息+路径） */
export async function GET(req: Request) {
  const user = getUserFromRequest(req);
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
  const s = getClientErrorStats();
  return Response.json({
    stats: {
      total: s.total,
      last24h: s.last24h,
      top: s.top,
      recent: s.recent.map((r) => ({
        message: r.message,
        source: r.source,
        url: r.url,
        createdAt: r.createdAt,
      })),
    },
  });
}
