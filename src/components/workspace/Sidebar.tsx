"use client";

import { useMemo, useRef, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  CheckSquare,
  FileText,
  Filter,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutGrid,
  MessageSquare,
  Package,
  Pencil,
  Pin,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Square,
  Trash2,
  Video,
  X,
} from "lucide-react";
import {
  useChatStore,
  MODE_LABELS,
  type WorkspaceMode,
  type Conversation,
} from "@/lib/store/chat";
import { TEMPLATES } from "@/lib/templates";
import { TemplatesModal } from "./TemplatesModal";
import { PacksModal } from "./PacksModal";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const MODE_ICONS: Record<WorkspaceMode, ReactNode> = {
  chat: <MessageSquare className="h-4 w-4" />,
  research: <Search className="h-4 w-4" />,
  slides: <LayoutDashboard className="h-4 w-4" />,
  image: <ImageIcon className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  docs: <FileText className="h-4 w-4" />,
};

const WORKBENCH: { mode: WorkspaceMode }[] = [
  { mode: "chat" },
  { mode: "research" },
  { mode: "slides" },
  { mode: "image" },
  { mode: "video" },
  { mode: "docs" },
];

const FILTERS: { id: WorkspaceMode | "all"; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "chat", label: "对话" },
  { id: "research", label: "研究" },
  { id: "slides", label: "PPT" },
  { id: "image", label: "绘图" },
  { id: "video", label: "视频" },
  { id: "docs", label: "文档" },
];

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  return new Date(ts).toLocaleDateString("zh-CN");
}

