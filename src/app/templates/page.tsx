"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Filter,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import CreditsBadge from "@/components/CreditsBadge";
import { ShellSidebar } from "@/components/mockup/ShellSidebar";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  MODE_LABEL_OF,
  TEMPLATES,
  applyVariables,
  extractVariables,
  type Template,
} from "@/lib/templates";
import { useChatStore } from "@/lib/store/chat";
import { toast } from "@/lib/store/toast";
import { Toaster } from "@/components/Toaster";

interface UseTmplState {
  tpl: Template;
  values: Record<string, string>;
}

/** 带使用统计的模板（内置无统计） */
type TemplateEx = Template & { uses?: number; createdAt?: number };

/** 用户提交的共享模板（来自 /api/templates） */
interface SharedTemplate {
  id: string;
  label: string;
  desc: string;
  category: string;
  mode: string;
  prompt: string;
  author: string;
  uses: number;
  createdAt: number;
  updatedAt: number;
}

const CAT_UI: Record<string, { icon: string; tint: string; bg: string }> = {
  marketing: { icon: "📈", tint: "text-violet-600", bg: "bg-violet-50" },
  ecommerce: { icon: "🛒", tint: "text-orange-600", bg: "bg-orange-50" },
  workplace: { icon: "💼", tint: "text-blue-600", bg: "bg-blue-50" },
  writing: { icon: "✍️", tint: "text-pink-600", bg: "bg-pink-50" },
  research: { icon: "🔬", tint: "text-emerald-600", bg: "bg-emerald-50" },
  business: { icon: "🚀", tint: "text-amber-600", bg: "bg-amber-50" },
  education: { icon: "🎓", tint: "text-sky-600", bg: "bg-sky-50" },
  design: { icon: "🎨", tint: "text-fuchsia-600", bg: "bg-fuchsia-50" },
  video: { icon: "🎬", tint: "text-red-600", bg: "bg-red-50" },
  productivity: { icon: "⚡", tint: "text-stone-600", bg: "bg-stone-100" },
};

const TABS = ["热门模板", "最新模板", "我的提交"];

/** 把共享模板转成统一 Template 结构 */
function sharedToTemplate(s: SharedTemplate): Template {
  return {
    id: s.id,
    label: s.label,
    desc: s.desc,
    category: (CATEGORIES.some((c) => c.id === s.category) ? s.category : "productivity") as Template["category"],
    mode: (["chat", "research", "slides", "image", "video", "docs"].includes(s.mode) ? s.mode : "chat") as Template["mode"],
    prompt: s.prompt,
  };
}

function usesText(uses: number) {
  return uses >= 1000 ? `${(uses / 1000).toFixed(1)}k 使用` : `${uses} 次使用`;
}

/** 稳定伪评分，保持视觉统一 */
function scoreOf(t: Template, idx: number) {
  const rating = (4.5 + ((t.id.length + idx) % 5) * 0.1).toFixed(1);
  return { rating };
}

function PreviewThumb({ variant }: { variant: number }) {
  const palettes = [
    { bg: "#eef3fb", line: "#c7d8f2", bar: "#4d7fe0" },
    { bg: "#f7f0fb", line: "#d8c6f0", bar: "#8b5cf6" },
    { bg: "#eefbf4", line: "#c7ecd8", bar: "#34a06c" },
    { bg: "var(--oc-brand-tint)", line: "#f0cdb9", bar: "#e0703f" },
    { bg: "#f3f6fb", line: "#d0daf0", bar: "#5b86c9" },
    { bg: "#f6f1fb", line: "#dcccf2", bar: "#7c5cd6" },
    { bg: "#f0f5fa", line: "#cddded", bar: "#4a86c4" },
    { bg: "#faf3ef", line: "#e9d2c4", bar: "#c46a3f" },
  ];
  const p = palettes[variant % palettes.length];
  return (
    <div className="h-24 w-full overflow-hidden rounded-lg border border-stone-100" style={{ backgroundColor: p.bg }}>
      <div className="space-y-1.5 p-3">
        <div className="h-2 w-16 rounded" style={{ backgroundColor: p.bar }} />
        <div className="h-1.5 w-full rounded" style={{ backgroundColor: p.line }} />
        <div className="h-1.5 w-5/6 rounded" style={{ backgroundColor: p.line }} />
        <div className="h-1.5 w-4/6 rounded" style={{ backgroundColor: p.line }} />
        <div className="mt-2 h-1.5 w-3/6 rounded" style={{ backgroundColor: p.line }} />
      </div>
      <div className="flex gap-1.5 px-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 flex-1 rounded" style={{ backgroundColor: p.line, opacity: 0.7 }} />
        ))}
      </div>
    </div>
  );
}

