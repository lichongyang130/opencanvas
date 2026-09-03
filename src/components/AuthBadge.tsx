"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Crown, Github, Loader2, LogIn, LogOut, Mail, UserRound } from "lucide-react";
import { toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";
import { refreshAuth, setAuthUser, useAuthStore, type AuthUser } from "@/lib/store/auth";
import { useI18n } from "@/lib/i18n";

/** Google 官方四色 G 图标（内联 SVG） */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a12.01 12.01 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

/**
 * 账号徽章（本地版）：
 * - variant="badge"（默认）：顶栏紧凑「登录」按钮 / 头像昵称下拉
 * - variant="card"：侧栏底部用户卡片（未登录 = 登录/注册；已登录 = 账户卡片 + 下拉）
 * 两形态共享 useAuthStore，状态实时同步；弹窗/菜单经 Portal 挂 body + fixed 最高层，不被遮挡。
 */
export default function AuthBadge({ variant = "badge" }: { variant?: "badge" | "card" }) {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [oauthStatus, setOauthStatus] = useState<{ google: boolean; github: boolean } | null>(null);

  useEffect(() => {
    void refreshAuth();
  }, []);

  // 恢复会话 + 读取 OAuth 配置状态 + OAuth 回调结果提示（/?oauth=success|error）
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const oauth = sp.get("oauth");
    if (oauth) {
      if (oauth === "success") {
        toast(t("auth.oauthSuccess", { provider: sp.get("provider") === "google" ? "Google" : "GitHub" }), "success");
      } else if (oauth === "error") {
        toast(
          sp.get("reason") === "config"
            ? t("auth.oauthNotConfigured")
            : t("auth.oauthFailed", { detail: sp.get("detail") ?? sp.get("reason") ?? t("auth.oauthFailedUnknown") }),
          "error"
        );
      }
      window.history.replaceState(null, "", window.location.pathname);
      void refreshAuth();
    }
    fetch("/api/auth/oauth/status")
      .then((r) => r.json())
      .then((d: { google?: boolean; github?: boolean }) => setOauthStatus({ google: !!d.google, github: !!d.github }))
      .catch(() => setOauthStatus({ google: false, github: false }));
  }, [t]);

  /** 第三方登录：未配置则提示，配置则跳转授权 */
  const oauthLogin = (provider: "google" | "github") => {
    const ok = oauthStatus?.[provider];
    if (ok === false) {
      toast(
        provider === "google"
          ? "未配置 GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET（查看 .env.example）"
          : "未配置 GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET（查看 .env.example）",
        "error"
      );
      return;
    }
    window.location.href = `/api/auth/oauth/${provider}`;
  };

  // 头像下拉外点关闭（btnRef 触发钮 + panelRef 面板双判断；滚动/缩放时收起避免错位）
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    const onScroll = () => setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [menuOpen]);

  /** 打开/关闭下拉：锚定到触发按钮下方（左/右侧形态通用，避免固定 right 导致偏移被裁） */
  const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const W = 240; // w-60
    let left = r.left;
    if (left + W > window.innerWidth - 8) left = Math.max(8, window.innerWidth - W - 8);
    setMenuPos({ top: Math.min(r.bottom + 6, window.innerHeight - 200), left });
    setMenuOpen((v) => !v);
  };

  const submit = useCallback(async () => {
    if (!email.trim() || password.length < 6) {
      toast(mode === "register" ? "请填写邮箱与至少 6 位密码" : "请输入邮箱与密码", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      const data = (await res.json()) as { user?: AuthUser; error?: string };
      if (!res.ok || !data.user) throw new Error(data.error ?? "操作失败");
      setAuthUser(data.user);
      setOpen(false);
      setEmail("");
      setPassword("");
      setMode("login");
      toast(mode === "register" ? "注册成功，欢迎使用！" : "登录成功", "success");
      window.location.reload(); // 刷新以按新用户加载会话
    } catch (err) {
      toast(err instanceof Error ? err.message : "操作失败", "error");
    } finally {
      setBusy(false);
    }
  }, [email, name, password, mode]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch { /* 忽略 */ }
    setAuthUser(null);
    setMenuOpen(false);
    toast(t("common.logout"), "info");
    window.location.reload();
  }, [t]);

  /* ─────────────── 登录 / 注册弹窗（Portal 到 body，最高层级） ─────────────── */
  const modal = open
    ? createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-sm max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl oc-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[16px] font-semibold text-stone-800">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
                  <UserRound className="h-4 w-4" />
                </span>
                {mode === "login" ? `${t("common.login")} OpenCanvas` : t("auth.createAccount")}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100"
                title={t("common.close")}
              >
                <Mail className="h-4 w-4 opacity-0" />
                <span className="text-lg leading-none">×</span>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-stone-500">{t("common.email")}</label>
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-[13px] outline-none focus:border-orange-300"
                />
              </div>
              {mode === "register" && (
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-stone-500">{t("common.name")}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("auth.namePlaceholder")}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-[13px] outline-none focus:border-orange-300"
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-[12px] font-medium text-stone-500">{t("common.password")}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void submit(); }}
                  placeholder="••••••"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-[13px] outline-none focus:border-orange-300"
                />
              </div>
            </div>

            <button
              onClick={() => void submit()}
              disabled={busy}
              className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 py-2.5 text-[13.5px] font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? t("common.login") : `${t("common.register")} ${t("common.login")}`}
            </button>
            <p className="mt-3 text-center text-[12px] text-stone-400">
              {mode === "login" ? (
                <>
                  还没有账号？
                  <button onClick={() => setMode("register")} className={cn("ml-1 font-medium text-brand-600 hover:underline")}>
                    {t("common.register")}
                  </button>
                </>
              ) : (
                <>
                  已有账号？
                  <button onClick={() => setMode("login")} className={cn("ml-1 font-medium text-brand-600 hover:underline")}>
                    {t("common.login")}
                  </button>
                </>
              )}
            </p>
            <p className="mt-2 text-center text-[10.5px] text-stone-300">{t("auth.sessionExpired")}</p>

            {/* 第三方登录 */}
            <div className="mt-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-stone-200" />
              <span className="text-[11px] text-stone-400">{t("auth.orOauth")}</span>
              <span className="h-px flex-1 bg-stone-200" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => oauthLogin("google")}
                disabled={oauthStatus === null}
                title={oauthStatus?.google === false ? "未配置 GOOGLE_CLIENT_ID（查看 .env.example）" : "使用 Google 账号登录"}
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white text-[12.5px] font-medium text-stone-600 transition hover:border-stone-300 hover:bg-stone-50 disabled:opacity-50"
              >
                <GoogleIcon className="h-4 w-4" /> Google
              </button>
              <button
                onClick={() => oauthLogin("github")}
                disabled={oauthStatus === null}
                title={oauthStatus?.github === false ? "未配置 GITHUB_CLIENT_ID（查看 .env.example）" : "使用 GitHub 账号登录"}
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white text-[12.5px] font-medium text-stone-600 transition hover:border-stone-300 hover:bg-stone-50 disabled:opacity-50"
              >
                <Github className="h-4 w-4" /> GitHub
              </button>
            </div>
            <p className="mt-2 text-center text-[10.5px] text-stone-300">
              未配置凭据时按钮可点但会提示配置方法；OAuth 回调地址见 .env.example
            </p>
          </div>
        </div>,
        document.body
      )
    : null;

  /* ─────────────── 已登录下拉菜单（Portal） ─────────────── */
  const menu = user && menuOpen && menuPos
    ? createPortal(
        <div
          ref={panelRef}
          style={{ top: menuPos.top, left: menuPos.left }}
          className="oc-pop-in fixed z-[10000] max-h-[calc(100vh-4rem)] w-60 overflow-y-auto rounded-xl border border-stone-200 bg-white py-1 shadow-xl"
        >
          <div className="border-b border-stone-100 px-3 py-2.5">
            <p className="truncate text-[13px] font-medium text-stone-700">{user.name}</p>
            <p className="mt-0.5 truncate text-[11px] text-stone-400">{user.email}</p>
          </div>
          <button
            onClick={() => { setMenuOpen(false); window.location.href = "/membership"; }}
            className="flex w-full items-center gap-2 px-3 py-2 text-[12.5px] text-stone-600 transition hover:bg-stone-50"
          >
            <Crown className="h-3.5 w-3.5 text-amber-500" /> {t("nav.membership")}
          </button>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 px-3 py-2 text-[12.5px] text-stone-600 transition hover:bg-stone-50"
          >
            <LogOut className="h-3.5 w-3.5" /> {t("common.logout")}
          </button>
        </div>,
        document.body
      )
    : null;

  if (loading) {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-300">
        <Loader2 className="h-4 w-4 animate-spin" />
      </span>
    );
  }

  /* ─────────────── 卡片形态（侧栏底部） ─────────────── */
  if (variant === "card") {
    return (
      <div className="border-t border-stone-100 p-3">
        {user ? (
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 transition hover:bg-stone-50"
            title={user.email}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-[13px] font-bold text-white">
              {(user.name || user.email[0]).slice(0, 1).toUpperCase()}
            </span>
            <span className="flex min-w-0 flex-1 flex-col items-start">
              <span className="truncate text-[13.5px] font-medium text-stone-800">{user.name}</span>
              <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-orange-50 px-1.5 py-px text-[10px] font-medium text-orange-600">
                <Crown className="h-2.5 w-2.5" /> {t("auth.signedIn")}
              </span>
            </span>
            <span className="text-[10px] text-stone-300">▼</span>
          </button>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-stone-200 px-2 py-2.5 transition hover:border-orange-300 hover:bg-orange-50/40"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-400">
              <LogIn className="h-4 w-4" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col items-start">
              <span className="text-[13.5px] font-medium text-stone-600">{t("common.login")} / {t("common.register")}</span>
              <span className="mt-0.5 text-[10.5px] text-stone-400">{t("auth.accountData")}</span>
            </span>
          </button>
        )}
        {menu}
        {modal}
      </div>
    );
  }

  /* ─────────────── 徽章形态（顶栏） ─────────────── */
  return (
    <>
      {user ? (
        <div className="relative">
          <button
            ref={btnRef}
            onClick={toggleMenu}
            title={user.email}
            className="flex h-8 items-center gap-1.5 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 pl-1 pr-2 text-white shadow-sm transition hover:opacity-90"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-[11px] font-bold">
              {(user.name || user.email[0]).slice(0, 1).toUpperCase()}
            </span>
            <span className="max-w-[80px] truncate text-[11.5px] font-medium">{user.name}</span>
          </button>
          {menu}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 text-[12px] font-medium text-stone-600 transition hover:border-orange-300 hover:text-brand-600"
          title={`${t("common.login")} / ${t("common.register")}`}
        >
          <LogIn className="h-3.5 w-3.5" /> {t("common.login")}
        </button>
      )}
      {modal}
    </>
  );
}
