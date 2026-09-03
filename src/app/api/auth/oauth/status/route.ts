import { oauthProvidersConfigured } from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** OAuth 登录配置状态（不泄露密钥） */
export async function GET(req: Request) {
  const base = new URL(req.url).origin;
  return Response.json(oauthProvidersConfigured(base));
}
