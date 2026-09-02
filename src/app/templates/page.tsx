"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";
import { ShellSidebar } from "@/components/mockup/ShellSidebar";
import { toast } from "@/lib/store/toast";
import { Toaster } from "@/components/Toaster";

interface Category {
  id: string;
  name: string;
  desc: string;
  count: number;
  icon: string;
  tint: string;
  bg: string;
}

interface Tmpl {
  id: string;
  title: string;
  desc: string;
  category: string;
  rating: string;
  usage: string;
  badge?: string;
  preview: number; // 预览图变体序号
}

const CATEGORIES: Category[] = [
  { id: "pm", name: "产品管理", desc: "需求分析、PRD、产品设计等", count: 28, icon: "📘", tint: "text-blue-600", bg: "bg-blue-50" },
  { id: "market", name: "市场营销", desc: "市场分析、营销策划、推广等", count: 24, icon: "📈", tint: "text-violet-600", bg: "bg-violet-50" },
  { id: "project", name: "项目管理", desc: "项目计划、进度跟踪、复盘等", count: 22, icon: "📊", tint: "text-emerald-600", bg: "bg-emerald-50" },
  { id: "ops", name: "运营管理", desc: "运营策略、数据分析、优化等", count: 18, icon: "📉", tint: "text-orange-600", bg: "bg-orange-50" },
  { id: "hr", name: "人力资源", desc: "招聘、培训、绩效、员工关系等", count: 16, icon: "👥", tint: "text-sky-600", bg: "bg-sky-50" },
  { id: "office", name: "通用办公", desc: "文档写作、汇报、会议纪要等", count: 38, icon: "📄", tint: "text-stone-600", bg: "bg-stone-100" },
];

const TEMPLATES: Tmpl[] = [
  { id: "t1", title: "产品需求文档 (PRD)", desc: "标准的产品需求文档模板，包含功能需求、技术需求、产品流程等内容", category: "产品管理", rating: "4.9", usage: "12.5k 使用", preview: 0 },
  { id: "t2", title: "竞品分析报告", desc: "全面的竞品分析报告，包含市场概况、竞品定位、功能对比等维度", category: "市场营销", rating: "4.8", usage: "8.7k 使用", preview: 1 },
  { id: "t3", title: "产品原型设计文档", desc: "产品原型设计说明文档，包含页面结构、交互流程、设计规范等", category: "产品管理", rating: "4.7", usage: "6.2k 使用", preview: 2 },
  { id: "t4", title: "项目计划书", desc: "项目立项到执行的完整计划书，包含目标、计划、资源、风险等", category: "项目管理", rating: "4.8", usage: "9.3k 使用", preview: 3 },
  { id: "t5", title: "市场调研报告", desc: "市场数据分析报告模板，包含调研背景、方法、结果、结论等", category: "市场营销", rating: "4.7", usage: "7.0k 使用", preview: 4 },
  { id: "t6", title: "用户画像模板", desc: "用户画像及特征分析模板，帮助深入了解目标用户群体", category: "产品管理", rating: "4.8", usage: "5.1k 使用", preview: 5 },
  { id: "t7", title: "会议纪要模板", desc: "标准会议纪要模板，包含会议基本信息、议题、讨论内容、决策等", category: "通用办公", rating: "4.9", usage: "15.2k 使用", preview: 6 },
  { id: "t8", title: "周报模板", desc: "工作周报模板，包含本周工作总结、问题、计划等", category: "通用办公", rating: "4.8", usage: "11.3k 使用", preview: 7 },
];

const TOP_RATED = [
  { name: "产品上线计划", cat: "产品管理", rating: "4.9", icon: "📘", tint: "bg-blue-50 text-blue-600" },
  { name: "活动策划方案", cat: "市场营销", rating: "4.8", icon: "📈", tint: "bg-violet-50 text-violet-600" },
  { name: "OKR 制定模板", cat: "运营管理", rating: "4.7", icon: "📊", tint: "bg-orange-50 text-orange-600" },
  { name: "培训课程大纲", cat: "人力资源", rating: "4.8", icon: "👥", tint: "bg-sky-50 text-sky-600" },
  { name: "数据分析报告", cat: "通用办公", rating: "4.9", icon: "📄", tint: "bg-stone-100 text-stone-600" },
];

