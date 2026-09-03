"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, LayoutDashboard, Loader2, Menu, Plus, Settings, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { HistoryPanel } from "./HistoryPanel";
import { ChatPanel } from "./ChatPanel";
import { ArtifactPanel } from "./ArtifactPanel";
import { SettingsModal } from "./SettingsModal";
import { Toaster } from "@/components/Toaster";
import AuthBadge from "@/components/AuthBadge";
import { useChatStore } from "@/lib/store/chat";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export function Workspace() {
  const { tt } = useI18n();
  const {
    hydrated,
    hydrate,
    settingsOpen,
    setSettingsOpen,
    sending,
    conversations,
    activeId,
    artifactOpen,
    setArtifactOpen,
    newConversation,
    selectConversation,
    renameConversation,
  } = useChatStore();

  const [mobileNav, setMobileNav] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Ctrl/Cmd+N 新建对话
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        void newConversation().then((id) => selectConversation(id));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [newConversation, selectConversation]);

  // 消费首页带来的意图（sessionStorage 传递，避免 URL 泄漏长文本）
  useEffect(() => {
    if (!hydrated) return;
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem("oc:homeIntent");
      if (raw) sessionStorage.removeItem("oc:homeIntent");
    } catch {}
    if (!raw) return;
    try {
      const intent = JSON.parse(raw) as {
        type: "send" | "fill" | "mode" | "new" | "convo";
        mode?: import("@/lib/store/chat").WorkspaceMode;
        text?: string;
        id?: string;
        ts?: number;
      };
      // 超过 30 秒的意图视为过期
      if (intent.ts && Date.now() - intent.ts > 30_000) return;
      const store = useChatStore.getState();
      switch (intent.type) {
        case "send":
          if (intent.text) void store.runTemplate({ mode: intent.mode ?? "chat", prompt: intent.text });
          break;
        case "fill":
          void store.fillTemplate({ mode: intent.mode ?? "chat", prompt: intent.text ?? "" });
          break;
        case "mode":
          void store.newConversation(intent.mode ?? "chat").then((id) => store.selectConversation(id));
          break;
        case "new":
          void store.newConversation("chat").then((id) => store.selectConversation(id));
          break;
        case "convo":
          if (intent.id) void store.selectConversation(intent.id);
          break;
      }
    } catch {}
  }, [hydrated]);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  const active = conversations.find((c) => c.id === activeId);

  const startNew = () => {
    void newConversation().then((id) => selectConversation(id));
  };

  const saveTitle = () => {
    const t = titleDraft.trim();
    if (t && active) renameConversation(active.id, t);
    setEditingTitle(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 桌面侧栏 + 历史 */}
      <div className="hidden md:flex h-full">
        <Sidebar />
        <HistoryPanel />
      </div>

      {/* 移动端抽屉导航 */}
      {mobileNav && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNav(false)} />
          <div className="absolute inset-y-0 left-0 w-[288px] overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 px-3 py-2">
              <span className="text-xs font-medium text-stone-400">{tt("导航")}</span>
              <button
                onClick={() => setMobileNav(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100"
                title={tt("关闭")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Sidebar onNavigate={() => setMobileNav(false)} />
            <HistoryPanel onNavigate={() => setMobileNav(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-[var(--oc-border-strong)] bg-[var(--oc-bg)] px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileNav(true)}
              className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 md:hidden"
              title={tt("打开导航")}
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-stone-800">{tt("智能助手")}</span>
              {active &&
                (editingTitle ? (
                  <input
                    autoFocus
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={saveTitle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveTitle();
                      if (e.key === "Escape") setEditingTitle(false);
                    }}
                    className="w-[220px] rounded-md border border-orange-200 bg-white px-2 py-0.5 text-sm text-stone-600 outline-none focus:border-orange-300"
                  />
                ) : (
                  <button
                    onClick={() => {
                      setTitleDraft(active.title);
                      setEditingTitle(true);
                    }}
                    title={tt("点击重命名当前任务")}
                    className="max-w-[220px] truncate text-sm text-stone-400 transition hover:text-stone-600"
                  >
                    · {tt(active.title)}
                  </button>
                ))}
            </div>
            <button
              onClick={startNew}
              className="ml-2 flex items-center gap-1.5 rounded-lg border border-orange-200 px-3 py-1.5 text-[12.5px] font-medium text-orange-600 transition hover:border-orange-300 hover:bg-orange-50"
            >
              <Plus className="h-3.5 w-3.5" /> 新建对话
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            {sending && (
              <span className="hidden items-center gap-1.5 text-xs text-brand-600 sm:flex">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> 生成中…
              </span>
            )}
            <Link
              href="/"
              title={tt("返回首页")}
              className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-brand-600"
            >
              <Home className="h-4 w-4" />
            </Link>
            <button
              onClick={() => setSettingsOpen(true)}
              title={tt("设置")}
              className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-brand-600"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={() => setArtifactOpen(!artifactOpen)}
              title={artifactOpen ? tt("关闭产物画布") : tt("打开产物画布")}
              className={cn(
                "rounded-lg p-1.5 transition",
                artifactOpen
                  ? "bg-brand-50 text-brand-600"
                  : "text-stone-400 hover:bg-stone-100 hover:text-brand-600"
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
            </button>
            <AuthBadge />
          </div>
        </header>
        <div className="flex min-h-0 flex-1">
          <ChatPanel />
          <ArtifactPanel />
        </div>
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Toaster />
    </div>
  );
}
