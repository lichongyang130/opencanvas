import { getProviderConfigStatus } from "@/lib/gateway";
import { repo } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 健康检查：GET /api/health
 * 返回运行版本、进程信息、数据库可用性、供应商配置状态（不含任何密钥）。
 */
export async function GET() {
  let dbOk = false;
  try {
    repo.getConversation("__health__"); // 触发一次 DB 访问
    dbOk = true;
  } catch {
    dbOk = false;
  }

  return Response.json({
    ok: dbOk,
    service: "opencanvas",
    version: process.env.npm_package_version ?? "0.1.0",
    node: process.version,
    uptimeSec: Math.round(process.uptime()),
    now: Date.now(),
    db: dbOk ? "ok" : "error",
    providers: getProviderConfigStatus(),
    clientErrors: {
      enabled: true,
      endpoint: "/api/logs/client",
    },
  });
}
