"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  FileText,
  Filter,
  LayoutGrid,
  Plus,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
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

const TABS = ["热门模板", "最新模板", "高评分模板"];

/** 依据真实模板生成卡片，评分/使用量用稳定的伪值保持视觉统一 */
function scoreOf(t: Template, idx: number) {
  const rating = (4.5 + ((t.id.length + idx) % 5) * 0.1).toFixed(1);
  const usage = [12.5, 8.7, 6.2, 9.3, 7.0, 5.1, 15.2, 11.3][idx % 8];
  return { rating, usage: `${usage}k 使用` };
}

function PreviewThumb({ variant }: { variant: number }) {
  const palettes = [
    { bg: "#eef3fb", line: "#c7d8f2", bar: "#4d7fe0" },
    { bg: "#f7f0fb", line: "#d8c6f0", bar: "#8b5cf6" },
    { bg: "#eefbf4", line: "#c7ecd8", bar: "#34a06c" },
    { bg: "#fdf3ee", line: "#f0cdb9", bar: "#e0703f" },
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

function UseTemplateModal({ state, onClose }: { state: UseTmplState | null; onClose: () => void }) {
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
            <p className="rounded-lg bg-[#fbf3ec] px-3 py-2 text-[12px] text-[#c05f3c]">此模板无需额外信息，点击开始将直接生成。</p>
          ) : (
            vars.map((v) => (
              <label key={v} className="block">
                <span className="mb-1 block text-[12px] font-medium text-stone-600">「{v}」</span>
                <input
                  value={values[v] ?? ""}
                  onChange={(e) => setVal(v, e.target.value)}
                  placeholder={`请输入${v}`}
                  className="w-full rounded-xl border border-[#ece6db] bg-white px-3 py-2 text-[13px] text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-[#e0b79c]"
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

export default function TemplatesPage() {
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [modal, setModal] = useState<UseTmplState | null>(null);

  const demo = (label: string) => toast(`演示预览：${label} 功能即将接入`, "info");

  const categoryCount = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of TEMPLATES) m[t.category] = (m[t.category] ?? 0) + 1;
    return m;
  }, []);

  const list = useMemo(() => {
    let arr = TEMPLATES;
    if (cat) arr = arr.filter((t) => t.category === cat);
    if (tab === 0) arr = [...arr].sort((a, b) => a.label.localeCompare(b.label, "zh")).slice(0, 4).concat(arr.slice(4).slice(0, 4));
    if (tab === 2) arr = [...arr].sort((a, b) => b.id.length - a.id.length).slice(0, 8);
    if (tab === 1) arr = arr.slice(-8);
    const q = query.trim().toLowerCase();
    if (q) arr = arr.filter((t) => t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q));
    return arr.slice(0, 8);
  }, [query, cat, tab]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#fbf8f4] text-stone-800">
      <ShellSidebar active="templates" />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* 顶栏 */}
        <header className="flex shrink-0 items-center justify-between border-b border-[#f0eadf] bg-[#fbf8f4] px-6 py-4">
          <div>
            <h1 className="text-[18px] font-semibold text-stone-900">模板中心</h1>
            <p className="mt-0.5 text-[12.5px] text-stone-400">精选各类专业模板，助你高效完成各类工作</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white hover:text-stone-700">
              <Bell className="h-[18px] w-[18px]" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white hover:text-stone-700">
              <LayoutGrid className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={() => demo("提交模板")}
              className="ml-2 flex items-center gap-1.5 rounded-xl border border-[#f0c9a8] bg-white px-4 py-2 text-[13px] font-medium text-[#c05f3c] transition hover:bg-[#fdeee1]"
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
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#ece6db] bg-white px-3 py-2.5 text-stone-400">
                <Search className="h-4 w-4" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索模板名称、描述或关键词"
                  className="w-full bg-transparent text-[13px] text-stone-700 outline-none placeholder:text-stone-400"
                />
              </div>
              <button
                onClick={() => demo("场景筛选")}
                className="flex items-center gap-2 rounded-xl border border-[#ece6db] bg-white px-4 py-2.5 text-[13px] text-stone-600 transition hover:border-[#e0b79c] hover:text-[#c05f3c]"
              >
                <Filter className="h-4 w-4" /> 全部场景 <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
              </button>
            </div>

            {/* 按场景分类 */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-stone-800">按场景分类</h2>
                <button onClick={() => setCat(null)} className="flex items-center gap-1 text-[12.5px] text-stone-400 transition hover:text-[#c05f3c]">
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
                        active ? "border-[#f0c9a8] bg-[#fdf1e3]" : "border-[#ece6db] bg-white"
                      }`}
                    >
                      <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${ui?.bg}`}>{ui?.icon}</span>
                      <p className={`mt-2 text-[13px] font-semibold ${active ? "text-[#c05f3c]" : "text-stone-800"}`}>{c.label}</p>
                      <p className="mt-1 text-[11px] leading-4 text-stone-400">{TEMPLATES.filter((t) => t.category === c.id).length} 个模板</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 模板列表 */}
            <div className="mt-5">
              <div className="border-b border-[#efe9dd]">
                <div className="flex gap-5">
                  {TABS.map((t, i) => (
                    <button
                      key={t}
                      onClick={() => setTab(i)}
                      className={`relative pb-3 pt-1 text-[13px] ${i === tab ? "font-medium text-[#c05f3c]" : "text-stone-500 transition hover:text-stone-800"}`}
                    >
                      {t}
                      {t === "热门模板" && <span className="ml-1 text-[10px] text-orange-400">🔥</span>}
                      {i === tab && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#f07a3f]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-3">
                {list.map((t, i) => {
                  const sc = scoreOf(t, i);
                  return (
                    <div
                      key={t.id}
                      onClick={() => setModal({ tpl: t, values: {} })}
                      className="cursor-pointer rounded-2xl border border-[#ece6db] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:shadow-md"
                    >
                      <PreviewThumb variant={i} />
                      <p className="mt-3 text-[13.5px] font-semibold text-stone-800">{t.label}</p>
                      <p className="mt-1 min-h-[36px] text-xs leading-5 text-stone-400">{t.desc}</p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-stone-400">
                        <span className="rounded-md bg-[#fbf3ec] px-1.5 py-0.5 font-medium text-[#c05f3c]">{CATEGORY_LABELS[t.category]}</span>
                        <span className="text-[10px] text-stone-400">{MODE_LABEL_OF[t.mode]}</span>
                        <span className="flex items-center gap-0.5 text-amber-400"><Star className="h-3 w-3 fill-current" />{sc.rating}</span>
                        <span className="ml-auto">{sc.usage}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {list.length === 0 && <div className="py-16 text-center text-sm text-stone-400">没有找到匹配的模板</div>}

              <button
                onClick={() => setCat(null)}
                className="mx-auto mt-5 flex items-center gap-1 rounded-full border border-[#ece6db] bg-white px-4 py-2 text-[12.5px] text-stone-500 transition hover:border-[#e0b79c] hover:text-[#c05f3c]"
              >
                查看更多模板 <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* 右侧面板 */}
          <aside className="hidden w-[300px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#ece6db] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] xl:flex">
            {/* 推荐模板 */}
            <div className="border-b border-[#f0eadf] p-5">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[14px] font-semibold text-stone-800"><Sparkles className="h-4 w-4 text-orange-500" />推荐模板</p>
                <button onClick={() => demo("换一批")} className="text-[11px] text-stone-400 transition hover:text-[#c05f3c]">换一批</button>
              </div>
              <div className="mt-3 space-y-1">
                {TEMPLATES.slice(0, 5).map((t) => {
                  const ui = CAT_UI[t.category];
                  const sc = scoreOf(t, 0);
                  return (
                    <button key={t.id} onClick={() => setModal({ tpl: t, values: {} })} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-[#fdfaf5]">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${ui?.bg}`}>{ui?.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium text-stone-700">{t.label}</span>
                        <span className="block text-[10px] text-stone-400">{CATEGORY_LABELS[t.category]}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-0.5 text-[11px] text-amber-400"><Star className="h-3 w-3 fill-current" />{sc.rating}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 我的模板 */}
            <div className="border-b border-[#f0eadf] p-5">
              <p className="text-[14px] font-semibold text-stone-800">我的模板</p>
              <div className="mt-3 space-y-1">
                {TEMPLATES.slice(5, 8).map((t) => {
                  const ui = CAT_UI[t.category];
                  return (
                    <button key={t.id} onClick={() => setModal({ tpl: t, values: {} })} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-[#fdfaf5]">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ui?.bg}`}><FileText className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium text-stone-700">{t.label}</span>
                        <span className="block text-[10px] text-stone-400">{CATEGORY_LABELS[t.category]} · {MODE_LABEL_OF[t.mode]}</span>
                      </span>
                    </button>
                  );
                })}
                <button onClick={() => demo("查看全部")} className="flex items-center gap-1 px-2 py-1 text-[12px] text-[#c05f3c] transition hover:opacity-80">
                  查看全部 <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* 提交模板 */}
            <div className="p-5">
              <p className="text-[14px] font-semibold text-stone-800">没有找到合适的模板？</p>
              <p className="mt-1 text-[12px] text-stone-400">提交你的模板，与更多人分享</p>
              <button
                onClick={() => demo("提交模板")}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#f0c9a8] bg-white py-2.5 text-[13px] font-medium text-[#c05f3c] transition hover:bg-[#fdeee1]"
              >
                <Plus className="h-4 w-4" /> 提交模板
              </button>
            </div>
          </aside>
        </div>
      </main>
      <UseTemplateModal state={modal} onClose={() => setModal(null)} />
      <Toaster />
    </div>
  );
}
