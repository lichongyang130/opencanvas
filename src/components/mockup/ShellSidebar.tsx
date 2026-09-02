"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  FileText,
  Home,
  LayoutGrid,
  LayoutTemplate,
  MessageSquare,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useChatStore } from "@/lib/store/chat";

export type ShellActive = "chat" | "agents" | "knowledge" | "docs" | "templates" | "tools" | "apps";

const NAV = [
  { label: "首页", icon: Home, route: "/" },
  { label: "AI 对话", icon: MessageSquare, route: "/chat" },
  { label: "智能体", icon: Bot, route: "/agents" },
  { label: "知识库", icon: Database, route: "/knowledge" },
  { label: "文档中心", icon: FileText, route: "/docs" },
  { label: "模板中心", icon: LayoutTemplate, route: "/templates" },
  { label: "工具箱", icon: Wrench, route: "/tools" },
  { label: "更多应用", icon: LayoutGrid, route: "/apps" },
];

export function ShellSidebar({ active }: { active: ShellActive }) {
  const router = useRouter();
  const { conversations, selectConversation } = useChatStore();
  const [collapsed, setCollapsed] = useState(true);
  const recent = conversations.filter((c) => !c.archived).slice(0, 6);

  const go = (route: string, expand = false) => {
    if (route.startsWith("/agents")) router.push("/agents");
    else if (route.startsWith("/knowledge")) router.push("/knowledge");
    else if (route.startsWith("/docs")) router.push("/docs");
    else if (route.startsWith("/templates")) router.push("/templates");
    else if (route.startsWith("/tools")) router.push("/tools");
    else if (route.startsWith("/apps")) router.push("/apps");
    else router.push(route === "/" ? "/" : "/chat");
    if (expand) setCollapsed(false);
  };

  const openConvo = (id: string) => {
    router.push("/chat");
    void selectConversation(id);
  };

  /* ────────── 收起态：仅图标栏 ────────── */
  if (collapsed) {
    return (
      <aside className="flex w-[56px] shrink-0 flex-col items-center border-r border-[var(--oc-border-strong)] bg-white py-2">
        <button
          onClick={() => router.push("/")}
          title="AI 对话"
          className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500 text-sm font-bold text-white shadow-sm"
        >
          O
        </button>

        {/* 展开按钮 */}
        <button
          onClick={() => setCollapsed(false)}
          title="展开菜单"
          className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
        >
          <ChevronRight className="h-4.5 w-4.5 h-[18px] w-[18px]" />
        </button>

        <div className="my-1 h-px w-6 bg-stone-100" />

        {/* 导航图标 */}
        <nav className="flex flex-col items-center gap-1">
          {NAV.map((item) => {
            const isActive = item.route === `/${active}`;
            return (
              <button
                key={item.label}
                title={item.label}
                onClick={() => go(item.route, true)}
                className={
                  isActive
                    ? "flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--oc-brand-hover)] text-[var(--oc-brand)]"
                    : "flex h-10 w-10 items-center justify-center rounded-xl text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                }
              >
                <item.icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.1 : 1.8} />
              </button>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* 用户 */}
        <button
          title="会员中心"
          onClick={() => router.push("/membership")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-100 transition hover:border-[var(--oc-brand)]"
        >
          <Image
            src="/avatar.png"
            alt="Alex Chen"
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
          />
        </button>
      </aside>
    );
  }

  /* ────────── 展开态：完整侧栏 ────────── */
  return (
    <aside className="flex w-[236px] shrink-0 flex-col border-r border-[var(--oc-border-strong)] bg-white">
      {/* 顶部 Logo */}
      <div className="flex items-center justify-between px-3 py-4 pl-5">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-3 text-left"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500 text-lg font-bold text-white shadow-sm">
            O
          </span>
          <span className="text-lg font-semibold tracking-tight text-stone-800">AI 对话</span>
        </button>
        <button
          onClick={() => setCollapsed(true)}
          title="收起菜单"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* 导航 */}
      <nav className="flex flex-col gap-0.5 px-3">
        {NAV.map((item) => {
          const isActive = item.route === `/${active}`;
          return (
            <button
              key={item.label}
              onClick={() => go(item.route)}
              className={
                isActive
                  ? "flex items-center gap-2.5 rounded-xl bg-[var(--oc-brand-hover)] px-3.5 py-2.5 text-[14px] font-medium text-[var(--oc-brand)]"
                  : "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[14px] text-stone-600 transition hover:bg-stone-50 hover:text-stone-900"
              }
            >
              <item.icon
                className="h-[18px] w-[18px]"
                strokeWidth={isActive ? 2.1 : 1.8}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mx-5 my-4 h-px bg-stone-100" />

      {/* 最近对话 */}
      <div className="flex-1 overflow-y-auto px-5">
        <p className="mb-2 text-xs font-medium text-stone-400">最近对话</p>
        <div className="-mx-2 flex flex-col gap-0.5">
          {recent.length === 0 && (
            <p className="px-2 py-1 text-xs text-stone-300">暂无历史对话</p>
          )}
          {recent.map((r) => (
            <button
              key={r.id}
              onClick={() => openConvo(r.id)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-stone-500 transition hover:bg-stone-50 hover:text-stone-800"
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-stone-300" />
              <span className="truncate">{r.title}</span>
            </button>
          ))}
          <button
            onClick={() => router.push("/chat")}
            className="mt-1 flex items-center gap-1 px-2 text-xs text-stone-400 transition hover:text-[var(--oc-brand)]"
          >
            查看全部历史记录 <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      {/* 用户 */}
      <div className="border-t border-stone-100 p-3">
        <button
          onClick={() => router.push("/membership")}
          className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 transition hover:bg-stone-50"
        >
          <Image
            src="/avatar.png"
            alt="Alex Chen"
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
          />
          <span className="flex min-w-0 flex-1 flex-col items-start">
            <span className="text-[13.5px] font-medium text-stone-800">Alex Chen</span>
            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-[var(--oc-brand-hover)] px-1.5 py-px text-[10px] font-medium text-[var(--oc-brand)]">
              <Sparkles className="h-2.5 w-2.5" /> 专业版
            </span>
          </span>
          <ChevronDown className="h-4 w-4 text-stone-400" />
        </button>
      </div>
    </aside>
  );
}
