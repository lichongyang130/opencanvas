import {
  clearOAuthStateCookie,
  exchangeOAuthCode,
  fetchOAuthProfile,
  oauthProviderConfig,
  OAUTH_STATE_COOKIE,
  type OAuthProvider,
} from "@/lib/oauth";
import { createSession, newUserId, sessionCookie } from "@/lib/auth";
import { repo } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** OAuth 回调：校验 state → 换 token → 拉资料 → 绑定/创建本地用户 → 建会话 → 回首页 */
export async function GET(req: Request, { params }: { params: { provider: string } }) {
  const provider = params.provider as OAuthProvider;
  const base = encodeURIComponent(new URL(req.url).origin);
  const bad = (reason: string, detail?: string) => {
    const d = detail ? `&detail=${encodeURIComponent(detail.slice(0, 120))}` : "";
    return new Response(null, { status: 302, headers: { Location: `/?oauth=error&reason=${reason}${d}` } });
  };
  try {
    if (provider !== "google" && provider !== "github") return bad("provider");
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const cookie = req.headers.get("cookie") ?? "";
    const m = cookie.match(new RegExp(`(?:^|;\\s*)${OAUTH_STATE_COOKIE}=([^;]+)`));
    if (!code || !state || !m) return bad("state", "缺少 code/state");
    if (m[1] !== state) return bad("state", "state 不匹配，请重新发起登录");

    const cfg = oauthProviderConfig(provider, new URL(req.url).origin);
    if (!cfg) return bad("config", "服务端未配置 OAuth 凭据");

    const { accessToken } = await exchangeOAuthCode(cfg, code);
    const profile = await fetchOAuthProfile(cfg, accessToken);
    const email = profile.email.trim().toLowerCase();
    if (!email) return bad("email", "未获得邮箱");

    // 绑定策略：先按三方身份，再按邮箱（同邮箱 = 同一人，自动绑定）
    let user = repo.findUserByProvider(provider, profile.id);
    if (!user) {
      const byEmail = repo.findUserByEmail(email);
      if (byEmail) {
        repo.setUserProvider(byEmail.id, provider, profile.id);
        user = byEmail;
      } else {
        const id = newUserId();
        repo.createUser({
          id,
          email,
          name: profile.name.trim() || email.split("@")[0],
          passwordHash: "",
          provider,
          providerUserId: profile.id,
        });
        const created = repo.findUserById(id);
        user = created ? { ...created, provider, providerUserId: profile.id } : null;
      }
    }
    if (!user) return bad("user", "账号创建失败");

    const token = createSession(user.id);
    const res = new Response(null, {
      status: 302,
      headers: { Location: `/?oauth=success&provider=${provider}` },
    });
    res.headers.append("Set-Cookie", sessionCookie(token));
    res.headers.append("Set-Cookie", clearOAuthStateCookie());
    return res;
  } catch (err) {
    return bad("server", err instanceof Error ? err.message : "登录失败");
  }
}

