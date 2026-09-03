import { getProviderConfigStatus, isFallbackEnabled, getRateLimitPerMin } from "@/lib/gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 网关运行配置（只读，不含密钥）：供设置中心展示 */
export async function GET() {
  return Response.json({
    fallback: isFallbackEnabled(),
    rateLimitPerMin: getRateLimitPerMin(),
    /** 各供应商是否有可用密钥（服务端 env 或前台 BYOK 由前端自行判断） */
    providers: getProviderConfigStatus(),
    /** 是否配置管理密钥（成本看板全局视角） */
    adminEnabled: Boolean(process.env.GATEWAY_ADMIN_KEY),
  });
}