function UseTemplateModal({
  state,
  onClose,
  onUsed,
}: {
  state: UseTmplState | null;
  onClose: () => void;
  onUsed?: (id: string) => void;
}) {
  const router = useRouter();
  const { runTemplate } = useChatStore();
  const [values, setValues] = useState<Record<string, string>>({});

  if (!state) return null;
  const tpl = state.tpl;
  const vars = extractVariables(tpl.prompt);
  const ui = CAT_UI[tpl.category];

  const setVal = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  const start = async () => {
    if (vars.some((v) => !values[v]?.trim())) {
      toast("请先填写所有变量", "error");
      return;
    }
    const prompt = applyVariables(tpl.prompt, values);
    onClose();
    toast(`已创建「${tpl.label}」任务，正在生成…`, "success");
    // 共享模板记录一次使用
    if (!tpl.builtin) {
      void fetch(`/api/templates/${tpl.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "use" }),
      })
        .then(() => onUsed?.(tpl.id))
        .catch(() => {});
    }
    await runTemplate({ mode: tpl.mode, prompt });
    router.push("/chat");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${ui?.bg}`}>{ui?.icon}</span>
            <div>
              <h3 className="text-[15px] font-semibold text-stone-800">{tpl.label}</h3>
              <p className="text-[11px] text-stone-400">{CATEGORY_LABELS[tpl.category]} · {MODE_LABEL_OF[tpl.mode]}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-3 text-[12.5px] leading-6 text-stone-500">{tpl.desc}</p>
        <div className="mt-4 space-y-3">
          {vars.length === 0 ? (
            <p className="rounded-lg bg-[var(--oc-brand-tint)] px-3 py-2 text-[12px] text-[var(--oc-brand)]">此模板无需额外信息，点击开始将直接生成。</p>
          ) : (
            vars.map((v) => (
              <label key={v} className="block">
                <span className="mb-1 block text-[12px] font-medium text-stone-600">「{v}」</span>
                <input
                  value={values[v] ?? ""}
                  onChange={(e) => setVal(v, e.target.value)}
                  placeholder={`请输入${v}`}
                  className="w-full rounded-xl border border-[var(--oc-border)] bg-white px-3 py-2 text-[13px] text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-[var(--oc-brand-border)]"
                />
              </label>
            ))
          )}
        </div>
        <button
          onClick={() => void start()}
          className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 py-2.5 text-[13px] font-medium text-white shadow-sm transition hover:brightness-105"
        >
          <Sparkles className="h-4 w-4" /> 开始使用
        </button>
      </div>
    </div>
  );
}

function SubmitTemplateModal({
  open,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [label, setLabel] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState<string>("productivity");
  const [mode, setMode] = useState<string>("chat");
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!label.trim() || !prompt.trim()) {
      toast("请填写模板名称与提示词", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, desc, category, mode, prompt }),
      });
      const data = (await res.json()) as { template?: SharedTemplate; error?: string };
      if (!res.ok || !data.template) throw new Error(data.error ?? "提交失败");
      toast(`模板「${label}」已发布`, "success");
      setLabel("");
      setDesc("");
      setPrompt("");
      onSubmitted();
      onClose();
    } catch (e) {
      toast(`提交失败：${e instanceof Error ? e.message : ""}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-stone-100 px-5 py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-stone-800">提交我的模板</h3>
            <p className="mt-0.5 text-xs text-stone-400">发布后可与所有人共享使用（保存在本地数据库）</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto p-5">
          <label className="block">
            <span className="mb-1 block text-[12.5px] font-medium text-stone-600">模板名称 *</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="例如：小红书爆款标题生成器"
              className="w-full rounded-xl border border-[var(--oc-border)] bg-white px-3 py-2.5 text-[13px] text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-[var(--oc-brand-border)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12.5px] font-medium text-stone-600">一句话描述</span>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="这个模板用来做什么"
              className="w-full rounded-xl border border-[var(--oc-border)] bg-white px-3 py-2.5 text-[13px] text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-[var(--oc-brand-border)]"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[12.5px] font-medium text-stone-600">场景分类</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-[var(--oc-border)] bg-white px-3 py-2.5 text-[13px] text-stone-700 outline-none focus:border-[var(--oc-brand-border)]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[12.5px] font-medium text-stone-600">产出模式</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full rounded-xl border border-[var(--oc-border)] bg-white px-3 py-2.5 text-[13px] text-stone-700 outline-none focus:border-[var(--oc-brand-border)]"
              >
                {Object.entries(MODE_LABEL_OF).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 flex items-center justify-between text-[12.5px] font-medium text-stone-600">
              提示词 *
              <span className="text-[11px] font-normal text-stone-400">用 {"{{变量}}"} 占位，运行时会要求填写</span>
            </span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              placeholder="例：为「{{产品}}」写 5 条小红书种草文案，每条含标题、正文和标签…"
              className="w-full resize-none rounded-xl border border-[var(--oc-border)] bg-white px-3 py-2.5 text-[13px] leading-6 text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-[var(--oc-brand-border)]"
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-stone-400">
              <span>{extractVariables(prompt).length} 个变量：{extractVariables(prompt).join("、") || "无"}</span>
              <span>{prompt.length}/4000</span>
            </div>
          </label>
        </div>
        <footer className="flex shrink-0 items-center justify-end gap-2.5 border-t border-stone-100 px-5 py-3.5">
          <button
            onClick={onClose}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-[13px] text-stone-600 transition hover:bg-stone-50"
          >
            取消
          </button>
          <button
            onClick={() => void submit()}
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 px-5 py-2 text-[13px] font-medium text-white shadow-sm transition hover:brightness-105 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            发布模板
          </button>
        </footer>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [modal, setModal] = useState<UseTmplState | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [shared, setShared] = useState<SharedTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadShared = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      const data = (await res.json()) as { templates?: SharedTemplate[] };
      setShared(data.templates ?? []);
    } catch {
      toast("加载共享模板失败", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadShared();
  }, [loadShared]);

  // 内置 + 共享合并
  const all = useMemo<TemplateEx[]>(() => {
    const sharedTpls: TemplateEx[] = shared.map((s) => ({
      ...sharedToTemplate(s),
      uses: s.uses,
      createdAt: s.createdAt,
    }));
    return [...TEMPLATES, ...sharedTpls];
  }, [shared]);

  const categoryCount = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of all) m[t.category] = (m[t.category] ?? 0) + 1;
    return m;
  }, [all]);

  const [showAll, setShowAll] = useState(false);

  const list = useMemo(() => {
    let arr = all.slice();
    if (cat) arr = arr.filter((t) => t.category === cat);
    if (tab === 0) arr = arr.sort((a, b) => (b.uses ?? 0) - (a.uses ?? 0));
    if (tab === 1) arr = arr.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    if (tab === 2) arr = arr.filter((t) => !t.builtin);
    const q = query.trim().toLowerCase();
    if (q) arr = arr.filter((t) => t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.prompt.toLowerCase().includes(q));
    return showAll ? arr : arr.slice(0, 12);
  }, [query, cat, tab, all, showAll]);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--oc-bg)] text-stone-800">
      <ShellSidebar active="templates" />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* 顶栏 */}
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--oc-border-soft)] bg-[var(--oc-bg)] px-6 py-4">
          <div>
            <h1 className="text-[18px] font-semibold text-stone-900">{t("pages.templates")}</h1>
            <p className="mt-0.5 text-[12.5px] text-stone-400">精选各类专业模板，助你高效完成各类工作</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <CreditsBadge />
            <button
              onClick={() => setSubmitOpen(true)}
              className="ml-2 flex items-center gap-1.5 rounded-xl border border-[var(--oc-brand-border-soft)] bg-white px-4 py-2 text-[13px] font-medium text-[var(--oc-brand)] transition hover:bg-[var(--oc-brand-hover)]"
            >
              <Plus className="h-4 w-4" /> 提交模板
            </button>
          </div>
        </header>

        {/* 内容 */}
        <div className="flex min-h-0 flex-1 overflow-hidden px-6 pb-6 pt-5">
          {/* 主区域 */}
          <div className="min-w-0 flex-1 overflow-y-auto pr-4">
            {/* 搜索 + 筛选 */}
            <div className="flex gap-3">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-[var(--oc-border)] bg-white px-3 py-2.5 text-stone-400">
                <Search className="h-4 w-4" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索模板名称、描述或关键词"
                  className="w-full bg-transparent text-[13px] text-stone-700 outline-none placeholder:text-stone-400"
                />
              </div>
              <select
                value={cat ?? ""}
                onChange={(e) => {
                  setCat(e.target.value || null);
                  setShowAll(false);
                }}
                className="flex items-center gap-2 rounded-xl border border-[var(--oc-border)] bg-white px-4 py-2.5 text-[13px] text-stone-600 outline-none transition hover:border-[var(--oc-brand-border)] hover:text-[var(--oc-brand)]"
              >
                <option value="">全部场景</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}（{categoryCount[c.id] ?? 0}）
                  </option>
                ))}
              </select>
            </div>

            {/* 按场景分类 */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-stone-800">按场景分类</h2>
                <button onClick={() => setCat(null)} className="flex items-center gap-1 text-[12.5px] text-stone-400 transition hover:text-[var(--oc-brand)]">
                  查看全部 <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-6 gap-3">
                {CATEGORIES.slice(0, 6).map((c) => {
                  const ui = CAT_UI[c.id];
                  const active = cat === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCat(active ? null : c.id)}
                      className={`rounded-2xl border p-4 text-left transition hover:shadow-md ${
                        active ? "border-[var(--oc-brand-border-soft)] bg-[var(--oc-brand-soft)]" : "border-[var(--oc-border)] bg-white"
                      }`}
                    >
                      <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${ui?.bg}`}>{ui?.icon}</span>
                      <p className={`mt-2 text-[13px] font-semibold ${active ? "text-[var(--oc-brand)]" : "text-stone-800"}`}>{c.label}</p>
                      <p className="mt-1 text-[11px] leading-4 text-stone-400">{categoryCount[c.id] ?? 0} 个模板</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 模板列表 */}
            <div className="mt-5">
              <div className="border-b border-[var(--oc-border-strong)]">
                <div className="flex gap-5">
                  {TABS.map((t, i) => (
                    <button
                      key={t}
                      onClick={() => setTab(i)}
                      className={`relative pb-3 pt-1 text-[13px] ${i === tab ? "font-medium text-[var(--oc-brand)]" : "text-stone-500 transition hover:text-stone-800"}`}
                    >
                      {t}
                      {t === "热门模板" && <span className="ml-1 text-[10px] text-orange-400">🔥</span>}
                      {i === tab && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[var(--oc-brand-bright)]" />}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center gap-2 py-16 text-stone-400">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                  <p className="text-sm">加载模板中…</p>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {list.map((t, i) => {
                    const sc = scoreOf(t, i);
                    const isMine = !t.builtin && (t as TemplateEx).uses !== undefined;
                    const hot = TABS[tab] === "热门模板" && i < 3;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setModal({ tpl: t, values: {} })}
                        className={`group relative cursor-pointer rounded-2xl border bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:shadow-md ${
                          hot ? "border-[var(--oc-brand-border-soft)] ring-1 ring-[var(--oc-brand-border-soft)]" : "border-[var(--oc-border)]"
                        }`}
                      >
                        {hot && (
                          <span className="absolute -top-2 left-3 flex items-center gap-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                            🔥 TOP{i + 1}
                          </span>
                        )}
                        <PreviewThumb variant={i} />
                        <div className="mt-3 flex items-start justify-between gap-2">
                          <p className="truncate text-[13.5px] font-semibold text-stone-800">{t.label}</p>
                          {isMine && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!window.confirm(`删除模板「${t.label}」？`)) return;
                                try {
                                  await fetch(`/api/templates/${t.id}`, { method: "DELETE" });
                                  toast("已删除", "success");
                                  await loadShared();
                                } catch {
                                  toast("删除失败", "error");
                                }
                              }}
                              title="删除我的模板"
                              className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-md text-stone-300 transition hover:bg-red-50 hover:text-red-500 group-hover:flex"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="mt-1 min-h-[36px] text-xs leading-5 text-stone-400">{t.desc || "（无描述）"}</p>
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-stone-400">
                          <span className="rounded-md bg-[var(--oc-brand-tint)] px-1.5 py-0.5 font-medium text-[var(--oc-brand)]">{CATEGORY_LABELS[t.category] ?? t.category}</span>
                          <span className="text-[10px] text-stone-400">{MODE_LABEL_OF[t.mode] ?? t.mode}</span>
                          <span className="flex items-center gap-0.5 text-amber-400"><Star className="h-3 w-3 fill-current" />{sc.rating}</span>
                          <span className="ml-auto">{isMine ? usesText((t as TemplateEx).uses ?? 0) : "内置"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!loading && list.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-16 text-stone-400">
                  <Sparkles className="h-8 w-8 text-stone-300" />
                  <p className="text-sm">暂无模板，点击右上角「提交模板」分享你的第一个模板</p>
                </div>
              )}

              {!loading && !showAll && all.length > 12 && (
                <button
                  onClick={() => setShowAll(true)}
                  className="mx-auto mt-5 flex items-center gap-1 rounded-full border border-[var(--oc-border)] bg-white px-4 py-2 text-[12.5px] text-stone-500 transition hover:border-[var(--oc-brand-border)] hover:text-[var(--oc-brand)]"
                >
                  查看更多模板（共 {all.length} 个） <ChevronDown className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 右侧面板 */}
          <aside className="hidden w-[300px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[var(--oc-border)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] xl:flex">
            {/* 推荐模板 */}
            <div className="border-b border-[var(--oc-border-soft)] p-5">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[14px] font-semibold text-stone-800"><Sparkles className="h-4 w-4 text-orange-500" />推荐模板</p>
                <button
                  onClick={() => {
                    const seed = Math.floor(Math.random() * 997);
                    const rec = [...all].sort((a, b) => ((b.uses ?? 0) + seed % 17) - ((a.uses ?? 0) + seed % 13));
                    setModal({ tpl: rec[0], values: {} });
                  }}
                  className="text-[11px] text-stone-400 transition hover:text-[var(--oc-brand)]"
                >
                  随机来一个
                </button>
              </div>
              <div className="mt-3 space-y-1">
                {[...all].sort((a, b) => (b.uses ?? 0) - (a.uses ?? 0)).slice(0, 5).map((t, i) => {
                  const ui = CAT_UI[t.category];
                  const sc = scoreOf(t, i);
                  return (
                    <button key={t.id} onClick={() => setModal({ tpl: t, values: {} })} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-[var(--oc-hover)]">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${ui?.bg}`}>{ui?.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium text-stone-700">{t.label}</span>
                        <span className="block text-[10px] text-stone-400">{CATEGORY_LABELS[t.category] ?? t.category}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-0.5 text-[11px] text-amber-400"><Star className="h-3 w-3 fill-current" />{sc.rating}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 我的模板 */}
            <div className="border-b border-[var(--oc-border-soft)] p-5">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-semibold text-stone-800">我的模板</p>
                <button onClick={() => setTab(2)} className="flex items-center gap-0.5 text-[11px] text-stone-400 transition hover:text-[var(--oc-brand)]">
                  查看全部 <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="mt-3 space-y-1">
                {shared.length === 0 && <p className="px-2 py-1 text-xs text-stone-300">还没有提交过模板</p>}
                {shared.slice(0, 5).map((s) => {
                  const ui = CAT_UI[s.category];
                  return (
                    <div key={s.id} className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-[var(--oc-hover)]">
                      <button onClick={() => setModal({ tpl: sharedToTemplate(s), values: {} })} className="flex min-w-0 flex-1 items-center gap-3">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ui?.bg}`}><FileText className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] font-medium text-stone-700">{s.label}</span>
                          <span className="block text-[10px] text-stone-400">{CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS] ?? s.category} · {MODE_LABEL_OF[s.mode as keyof typeof MODE_LABEL_OF] ?? s.mode} · {usesText(s.uses)}</span>
                        </span>
                      </button>
                      <button
                        title="删除"
                        onClick={async () => {
                          if (!window.confirm(`删除模板「${s.label}」？`)) return;
                          try {
                            await fetch(`/api/templates/${s.id}`, { method: "DELETE" });
                            toast("已删除", "success");
                            await loadShared();
                          } catch {
                            toast("删除失败", "error");
                          }
                        }}
                        className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-md text-stone-300 transition hover:bg-red-50 hover:text-red-500 group-hover:flex"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 提交模板 */}
            <div className="p-5">
              <p className="text-[14px] font-semibold text-stone-800">没有找到合适的模板？</p>
              <p className="mt-1 text-[12px] text-stone-400">提交你的模板，与更多人分享</p>
              <button
                onClick={() => setSubmitOpen(true)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--oc-brand-border-soft)] bg-white py-2.5 text-[13px] font-medium text-[var(--oc-brand)] transition hover:bg-[var(--oc-brand-hover)]"
              >
                <Plus className="h-4 w-4" /> 提交模板
              </button>
            </div>
          </aside>
        </div>
      </main>
      <UseTemplateModal state={modal} onClose={() => setModal(null)} onUsed={() => void loadShared()} />
      <SubmitTemplateModal open={submitOpen} onClose={() => setSubmitOpen(false)} onSubmitted={() => void loadShared()} />
      <Toaster />
    </div>
  );
}
