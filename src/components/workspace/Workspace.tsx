"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, LayoutDashboard, Loader2, Plus, UserRound } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { HistoryPanel } from "./HistoryPanel";
import { ChatPanel } from "./ChatPanel";
import { ArtifactPanel } from "./ArtifactPanel";
import { SettingsModal } from "./SettingsModal";
import { Toaster } from "@/components/Toaster";
import { useChatStore } from "@/lib/store/chat";
import { cn } from "@/lib/utils";

export function Workspace() {
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
  } = useChatStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

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
    void newConversation("chat").then((id) => selectConversation(id));
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <HistoryPanel />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-[#e8ddca] bg-[#faf6ee] px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-stone-800">智能助手</span>
              {active && (
                <span className="max-w-[220px] truncate text-sm text-stone-400">
                  · {active.title}
                </span>
              )}
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
              title="返回首页"
              className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-brand-600"
            >
              <Home className="h-4 w-4" />
            </Link>
            <button
              onClick={() => setArtifactOpen(!artifactOpen)}
              title={artifactOpen ? "关闭产物画布" : "打开产物画布"}
              className={cn(
                "rounded-lg p-1.5 transition",
                artifactOpen
                  ? "bg-brand-50 text-brand-600"
                  : "text-stone-400 hover:bg-stone-100 hover:text-brand-600"
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
            </button>
            <span
              title="李明"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-400 text-white shadow-sm"
            >
              <UserRound className="h-4 w-4" />
            </span>
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
