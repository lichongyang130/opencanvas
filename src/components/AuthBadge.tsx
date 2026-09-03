"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Crown, Loader2, LogIn, LogOut, Mail, UserRound } from "lucide-react";
import { toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";
import { refreshAuth, setAuthUser, useAuthStore, type AuthUser } from "@/lib/store/auth";

/**
 * 账号徽章（本地版）：
 * - variant="badge"（默认）：顶栏紧凑「登录」按钮 / 头像昵称下拉
 * - variant="card"：侧栏底部用户卡片（未登录 = 登录/注册；已登录 = 账户卡片 + 下拉）
 * 两形态共享 useAuthStore，状态实时同步；弹窗/菜单经 Portal 挂 body + fixed 最高层，不被遮挡。
 */
export default function AuthBadge({ variant = "badge" }: { variant?: "badge" | "card" }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    void refreshAuth();
  }, []);

  // 头像下拉外点关闭
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

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
    toast("已退出登录", "info");
    window.location.reload();
  }, []);

  /* ─────────────── 登录 / 注册弹窗（Portal 到 body，最高层级） ─────────────── */
  const modal = open
    ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl oc-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[16px] font-semibold text-stone-800">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
                  <UserRound className="h-4 w-4" />
                </span>
                {mode === "login" ? "登录 OpenCanvas" : "注册账号"}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100"
                title="关闭"
              >
                <Mail className="h-4 w-4 opacity-0" />
                <span className="text-lg leading-none">×</span>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-stone-500">邮箱</label>
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-[13px] outline-none focus:border-orange-300"
                />
              </div>
              {mode === "register" && (
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-stone-500">昵称（可选）</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="默认取邮箱前缀"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-[13px] outline-none focus:border-orange-300"
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-[12px] font-medium text-stone-500">密码（至少 6 位）</label>
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
              {mode === "login" ? "登录" : "注册并登录"}
            </button>
            <p className="mt-3 text-center text-[12px] text-stone-400">
              {mode === "login" ? (
                <>
                  还没有账号？
                  <button onClick={() => setMode("register")} className={cn("ml-1 font-medium text-brand-600 hover:underline")}>
                    注册
                  </button>
                </>
              ) : (
                <>
                  已有账号？
                  <button onClick={() => setMode("login")} className={cn("ml-1 font-medium text-brand-600 hover:underline")}>
                    直接登录
                  </button>
                </>
              )}
            </p>
            <p className="mt-2 text-center text-[10.5px] text-stone-300">本地版账号 · 密码 scrypt 加密存储</p>
          </div>
        </div>,
        document.body
      )
    : null;

  /* ─────────────── 已登录下拉菜单（Portal） ─────────────── */
  const menu = user && menuOpen
    ? createPortal(
        <div
          ref={menuRef}
          className="oc-pop-in fixed right-3 top-12 z-[9999] w-60 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-xl"
        >
          <div className="border-b border-stone-100 px-3 py-2.5">
            <p className="truncate text-[13px] font-medium text-stone-700">{user.name}</p>
            <p className="mt-0.5 truncate text-[11px] text-stone-400">{user.email}</p>
          </div>
          <button
            onClick={() => { setMenuOpen(false); window.location.href = "/membership"; }}
            className="flex w-full items-center gap-2 px-3 py-2 text-[12.5px] text-stone-600 transition hover:bg-stone-50"
          >
            <Crown className="h-3.5 w-3.5 text-amber-500" /> 会员方案
          </button>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 px-3 py-2 text-[12.5px] text-stone-600 transition hover:bg-stone-50"
          >
            <LogOut className="h-3.5 w-3.5" /> 退出登录
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
      <div ref={menuRef} className="border-t border-stone-100 p-3">
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
                <Crown className="h-2.5 w-2.5" /> 已登录
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
              <span className="text-[13.5px] font-medium text-stone-600">登录 / 注册</span>
              <span className="mt-0.5 text-[10.5px] text-stone-400">同步你的对话与积分</span>
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
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
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
          title="登录 / 注册"
        >
          <LogIn className="h-3.5 w-3.5" /> 登录
        </button>
      )}
      {modal}
    </>
  );
}