const MY_TEMPLATES = [
  { name: "产品评审模板", badge: "自定义模板", time: "2024-01-15", tint: "bg-blue-50 text-blue-600" },
  { name: "需求评估模板", badge: "团队模板", time: "2024-01-10", tint: "bg-emerald-50 text-emerald-600" },
  { name: "项目复盘模板", badge: "自定义模板", time: "2024-01-05", tint: "bg-orange-50 text-orange-600" },
];

const TABS = ["热门模板", "最新模板", "高评分模板"];

/** 简单预览缩略图（纯 CSS 模拟文档样子，尽量贴近图里的预览卡） */
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

export default function TemplatesPage() {
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const demo = (label: string) => toast(`演示预览：${label} 功能即将接入`, "info");

  const list = useMemo(() => {
    let arr = TEMPLATES;
    if (cat) arr = arr.filter((t) => t.category === cat);
    const q = query.trim().toLowerCase();
    if (q) arr = arr.filter((t) => t.title.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q));
    return arr;
  }, [query, cat]);

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
                <button onClick={() => demo("查看全部")} className="flex items-center gap-1 text-[12.5px] text-stone-400 transition hover:text-[#c05f3c]">
                  查看全部 <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-6 gap-3">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCat(cat === c.id ? null : c.id)}
                    className={`rounded-2xl border p-4 text-left transition hover:shadow-md ${
                      cat === c.id ? "border-[#f0c9a8] bg-[#fdf1e3]" : "border-[#ece6db] bg-white"
                    }`}
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${c.bg}`}>{c.icon}</span>
                    <p className={`mt-2 text-[13px] font-semibold ${cat === c.id ? "text-[#c05f3c]" : "text-stone-800"}`}>{c.name}</p>
                    <p className="mt-1 text-[11px] leading-4 text-stone-400">{c.desc}</p>
                    <p className="mt-2 text-[11px] text-stone-400">{c.count} 个模板</p>
                  </button>
                ))}
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
                {list.map((t) => {
                  const idx = (tab === 0 ? TEMPLATES.indexOf(t) : TEMPLATES.indexOf(t) + 1) % 8;
                  return (
                    <div
                      key={t.id}
                      onClick={() => demo(`使用模板「${t.title}」`)}
                      className="cursor-pointer rounded-2xl border border-[#ece6db] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:shadow-md"
                    >
                      <PreviewThumb variant={idx} />
                      <p className="mt-3 text-[13.5px] font-semibold text-stone-800">{t.title}</p>
                      <p className="mt-1 min-h-[36px] text-xs leading-5 text-stone-400">{t.desc}</p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-stone-400">
                        <span className="rounded-md bg-[#fbf3ec] px-1.5 py-0.5 font-medium text-[#c05f3c]">{t.category}</span>
                        <span className="flex items-center gap-0.5 text-amber-400"><Star className="h-3 w-3 fill-current" />{t.rating}</span>
                        <span className="ml-auto">{t.usage}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {list.length === 0 && (
                <div className="py-16 text-center text-sm text-stone-400">没有找到匹配的模板</div>
              )}

              <button
                onClick={() => demo("查看更多模板")}
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
                {TOP_RATED.map((r) => (
                  <button key={r.name} onClick={() => demo(`使用模板「${r.name}」`)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-[#fdfaf5]">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${r.tint}`}>{r.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium text-stone-700">{r.name}</span>
                      <span className="block text-[10px] text-stone-400">{r.cat}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-0.5 text-[11px] text-amber-400"><Star className="h-3 w-3 fill-current" />{r.rating}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 我的模板 */}
            <div className="border-b border-[#f0eadf] p-5">
              <p className="text-[14px] font-semibold text-stone-800">我的模板</p>
              <div className="mt-3 space-y-1">
                {MY_TEMPLATES.map((t) => (
                  <button key={t.name} onClick={() => demo(`使用模板「${t.name}」`)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-[#fdfaf5]">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.tint}`}><FileText className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium text-stone-700">{t.name}</span>
                      <span className="block text-[10px] text-stone-400">{t.badge} · 创建于 {t.time}</span>
                    </span>
                  </button>
                ))}
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
      <Toaster />
    </div>
  );
}
