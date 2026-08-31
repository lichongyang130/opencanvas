"use client";

import { useMemo, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Clock,
  Heart,
  LayoutGrid,
  Play,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import {
  TEMPLATES,
  CATEGORIES,
  CATEGORY_LABELS,
  extractVariables,
  applyVariables,
  type Template,
  type TemplateCategory,
} from "@/lib/templates";
import type { WorkspaceMode } from "@/lib/store/chat";
import { useChatStore } from "@/lib/store/chat";
import { usePromptStore } from "@/lib/prompt-store";
import { toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tab = "fav" | "recent" | "mine" | TemplateCategory;

const MODE_TAG: Record<WorkspaceMode, string> = {
  chat: "对话",
  research: "研究",
  slides: "PPT",
  image: "绘图",
  video: "视频",
  docs: "文档",
};
const MODE_COLOR: Record<WorkspaceMode, string> = {
  chat: "bg-blue-50 text-blue-600",
  research: "bg-emerald-50 text-emerald-600",
  slides: "bg-violet-50 text-violet-600",
  image: "bg-pink-50 text-pink-600",
  video: "bg-orange-50 text-orange-600",
  docs: "bg-amber-50 text-amber-600",
};

const TAB_ICONS: Record<string, ReactNode> = {
  fav: <Heart className="h-4 w-4" />,
  recent: <Clock className="h-4 w-4" />,
  mine: <Sparkles className="h-4 w-4" />,
};

export function TemplatesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const runTemplate = useChatStore((s) => s.runTemplate);
  const sending = useChatStore((s) => s.sending);
  const { favorites, custom, recent, toggleFavorite, addCustom, removeCustom, markUsed } =
    usePromptStore();

  const [tab, setTab] = useState<Tab>("fav");
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState<Template | null>(null);
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);

  const all = useMemo(() => [...custom, ...TEMPLATES], [custom]);
  const favSet = useMemo(() => new Set(favorites), [favorites]);

  const list = useMemo(() => {
    let base: Template[];
    if (tab === "fav") base = all.filter((t) => favSet.has(t.id));
    else if (tab === "recent")
      base = recent
        .map((id) => all.find((t) => t.id === id))
        .filter((t): t is Template => Boolean(t));
    else if (tab === "mine") base = custom;
    else base = all.filter((t) => t.category === tab);

    if (query.trim()) {
      const q = query.toLowerCase();
      base = base.filter((t) =>
        (t.label + t.desc + t.prompt + t.category).toLowerCase().includes(q)
      );
    }
    return base;
  }, [tab, query, all, favSet, recent, custom]);

  if (!open) return null;

  const close = () => {
    onClose();
    setRunning(null);
    setShowCreate(false);
  };

  const doRun = (t: Template, values: Record<string, string>) => {
    const prompt = applyVariables(t.prompt, values);
    markUsed(t.id);
    close();
    setTimeout(() => void runTemplate({ mode: t.mode, prompt }), 80);
  };

  const sidebar: { id: Tab; label: string; icon: ReactNode; count?: number }[] = [
    { id: "fav", label: "我的收藏", icon: TAB_ICONS.fav, count: favorites.length },
    { id: "recent", label: "最近使用", icon: TAB_ICONS.recent, count: recent.length },
    ...CATEGORIES.map((c) => ({
      id: c.id as Tab,
      label: c.label,
      icon: <LayoutGrid className="h-4 w-4" />,
    })),
    { id: "mine", label: "我的提示词", icon: TAB_ICONS.mine, count: custom.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={close}>
      <div
        className="flex h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 左侧分类 */}
        <div className="flex w-44 shrink-0 flex-col border-r border-stone-100 bg-stone-50">
          <div className="flex items-center gap-2 px-4 py-4 font-semibold">
            <Wand2 className="h-5 w-5 text-brand-600" /> 提示词库
          </div>
          <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
            {sidebar.map((s) => (
              <button
                key={s.id}
                onClick={() => setTab(s.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                  tab === s.id
                    ? "bg-brand-600 font-medium text-white"
                    : "text-stone-600 hover:bg-stone-200/60"
                )}
              >
                {s.icon}
                <span className="flex-1 text-left">{s.label}</span>
                {s.count !== undefined && s.count > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[10px]",
                      tab === s.id ? "bg-white/20" : "bg-stone-200 text-stone-500"
                    )}
                  >
                    {s.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-stone-100 p-2">
            <button
              onClick={() => setShowCreate(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-brand-300 px-3 py-2 text-sm text-brand-600 transition hover:bg-brand-50"
            >
              <Plus className="h-4 w-4" /> 新建提示词
            </button>
          </div>
        </div>

        {/* 右侧内容 */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-stone-100 px-4 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-stone-200 px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-stone-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索提示词、场景、关键词…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-stone-300"
              />
              {query && (
                <button onClick={() => setQuery("")}>
                  <X className="h-3.5 w-3.5 text-stone-300 hover:text-stone-500" />
                </button>
              )}
            </div>
            <button onClick={close} className="rounded-lg p-1 text-stone-400 hover:bg-stone-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {list.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-stone-400">
                <Wand2 className="h-8 w-8" />
                <p className="text-sm">
                  {tab === "fav"
                    ? "还没有收藏，点卡片上的 ☆ 收藏常用提示词"
                    : tab === "recent"
                      ? "使用过的提示词会出现在这里"
                      : tab === "mine"
                        ? "还没有自建提示词，点左下角「新建提示词」"
                        : "没有匹配的提示词"}
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {list.map((t) => {
                  const fav = favSet.has(t.id);
                  const isMine = tab === "mine" || custom.some((c) => c.id === t.id);
                  return (
                    <div
                      key={t.id}
                      className="group flex flex-col rounded-xl border border-stone-200 p-3.5 transition hover:border-brand-300 hover:shadow-sm"
                    >
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-stone-800">
                            <span className="truncate">{t.label}</span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className={cn("rounded px-1.5 py-0.5 text-[10px]", MODE_COLOR[t.mode])}>
                              {MODE_TAG[t.mode]}
                            </span>
                            <span className="truncate text-[11px] text-stone-400">
                              {CATEGORY_LABELS[t.category]} · {t.desc}
                            </span>
                          </div>
                        </div>
                        <button
                          title={fav ? "取消收藏" : "收藏"}
                          onClick={() => toggleFavorite(t.id)}
                          className="shrink-0 text-stone-300 transition hover:text-amber-400"
                        >
                          {fav ? (
                            <BookmarkCheck className="h-4 w-4 text-brand-600" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="mb-3 line-clamp-2 min-h-[2rem] text-xs leading-relaxed text-stone-400">
                        {t.prompt.length > 90 ? t.prompt.slice(0, 90) + "…" : t.prompt}
                      </p>
                      <div className="mt-auto flex items-center gap-2">
                        <button
                          disabled={sending}
                          onClick={() => {
                            const vars = extractVariables(t.prompt);
                            if (vars.length) {
                              setRunning(t);
                              setVarValues(Object.fromEntries(vars.map((v) => [v, ""])));
                            } else {
                              doRun(t, {});
                            }
                          }}
                          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand-600 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700 disabled:opacity-40"
                        >
                          <Play className="h-3 w-3" /> 使用
                        </button>
                        {isMine && (
                          <button
                            title="删除"
                            onClick={() => {
                              removeCustom(t.id);
                              toast("已删除", "info");
                            }}
                            className="rounded-lg border border-stone-200 p-1.5 text-stone-400 transition hover:border-red-300 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 变量填空 */}
      {running && (
        <VariableDialog
          template={running}
          values={varValues}
          onChange={setVarValues}
          onCancel={() => setRunning(null)}
          onConfirm={() => doRun(running, varValues)}
        />
      )}

      {showCreate && (
        <CreatePromptDialog
          onClose={() => setShowCreate(false)}
          onSave={(p) => {
            addCustom(p);
            setShowCreate(false);
            setTab("mine");
            toast("已保存到「我的提示词」", "success");
          }}
        />
      )}
    </div>
  );
}

/** 变量填空弹窗 */
function VariableDialog({
  template,
  values,
  onChange,
  onCancel,
  onConfirm,
}: {
  template: Template;
  values: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const vars = extractVariables(template.prompt);
  const filled = vars.every((v) => values[v]?.trim());
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center gap-2 font-semibold">
          <Star className="h-4 w-4 text-brand-600" /> {template.label}
        </div>
        <p className="mb-4 text-xs text-stone-400">填写下面的内容，替换提示词中的变量</p>
        <div className="space-y-3">
          {vars.map((v) => (
            <div key={v}>
              <label className="mb-1 block text-xs font-medium text-stone-500">{v}</label>
              <textarea
                value={values[v] ?? ""}
                autoFocus
                rows={2}
                onChange={(e) => onChange({ ...values, [v]: e.target.value })}
                placeholder={`请输入${v}`}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-stone-200 px-4 py-2 text-sm hover:bg-stone-50">
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={!filled}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40"
          >
            开始生成
          </button>
        </div>
      </div>
    </div>
  );
}

/** 新建提示词 */
function CreatePromptDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (p: Omit<Template, "id" | "builtin">) => void;
}) {
  const [label, setLabel] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("productivity");
  const [mode, setMode] = useState<WorkspaceMode>("chat");
  const [prompt, setPrompt] = useState("");

  const canSave = label.trim() && prompt.trim();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Plus className="h-4 w-4 text-brand-600" /> 新建提示词
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">名称</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="如：小红书爆款标题"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500">分类</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500">工作台</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as WorkspaceMode)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              >
                {(Object.keys(MODE_TAG) as WorkspaceMode[]).map((m) => (
                  <option key={m} value={m}>
                    {MODE_TAG[m]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">一句话说明</label>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="这个提示词用来做什么"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">
              提示词内容（可用 {"{{变量名}}"} 作为填空）
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              placeholder="例：为「{{产品}}」写 5 条小红书种草文案，每条含标题、正文和标签…"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-stone-200 px-4 py-2 text-sm hover:bg-stone-50">
            取消
          </button>
          <button
            disabled={!canSave}
            onClick={() =>
              onSave({ label: label.trim(), desc: desc.trim() || "自定义", category, mode, prompt: prompt.trim() })
            }
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
