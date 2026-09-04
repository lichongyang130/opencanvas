"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  BarChart3,
  CheckSquare,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Presentation,
  Search,
  Sparkles,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { useChatStore, MODE_LABELS, type WorkspaceMode } from "@/lib/store/chat";
import { toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

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

/** 会话历史面板：搜索（标题+内容）、置顶、重命名、归档/恢复、删除、批量管理 */
export function HistoryPanel({ onNavigate }: { onNavigate?: () => void } = {}) {
  const { tt } = useI18n();
  const {
    conversations,
    activeId,
    selectConversation,
    newConversation,
    historyLimit,
    renameConversation,
    togglePin,
    toggleArchive,
    deleteConversation,
    batchArchive,
    batchDelete,
  } = useChatStore();

  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations
      .filter((c) => (showArchived ? c.archived : !c.archived))
      .filter(
        (c) =>
          !q ||
          c.title.toLowerCase().includes(q) ||
          c.messages.some((m) => m.content.toLowerCase().includes(q))
      )
      .sort((a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false))
      .slice(0, historyLimit);
  }, [conversations, query, showArchived, historyLimit]);

  const startNew = () => {
    void newConversation().then((id) => selectConversation(id));
    onNavigate?.();
  };

  const startRename = (id: string, title: string) => {
    setRenamingId(id);
    setRenameDraft(title);
    setMenuFor(null);
  };

  const commitRename = () => {
    if (renamingId) renameConversation(renamingId, renameDraft);
    setRenamingId(null);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const doBatchArchive = (archived: boolean) => {
    if (selected.size === 0) return;
    void batchArchive([...selected], archived).then(() => {
      setSelected(new Set());
      if (selectMode) setSelectMode(false);
      if (archived) setShowArchived(true);
    });
  };

  const doBatchDelete = () => {
    if (selected.size === 0) return;
    if (confirmId !== "__batch__") {
      setConfirmId("__batch__");
      setTimeout(() => setConfirmId((v) => (v === "__batch__" ? null : v)), 2500);
      return;
    }
    const ids = [...selected];
    void batchDelete(ids).then(() => {
      setSelected(new Set());
      setConfirmId(null);
      if (selectMode) setSelectMode(false);
      toast(tt("已删除 {n} 个任务", { n: ids.length }), "success");
    });
  };

  return (
    <aside className="hidden w-[248px] shrink-0 flex-col border-r border-[var(--oc-border-strong)] bg-[var(--oc-bg)] md:flex">
      {/* 标题 */}
      <div className="flex items-center justify-between px-4 pb-1 pt-4">
        <h2 className="text-[15px] font-semibold text-stone-800">{tt("对话历史")}</h2>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => { setSelectMode((v) => !v); setSelected(new Set()); setMenuFor(null); }}
            title={tt("批量管理")}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-stone-100",
              selectMode ? "bg-stone-100 text-brand-600" : "text-stone-400 hover:text-brand-600"
            )}
          >
            <CheckSquare className="h-4 w-4" />
          </button>
          <button
            onClick={startNew}
            title={tt("新建对话")}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-brand-600"
          >
            <Sparkles className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tab：全部 / 已归档 */}
      <div className="mx-3 mt-1 flex rounded-lg bg-stone-100/70 p-0.5 text-[11.5px]">
        <button
          onClick={() => setShowArchived(false)}
          className={cn(
            "flex-1 rounded-md py-1 font-medium transition",
            !showArchived ? "bg-white text-stone-700 shadow-sm" : "text-stone-400 hover:text-stone-600"
          )}
        >
          {tt("全部")}
        </button>
        <button
          onClick={() => setShowArchived(true)}
          className={cn(
            "flex-1 rounded-md py-1 font-medium transition",
            showArchived ? "bg-white text-stone-700 shadow-sm" : "text-stone-400 hover:text-stone-600"
          )}
        >
          {tt("已归档")}
        </button>
      </div>

      {/* 搜索 */}
      <div className="px-3 pb-2 pt-2">
        <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-400">
          <Search className="h-4 w-4" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tt("搜索标题或内容")}
            className="w-full bg-transparent text-[13px] text-stone-700 outline-none placeholder:text-stone-400"
          />
        </div>
      </div>

      {/* 列表（按时间分组：今天 / 昨天 / 7 天内 / 更早） */}
      <div className="flex-1 space-y-0.5 overflow-y-auto px-3 py-1">
        {list.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-stone-400">
            {query ? tt("没有匹配的对话") : showArchived ? tt("暂无归档") : tt("暂无历史对话")}
          </p>
        )}
        {(() => {
          const now = new Date();
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          const groups: { label: string; items: typeof list }[] = [
            { label: tt("今天"), items: [] },
            { label: tt("昨天"), items: [] },
            { label: tt("7 天内"), items: [] },
            { label: tt("更早"), items: [] },
          ];
          for (const c of list) {
            const t = c.createdAt;
            if (t >= startOfDay) groups[0].items.push(c);
            else if (t >= startOfDay - 86_400_000) groups[1].items.push(c);
            else if (t >= startOfDay - 7 * 86_400_000) groups[2].items.push(c);
            else groups[3].items.push(c);
          }
          const rows: React.ReactNode[] = [];
          for (const g of groups) {
            if (g.items.length === 0) continue;
            rows.push(
              <p key={tt(g.label)} className="px-2 pb-0.5 pt-2.5 text-[10.5px] font-medium uppercase tracking-wide text-stone-400">
                {tt(g.label)}
              </p>
            );
            for (const c of g.items) {
              const Icon = MODE_ICONS[c.mode] ?? MessageSquare;
              const active = c.id === activeId;
              const isChecked = selected.has(c.id);
              const isConfirming = confirmId === c.id;

              rows.push(
                <div
                  key={c.id}
                  className={cn(
                    "group relative rounded-xl transition",
                    active ? "border border-orange-200 bg-orange-50" : "border border-transparent hover:bg-white hover:shadow-sm"
                  )}
                >
                  <button
                    onClick={() => {
                      if (selectMode) { toggleSelect(c.id); return; }
                      void selectConversation(c.id);
                      onNavigate?.();
                    }}
                    className="flex w-full items-center gap-2.5 px-2.5 py-2.5 text-left"
                  >
                    {selectMode ? (
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]",
                          isChecked ? "border-brand-500 bg-brand-500 text-white" : "border-stone-300 bg-white"
                        )}
                      >
                        {isChecked && "✓"}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        active ? "bg-orange-100 text-orange-600" : "bg-stone-100 text-stone-500"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1">
                        {c.pinned && <Pin className="h-3 w-3 shrink-0 text-brand-500" />}
                        {renamingId === c.id ? (
                          <input
                            autoFocus
                            value={renameDraft}
                            onChange={(e) => setRenameDraft(e.target.value)}
                            onBlur={commitRename}
                            onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingId(null); }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full rounded border border-brand-300 bg-white px-1 py-0.5 text-[13px] font-medium text-stone-700 outline-none"
                          />
                        ) : (
                          <span className="block truncate text-[13px] font-medium text-stone-700">{c.title}</span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-stone-400">
                        {tt(MODE_LABELS[c.mode])}
                        {showArchived && <span className="ml-1.5 text-stone-300">· {tt("已归档")}</span>}
                      </span>
                    </span>
                    {!selectMode ? (
                      <>
                        {!active && (
                          <span className="shrink-0 text-[11px] text-stone-400">{formatTime(c.createdAt)}</span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuFor(menuFor === c.id ? null : c.id);
                          }}
                          title={tt("更多操作")}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-stone-300 opacity-0 transition group-hover:opacity-100 hover:bg-stone-100 hover:text-stone-600"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="shrink-0 text-[10.5px] text-stone-300">{formatTime(c.createdAt)}</span>
                    )}
                  </button>

                  {/* 行内操作条 */}
                  {menuFor === c.id && (
                    <div className="absolute right-2 top-9 z-20 flex items-center gap-0.5 rounded-xl border border-stone-200 bg-white p-1 shadow-lg">
                      <button
                        onClick={() => startRename(c.id, c.title)}
                        title={tt("重命名")}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => { togglePin(c.id); setMenuFor(null); }}
                        title={c.pinned ? tt("取消置顶") : tt("置顶")}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                      >
                        {c.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => { void toggleArchive(c.id); setMenuFor(null); }}
                        title={c.archived ? tt("恢复") : tt("归档")}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                      >
                        {c.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => {
                          if (isConfirming) {
                            void deleteConversation(c.id);
                            setConfirmId(null);
                            setMenuFor(null);
                          } else {
                            setConfirmId(c.id);
                            setTimeout(() => setConfirmId((v) => (v === c.id ? null : v)), 2500);
                          }
                        }}
                        title={isConfirming ? tt("再次点击确认删除") : tt("删除")}
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg transition",
                          isConfirming
                            ? "bg-red-50 text-red-600"
                            : "text-stone-400 hover:bg-stone-100 hover:text-red-500"
                        )}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            }
          }
          return rows;
        })()}
      </div>

      {/* 批量操作条 */}
      {selectMode && (
        <div className="border-t border-stone-100 bg-white px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11.5px] text-stone-500">
              {tt("已选 {n} 项", { n: selected.size })}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => doBatchArchive(true)}
                disabled={selected.size === 0}
                className="flex items-center gap-1 rounded-lg border border-stone-200 px-2 py-1 text-[11px] text-stone-500 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-40"
              >
                <Archive className="h-3 w-3" /> {tt("归档")}
              </button>
              <button
                onClick={doBatchDelete}
                disabled={selected.size === 0}
                className={cn(
                  "flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition disabled:opacity-40",
                  confirmId === "__batch__"
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-stone-200 text-stone-500 hover:border-red-300 hover:text-red-600"
                )}
              >
                <Trash2 className="h-3 w-3" /> {confirmId === "__batch__" ? tt("再点确认") : tt("删除")}
              </button>
              <button
                onClick={() => { setSelectMode(false); setSelected(new Set()); }}
                title={tt("取消")}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 升级方案 */}
      <div className="border-t border-[#eee4d3] p-3">
        <button
          onClick={() => toast(tt("专业版即将上线，敬请期待"), "info")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--oc-border-strong)] bg-white py-2.5 text-[13px] font-medium text-stone-600 transition hover:border-orange-300 hover:text-brand-600"
        >
          <Sparkles className="h-4 w-4 text-orange-500" />
          {tt("升级方案")}
        </button>
      </div>
    </aside>
  );
}
