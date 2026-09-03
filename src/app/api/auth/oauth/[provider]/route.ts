import {
  newOAuthState,
  oauthAuthorizeUrl,
  oauthProviderConfig,
  oauthStateCookie,
  type OAuthProvider,
} from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 开始 Google / GitHub OAuth：生成 state（httpOnly cookie）并跳转授权页 */
export async function GET(req: Request, { params }: { params: { provider: string } }) {
  const provider = params.provider as OAuthProvider;
  if (provider !== "google" && provider !== "github") {
    return Response.json({ error: "不支持的 OAuth 供应商" }, { status: 400 });
  }
  const base = new URL(req.url).origin;
  const cfg = oauthProviderConfig(provider, base);
  if (!cfg) {
    return Response.json(
      { error: `未配置 ${provider === "google" ? "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET" : "GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET"}` },
      { status: 400 }
    );
  }
  const state = newOAuthState();
  const res = new Response(null, { status: 302, headers: { Location: oauthAuthorizeUrl(cfg, state) } });
  res.headers.append("Set-Cookie", oauthStateCookie(state));
  return res;
}
