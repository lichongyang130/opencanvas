"use client";

import { create } from "zustand";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: number;
}

interface AuthState {
  /** 当前登录用户；null = 未登录 */
  user: AuthUser | null;
  /** 首次恢复会话中 */
  loading: boolean;
}

/**
 * 全局登录态 store（本地账号版）。
 * AuthBadge（顶栏徽章 / 左侧卡片）共享同一份状态，任一实例登录/登出后其余位置即时同步。
 */
export const useAuthStore = create<AuthState>(() => ({ user: null, loading: true }));

/** 从服务端恢复会话（GET /api/auth/me） */
export async function refreshAuth(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    const data = (await res.json()) as { user?: AuthUser | null };
    const user = data.user ?? null;
    useAuthStore.setState({ user, loading: false });
    return user;
  } catch {
    useAuthStore.setState({ user: null, loading: false });
    return null;
  }
}

/** 登录/注册/登出后同步 store */
export function setAuthUser(user: AuthUser | null): void {
  useAuthStore.setState({ user, loading: false });
  window.dispatchEvent(new CustomEvent("opencanvas:auth-changed", { detail: user }));
}

