import { getGatewayStats } from "@/lib/db/repo";
import { getUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 网关用量/成本看板：GET /api/gateway/stats?scope=me
 * - scope=me（默认）：当前登录用户（未登录 = 本地匿名）
 * - scope=all：全局（需请求头 x-admin-key 匹配 GATEWAY_ADMIN_KEY）
 */
export async function GET(req: Request) {
  const scope = new URL(req.url).searchParams.get("scope") ?? "me";
  const user = getUserFromRequest(req);

  if (scope === "all") {
    const key = req.headers.get("x-admin-key") ?? "";
    const admin = process.env.GATEWAY_ADMIN_KEY;
    if (!admin || key !== admin) {
      return Response.json({ error: "需要管理员密钥（GATEWAY_ADMIN_KEY）" }, { status: 403 });
    }
    return Response.json({ scope: "all", stats: getGatewayStats(null, true) });
  }

  return Response.json({ scope: "me", stats: getGatewayStats(user?.id ?? null, false) });
}