export function Sidebar() {
  const {
    conversations,
    activeId,
    selectConversation,
    newConversation,
    deleteConversation,
    togglePin,
    toggleArchive,
    renameConversation,
    batchArchive,
    batchDelete,
    setSettingsOpen,
  } = useChatStore();

  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [packsOpen, setPacksOpen] = useState(false);
  const [view, setView] = useState<"active" | "archived">("active");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<WorkspaceMode | "all">("all");
  const [manage, setManage] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);

  const archivedCount = useMemo(
    () => conversations.filter((c) => c.archived).length,
    [conversations]
  );

  const list = useMemo(() => {
    return conversations
      .filter((c) => (view === "archived" ? c.archived : !c.archived))
      .filter((c) => filter === "all" || c.mode === filter)
      .filter((c) =>
        query.trim() ? c.title.toLowerCase().includes(query.trim().toLowerCase()) : true
      )
      .sort(
        (a, b) =>
          Number(b.pinned ?? false) - Number(a.pinned ?? false) || b.createdAt - a.createdAt
      );
  }, [conversations, view, filter, query]);

  const startRename = (c: Conversation) => {
    setRenamingId(c.id);
    setRenameValue(c.title);
    setTimeout(() => renameRef.current?.focus(), 0);
  };
  const commitRename = () => {
    if (renamingId && renameValue.trim()) renameConversation(renamingId, renameValue);
    setRenamingId(null);
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const exitManage = () => {
    setManage(false);
    setSelected(new Set());
  };
  const selectedIds = [...selected];

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-[#e8ddca] bg-[#faf6ee]">
      {/* 品牌 */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          O
        </div>
        <span className="font-serif text-[15px] font-semibold tracking-tight text-[#4a2e1d]">
          OpenCanvas AI
        </span>
      </div>

      <div className="px-3">
        <button
          onClick={() => void newConversation("chat")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> 新建任务
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-2">
        {/* 工作台：紧凑 3 列图标宫格 */}
        <SectionTitle>工作台</SectionTitle>
        <div className="grid grid-cols-3 gap-1.5">
          {WORKBENCH.map((w) => (
            <button
              key={w.mode}
              onClick={() => void newConversation(w.mode)}
              className="group flex flex-col items-center gap-1.5 rounded-xl border border-stone-200 py-2.5 text-stone-500 transition hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700"
            >
              <span className="text-stone-400 transition group-hover:text-brand-600">
                {MODE_ICONS[w.mode]}
              </span>
              <span className="text-[11px]">{MODE_LABELS[w.mode]}</span>
            </button>
          ))}
        </div>

        {/* 模板库：一个入口收进弹窗 */}
        <button
          onClick={() => setTemplatesOpen(true)}
          className="mt-2 flex w-full items-center justify-between rounded-xl border border-dashed border-stone-300 px-3 py-2.5 text-sm text-stone-600 transition hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-700"
        >
          <span className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-brand-500" /> 提示词模板库
          </span>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-500">
            {TEMPLATES.length}+ 精选
          </span>
        </button>

        {/* 一键素材包 */}
        <button
          onClick={() => setPacksOpen(true)}
          className="mt-2 flex w-full items-center justify-between rounded-xl border border-dashed border-amber-300 bg-amber-50/50 px-3 py-2.5 text-sm text-amber-700 transition hover:border-amber-400 hover:bg-amber-50"
        >
          <span className="flex items-center gap-2">
            <Package className="h-4 w-4 text-amber-500" /> 一键素材包
          </span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-600">
            整套产出
          </span>
        </button>

        {/* 历史记录 */}
        <div className="mb-1 mt-4 flex items-center justify-between px-1">
          <span className="text-xs font-medium text-stone-400">
            {view === "archived" ? "归档" : "历史记录"}
          </span>
          <div className="flex items-center gap-0.5">
            <IconAction
              title="搜索"
              active={showSearch}
              onClick={() => setShowSearch((v) => !v)}
            >
              <Search className="h-3.5 w-3.5" />
            </IconAction>
            <IconAction
              title="按类型筛选"
              active={showFilter}
              onClick={() => setShowFilter((v) => !v)}
            >
              <Filter className="h-3.5 w-3.5" />
            </IconAction>
            <IconAction
              title={view === "archived" ? "返回历史" : "查看归档"}
              active={view === "archived"}
              badge={view === "active" ? archivedCount : 0}
              onClick={() => {
                setView((v) => (v === "active" ? "archived" : "active"));
                exitManage();
              }}
            >
              <Archive className="h-3.5 w-3.5" />
            </IconAction>
            <IconAction
              title={manage ? "完成管理" : "批量管理"}
              active={manage}
              onClick={() => {
                setManage((m) => !m);
                setSelected(new Set());
              }}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </IconAction>
          </div>
        </div>

        {/* 搜索框（收起式） */}
        {showSearch && (
          <div className="mb-1.5 flex items-center gap-1.5 rounded-lg border border-stone-200 px-2 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索任务…"
              className="w-full bg-transparent text-xs outline-none placeholder:text-stone-300"
            />
            {query && (
              <button onClick={() => setQuery("")}>
                <X className="h-3 w-3 text-stone-300 hover:text-stone-500" />
              </button>
            )}
          </div>
        )}

        {/* 类型筛选（收起式） */}
        {showFilter && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] transition",
                  filter === f.id
                    ? "bg-brand-600 text-white"
                    : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* 批量操作条 */}
        {manage && list.length > 0 && (
          <div className="mb-1.5 flex items-center justify-between rounded-lg bg-stone-100 px-2 py-1.5 text-xs">
            <span className="text-stone-500">已选 {selected.size}</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => selectedIds.length && void batchArchive(selectedIds, view === "active")}
                disabled={selected.size === 0}
                className="rounded-md bg-white px-2 py-1 text-stone-600 shadow-sm disabled:opacity-40"
              >
                {view === "archived" ? "取消归档" : "归档"}
              </button>
              <button
                onClick={() => {
                  if (selected.size && confirm(`删除选中的 ${selected.size} 个任务？`))
                    void batchDelete(selectedIds);
                }}
                disabled={selected.size === 0}
                className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-red-600 disabled:opacity-40"
              >
                <Trash2 className="h-3 w-3" /> 删除
              </button>
            </div>
          </div>
        )}

        {/* 列表 */}
        <div className="space-y-0.5">
          {list.length === 0 && (
            <div className="px-2 py-4 text-center text-xs text-stone-300">
              {query || filter !== "all"
                ? "没有匹配的任务"
                : view === "archived"
                  ? "暂无归档"
                  : "还没有任务，点上方新建"}
            </div>
          )}
          {list.map((c) => {
            const checked = selected.has(c.id);
            const isActive = c.id === activeId && !manage;
            return (
              <div
                key={c.id}
                className={cn(
                  "group flex items-center gap-1 rounded-lg pr-1",
                  isActive ? "bg-brand-50" : "hover:bg-stone-100"
                )}
              >
                {manage ? (
                  <button onClick={() => toggleSelect(c.id)} className="shrink-0 px-1.5 py-2">
                    {checked ? (
                      <CheckSquare className="h-4 w-4 text-brand-600" />
                    ) : (
                      <Square className="h-4 w-4 text-stone-300" />
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => void selectConversation(c.id)}
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left text-[13px]",
                      isActive ? "font-medium text-brand-700" : "text-stone-600"
                    )}
                  >
                    <span className="shrink-0 text-stone-400">{MODE_ICONS[c.mode]}</span>
                    <span className="min-w-0 flex-1">
                      {renamingId === c.id ? (
                        <input
                          ref={renameRef}
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename();
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full rounded border border-brand-300 px-1 py-0.5 text-xs outline-none"
                        />
                      ) : (
                        <span className="block truncate">
                          {c.pinned && (
                            <Pin className="mr-0.5 inline h-3 w-3 fill-brand-500 text-brand-500" />
                          )}
                          {c.title || MODE_LABELS[c.mode]}
                        </span>
                      )}
                      <span className="block text-[10px] text-stone-400">
                        {relativeTime(c.createdAt)}
                      </span>
                    </span>
                  </button>
                )}

                {manage ? (
                  <span className="flex-1 truncate px-1 text-xs text-stone-500">{c.title}</span>
                ) : renamingId === c.id ? null : (
                  <div className="flex shrink-0 items-center opacity-0 transition group-hover:opacity-100">
                    <IconBtn title={c.pinned ? "取消置顶" : "置顶"} onClick={() => togglePin(c.id)}>
                      <Pin className={cn("h-3.5 w-3.5", c.pinned && "fill-brand-500 text-brand-500")} />
                    </IconBtn>
                    <IconBtn title="重命名" onClick={() => startRename(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn
                      title={view === "archived" ? "取消归档" : "归档"}
                      onClick={() => void toggleArchive(c.id)}
                    >
                      {view === "archived" ? (
                        <ArchiveRestore className="h-3.5 w-3.5" />
                      ) : (
                        <Archive className="h-3.5 w-3.5" />
                      )}
                    </IconBtn>
                    <IconBtn
                      title="删除"
                      danger
                      onClick={() => {
                        if (confirm("删除这个任务？")) void deleteConversation(c.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconBtn>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部：整洁的设置 + 额度 */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="flex items-center justify-between border-t border-stone-100 px-4 py-3 text-[13px] text-stone-500 transition hover:bg-stone-50 hover:text-brand-600"
      >
        <span className="flex items-center gap-2">
          <Settings className="h-4 w-4" /> 模型设置
        </span>
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-500">
          免费额度
        </span>
      </button>

      <TemplatesModal open={templatesOpen} onClose={() => setTemplatesOpen(false)} />
      <PacksModal open={packsOpen} onClose={() => setPacksOpen(false)} />
    </aside>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="px-1 pb-1.5 pt-3 text-xs font-medium text-stone-400">{children}</div>;
}

function IconAction({
  children,
  title,
  active,
  badge,
  onClick,
}: {
  children: ReactNode;
  title: string;
  active?: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "relative rounded-md p-1.5 transition",
        active ? "bg-brand-100 text-brand-700" : "text-stone-400 hover:bg-stone-100 hover:text-stone-600"
      )}
    >
      {children}
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  danger,
}: {
  children: ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "rounded p-1 text-stone-400 transition hover:bg-stone-200",
        danger ? "hover:text-red-500" : "hover:text-stone-700"
      )}
    >
      {children}
    </button>
  );
}
