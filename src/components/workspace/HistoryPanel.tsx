"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Presentation,
  Search,
  Sparkles,
  Video,
} from "lucide-react";
import { useChatStore, MODE_LABELS, type WorkspaceMode } from "@/lib/store/chat";
import { toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";

const MODE_ICONS: Record<WorkspaceMode, typeof MessageSquare> = {
  chat: MessageSquare,
  docs: FileText,
  slides: Presentation,
  image: ImageIcon,
  video: Video,
  research: BarChart3,
};

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

/** 会话历史面板：搜索 + 列表 + 升级方案（对应 04 三栏工作台左栏） */
export function HistoryPanel() {
  const { conversations, activeId, selectConversation, newConversation } = useChatStore();
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations
      .filter((c) => !c.archived)
      .filter((c) => !q || c.title.toLowerCase().includes(q))
      .slice(0, 50);
  }, [conversations, query]);

  const startNew = () => {
    void newConversation("chat").then((id) => selectConversation(id));
  };

  return (
    <aside className="hidden w-[248px] shrink-0 flex-col border-r border-[#e8ddca] bg-[#fbf7ef] md:flex">
      {/* 标题 */}
      <div className="flex items-center justify-between px-4 pb-1 pt-4">
        <h2 className="text-[15px] font-semibold text-stone-800">对话历史</h2>
        <button
          onClick={startNew}
          title="新建对话"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-brand-600"
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </div>

      {/* 搜索 */}
      <div className="px-3 pb-2 pt-2">
        <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-400">
          <Search className="h-4 w-4" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索"
            className="w-full bg-transparent text-[13px] text-stone-700 outline-none placeholder:text-stone-400"
          />
        </div>
      </div>

      {/* 列表 */}
      <div className="flex-1 space-y-0.5 overflow-y-auto px-3 py-1">
        {list.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-stone-400">
            {query ? "没有匹配的对话" : "暂无历史对话"}
          </p>
        )}
        {list.map((c) => {
          const Icon = MODE_ICONS[c.mode] ?? MessageSquare;
          const active = c.id === activeId;
          return (
            <button
              key={c.id}
              onClick={() => void selectConversation(c.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition",
                active
                  ? "border border-orange-200 bg-orange-50"
                  : "border border-transparent hover:bg-white hover:shadow-sm"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  active ? "bg-orange-100 text-orange-600" : "bg-stone-100 text-stone-500"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-stone-700">
                  {c.title}
                </span>
                <span className="mt-0.5 block text-[11px] text-stone-400">
                  {MODE_LABELS[c.mode]}
                </span>
              </span>
              <span className="shrink-0 text-[11px] text-stone-400">
                {formatTime(c.createdAt)}
              </span>
            </button>
          );
        })}
      </div>

      {/* 升级方案 */}
      <div className="border-t border-[#eee4d3] p-3">
        <button
          onClick={() => toast("专业版即将上线，敬请期待", "info")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#e3d8c6] bg-white py-2.5 text-[13px] font-medium text-stone-600 transition hover:border-orange-300 hover:text-brand-600"
        >
          <Sparkles className="h-4 w-4 text-orange-500" />
          升级方案
        </button>
      </div>
    </aside>
  );
}
