"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, Loader2 } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { ChatPanel } from "./ChatPanel";
import { ArtifactPanel } from "./ArtifactPanel";
import { ModeSwitcher } from "./ModeSwitcher";
import { ModelSelector } from "./ModelSelector";
import { SettingsModal } from "./SettingsModal";
import { Toaster } from "@/components/Toaster";
import { toast } from "@/lib/store/toast";
import { useChatStore } from "@/lib/store/chat";
import { MODELS } from "@/lib/gateway/models";

export function Workspace() {
  const {
    model,
    setModel,
    hydrated,
    hydrate,
    settingsOpen,
    setSettingsOpen,
    sending,
    conversations,
    activeId,
  } = useChatStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  const active = conversations.find((c) => c.id === activeId);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-[#e8ddca] bg-[#faf6ee] px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <ModeSwitcher />
            {active && (
              <span className="hidden max-w-[220px] truncate text-sm text-stone-400 md:inline">
                · {active.title}
              </span>
            )}
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
            <ModelSelector
              value={model}
              onChange={(id, provider) => {
                setModel(id, provider);
                const label = MODELS.find((m) => m.id === id)?.label ?? id;
                toast(`已切换到 ${label}`, "success");
              }}
            />
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
