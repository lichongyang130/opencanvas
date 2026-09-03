import { randomBytes } from "node:crypto";

/**
 * Google / GitHub OAuth 2.0 授权码流程（服务端）。
 * 凭据来自环境变量；redirect_uri 由 OAUTH_REDIRECT_BASE（或当前请求 origin）拼接，
 * 需要在对应平台控制台把回调地址登记为：
 *   https://<你的域名>/api/auth/oauth/google/callback
 *   https://<你的域名>/api/auth/oauth/github/callback
 */

export type OAuthProvider = "google" | "github";

export const OAUTH_STATE_COOKIE = "oc_oauth_state";
const STATE_TTL = 600_000; // 10 分钟

export interface OAuthProviderConfig {
  provider: OAuthProvider;
  clientId: string;
  clientSecret: string;
  /** 完整回调地址 */
  redirectUri: string;
}

export function newOAuthState(): string {
  return randomBytes(24).toString("hex");
}

export function oauthStateCookie(state: string): string {
  return `${OAUTH_STATE_COOKIE}=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${STATE_TTL / 1000}`;
}

export function clearOAuthStateCookie(): string {
  return `${OAUTH_STATE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function oauthProviderConfig(provider: OAuthProvider, base: string): OAuthProviderConfig | null {
  const clientId =
    provider === "google" ? process.env.GOOGLE_CLIENT_ID : process.env.GITHUB_CLIENT_ID;
  const clientSecret =
    provider === "google" ? process.env.GOOGLE_CLIENT_SECRET : process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const redirectBase = (process.env.OAUTH_REDIRECT_BASE || base).replace(/\/+$/, "");
  return {
    provider,
    clientId,
    clientSecret,
    redirectUri: `${redirectBase}/api/auth/oauth/${provider}/callback`,
  };
}

export function oauthProvidersConfigured(base: string): Record<OAuthProvider, boolean> {
  return {
    google: Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ),
    github: Boolean(
      process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ),
  };
}

export function oauthAuthorizeUrl(cfg: OAuthProviderConfig, state: string): string {  const q = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    state,
  });
  if (cfg.provider === "google") {
    q.set("response_type", "code");
    q.set("scope", "openid email profile");
    q.set("access_type", "online");
    q.set("prompt", "select_account");
    return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
  }
  q.set("scope", "read:user user:email");
  return `https://github.com/login/oauth/authorize?${q}`;
}

/** 网络/5xx 瞬时失败重试一次（4xx 不重试） */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const status = (err as { status?: number }).status ?? 0;
    if (status >= 400 && status < 500) throw err;
    return fn();
  }
}

/** code 换 access_token（客户端 JSON 返回） */
export async function exchangeOAuthCode(
  cfg: OAuthProviderConfig,
  code: string
): Promise<{ accessToken: string; idToken?: string }> {
  const form = new URLSearchParams({
    code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirectUri,
    grant_type: "authorization_code",
  });
  const url =
    cfg.provider === "google"
      ? "https://oauth2.googleapis.com/token"
      : "https://github.com/login/oauth/access_token";
  return withRetry(async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(cfg.provider === "github" ? { Accept: "application/json" } : {}),
      },
      body: form,
    });
    const data = (await res.json()) as { access_token?: string; id_token?: string; error_description?: string; error?: string };
    if (!res.ok || !data.access_token) {
      const e = new Error(data.error_description || data.error || `换取令牌失败 ${res.status}`);
      (e as Error & { status?: number }).status = res.status;
      throw e;
    }
    return { accessToken: data.access_token, idToken: data.id_token };
  });
}

/** 拉取用户资料（含 email；GitHub 邮箱可能需第二个接口） */
export async function fetchOAuthProfile(
  cfg: OAuthProviderConfig,
  accessToken: string
): Promise<{ id: string; email: string; name: string }> {
  if (cfg.provider === "google") {
    return withRetry(async () => {
      const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const e = new Error(`获取 Google 资料失败 ${res.status}`);
        (e as Error & { status?: number }).status = res.status;
        throw e;
      }
      const d = (await res.json()) as { sub?: string; email?: string; name?: string; email_verified?: boolean };
      if (!d.sub || !d.email) throw new Error("Google 未返回邮箱（请在应用配置中开启邮箱权限）");
      return { id: d.sub, email: d.email, name: d.name || d.email.split("@")[0] };
    });
  }
  // GitHub
  return withRetry(async () => {
    const res = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
    });
    if (!res.ok) {
      const e = new Error(`获取 GitHub 资料失败 ${res.status}`);
      (e as Error & { status?: number }).status = res.status;
      throw e;
    }
    const d = (await res.json()) as { id?: number; login?: string; name?: string; email?: string };
    if (!d.id || !d.login) throw new Error("GitHub 未返回用户信息");
    let email = d.email ?? "";
    if (!email) {
      const er = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
      });
      if (er.ok) {
        const list = (await er.json()) as { email?: string; primary?: boolean; verified?: boolean }[];
        email = list.find((e) => e.primary && e.verified)?.email ?? list.find((e) => e.verified)?.email ?? "";
      }
    }
    if (!email) throw new Error("GitHub 未公开邮箱，无法绑定账号（可在 GitHub 设置中公开邮箱后重试）");
    return { id: String(d.id), email, name: d.name || d.login };
  });
}
