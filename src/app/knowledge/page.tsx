"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Box,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Folder,
  Gauge,
  GraduationCap,
  Layers,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  Search,
  Share2,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react";
import { ShellSidebar } from "@/components/mockup/ShellSidebar";
import { toast } from "@/lib/store/toast";
import { Toaster } from "@/components/Toaster";
import {
  createKnowledgeBase,
  loadKnowledgeBases,
  summarize,
  type KbRow,
} from "@/lib/knowledge";

const STATS_META = [
  { icon: Box, label: "知识库总数", unit: "个", tint: "bg-violet-50 text-violet-600" },
  { icon: FileText, label: "文档总数", unit: "个", tint: "bg-sky-50 text-sky-600" },
  { icon: Layers, label: "向量条目数", unit: "条", tint: "bg-orange-50 text-orange-600" },
  { icon: Gauge, label: "总大小", unit: "GB", tint: "bg-emerald-50 text-emerald-600" },
];

const TABS = ["全部知识库", "我的知识库", "共享给我", "团队知识库"];
const TAGS = ["产品", "需求", "设计", "PRD"];
const ABILITIES = [
  { icon: Sparkles, label: "语义搜索", desc: "基于语义理解的智能搜索" },
  { icon: GraduationCap, label: "问答增强", desc: "基于知识库内容回答问题" },
  { icon: FileText, label: "引用来源", desc: "展示答案引用的文档来源" },
];
const RECENT_DOCS = [
  { name: "产品需求文档PRD v2.1", time: "今天 14:30", tint: "bg-sky-50 text-sky-600" },
  { name: "用户体验设计规范", time: "今天 11:15", tint: "bg-violet-50 text-violet-600" },
  { name: "产品功能清单 v1.3", time: "昨天 16:45", tint: "bg-orange-50 text-orange-600" },
];

const PAGE_SIZE = 6;

function formatSize(n: number) {
  if (n <= 0) return "0 B";
  if (n >= 1) return `${n.toFixed(1)} GB`;
  return `${Math.round(n * 1024)} MB`;
}

export default function KnowledgePage() {
  const [rows, setRows] = useState<KbRow[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string>("kb-prod");
  const [abilities, setAbilities] = useState<Record<string, boolean>>({
    semantic: true,
    qa: true,
    cite: false,
  });

  useEffect(() => {
    setRows(loadKnowledgeBases());
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q)) : rows;
    return base;
  }, [rows, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageRows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const selected = rows.find((r) => r.id === selectedId) ?? rows[0];
  const summary = summarize(rows);

  const demo = (label: string) => toast(`演示预览：${label} 功能即将接入`, "info");

  const createNew = () => {
    const name = window.prompt("请输入新知识库名称", "新建知识库");
    if (name === null) return;
    const row = createKnowledgeBase(name);
    setRows(loadKnowledgeBases());
    setSelectedId(row.id);
    setQuery("");
    setPage(1);
    toast(`已创建知识库「${row.name}」`, "success");
  };

  const toggleAbility = (key: keyof typeof abilities) => {
    setAbilities((s) => {
      const next = { ...s, [key]: !s[key] };
      toast(`${next[key] ? "已开启" : "已关闭"}`, "info");
      return next;
    });
  };

  const stat = (label: string, n: number | string, unit: string, tint: string, Icon: typeof Box) => (
    <div className="flex items-center gap-3 rounded-2xl border border-[#ece6db] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tint}`}>
        <Icon className="h-[22px] w-[22px]" />
      </span>
      <div>
        <p className="text-[12px] text-stone-400">{label}</p>
        <p className="text-[20px] font-bold leading-tight text-stone-800">
          {n} <span className="text-[12px] font-normal text-stone-400">{unit}</span>
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#fbf8f4] text-stone-800">
      <ShellSidebar active="knowledge" />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* 顶栏 */}
        <header className="flex shrink-0 items-center justify-between border-b border-[#f0eadf] bg-[#fbf8f4] px-6 py-4">
          <div>
            <h1 className="text-[18px] font-semibold text-stone-900">知识库</h1>
            <p className="mt-0.5 text-[12.5px] text-stone-400">管理和使用你的知识资源，让 AI 更好地理解和回答</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white hover:text-stone-700">
              <Bell className="h-[18px] w-[18px]" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white hover:text-stone-700">
              <LayoutGrid className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={createNew}
              className="ml-2 flex items-center gap-1.5 rounded-xl border border-[#f0c9a8] bg-white px-4 py-2 text-[13px] font-medium text-[#c05f3c] transition hover:bg-[#fdeee1]"
            >
              <Plus className="h-4 w-4" /> 新建知识库
            </button>
          </div>
        </header>

        {/* 内容 */}
        <div className="flex min-h-0 flex-1 overflow-hidden px-6 pb-6 pt-5">
          {/* 主区域 */}
          <div className="min-w-0 flex-1 overflow-y-auto pr-4">
            {/* 统计 */}
            <div className="grid grid-cols-4 gap-3">
              {stat("知识库总数", summary.total, "个", "bg-violet-50 text-violet-600", Box)}
              {stat("文档总数", summary.docs.toLocaleString("zh-CN"), "个", "bg-sky-50 text-sky-600", FileText)}
              {stat("向量条目数", `${Math.round(summary.vectors)}K`, "条", "bg-orange-50 text-orange-600", Layers)}
              {stat("总大小", summary.sizeGb.toFixed(1), "GB", "bg-emerald-50 text-emerald-600", Gauge)}
            </div>

            {/* 列表区 */}
            <div className="mt-5 rounded-2xl border border-[#ece6db] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              {/* 标签栏 */}
              <div className="flex flex-wrap items-center gap-1 border-b border-[#f0eadf] px-4 pt-3">
                {TABS.map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => (i === 0 ? null : demo(tab))}
                    className={
                      i === 0
                        ? "relative px-3 pb-3 pt-1 text-[13px] font-medium text-[#c05f3c]"
                        : "px-3 pb-3 pt-1 text-[13px] text-stone-500 transition hover:text-stone-800"
                    }
                  >
                    {tab}
                    {i === 0 && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#f07a3f]" />}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2 pb-2">
                  <div className="flex items-center gap-2 rounded-lg border border-[#ece6db] bg-white px-3 py-1.5 text-stone-400">
                    <Search className="h-4 w-4" />
                    <input
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(1);
                      }}
                      placeholder="搜索知识库"
                      className="w-36 bg-transparent text-[12.5px] text-stone-700 outline-none placeholder:text-stone-400"
                    />
                  </div>
                  <button
                    onClick={() => demo("筛选")}
                    className="flex items-center gap-1 rounded-lg border border-[#ece6db] bg-white px-3 py-1.5 text-[12.5px] text-stone-500 transition hover:text-stone-700"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" /> 筛选
                  </button>
                </div>
              </div>

              {/* 表头 */}
              <div className="flex items-center px-5 py-2.5 text-[12px] text-stone-400">
                <span className="w-[24%]">名称</span>
                <span className="w-[42%]">描述</span>
                <span className="w-[13%]">文档数量</span>
                <span className="w-[13%]">大小</span>
                <span className="w-[15%]">更新时间</span>
                <span className="flex-1 text-right">操作</span>
              </div>

              {/* 行 */}
              {pageRows.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`flex cursor-pointer items-center border-t border-[#f5f0e8] px-5 py-3.5 transition hover:bg-[#fdfaf5] ${
                    selected?.id === r.id ? "bg-[#fdf6ee]" : ""
                  }`}
                >
                  <div className="flex w-[24%] items-center gap-3 pr-2">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${r.tint}`}>
                      <Folder className="h-5 w-5" />
                    </span>
                    <span className="truncate text-[13.5px] font-medium text-stone-700">{r.name}</span>
                  </div>
                  <span className="w-[42%] truncate pr-2 text-xs text-stone-400">{r.desc}</span>
                  <span className="w-[13%] text-[13px] text-stone-700">{r.count}</span>
                  <span className="w-[13%] text-[13px] text-stone-500">{r.size}</span>
                  <span className="w-[15%] text-[13px] text-stone-500">{r.time}</span>
                  <div className="flex flex-1 items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        demo("更多操作");
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* 分页 */}
              <div className="flex items-center justify-between border-t border-[#f0eadf] px-5 py-3.5 text-[12.5px] text-stone-500">
                <span>共 {filtered.length} 条</span>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-1 rounded-lg border border-[#ece6db] bg-white px-2.5 py-1.5 transition hover:text-stone-700">
                    {PAGE_SIZE} 条 / 页 <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={current <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ece6db] bg-white text-stone-400 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
                          p === current
                            ? "border-[#f0c9a8] bg-[#fdf1e3] text-[#c05f3c]"
                            : "border-[#ece6db] bg-white text-stone-500 transition hover:text-stone-700"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      disabled={current >= pageCount}
                      onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ece6db] bg-white text-stone-400 disabled:opacity-40"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span>前往</span>
                  <input
                    value={current}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (n >= 1 && n <= pageCount) setPage(n);
                    }}
                    className="h-7 w-9 rounded-lg border border-[#ece6db] bg-white text-center text-[12px] outline-none"
                  />
                  <span>页</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧详情面板 */}
          <aside className="hidden w-[340px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#ece6db] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] xl:flex">
            {selected ? (
              <>
                <div className="px-5 pt-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                      <Folder className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="flex items-center gap-1.5 text-[16px] font-semibold text-stone-800">
                        {selected.name} <Shield className="h-3.5 w-3.5 text-stone-400" />
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 已启用
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-[12px] text-stone-400">
                    <p><span className="text-stone-500">类别</span> · {selected.tags[0] ?? "产品"}</p>
                    <p><span className="text-stone-500">创建人</span> · Alex Chen</p>
                    <p><span className="text-stone-500">创建时间</span> · {selected.updatedAt}</p>
                  </div>
                  <p className="mt-3 text-[12.5px] leading-6 text-stone-500">
                    描述：{selected.desc}
                  </p>
                </div>

                {/* 统计 */}
                <div className="mx-5 mt-4 grid grid-cols-3 divide-x divide-[#f0eadf] rounded-xl border border-[#f0eadf] py-3 text-center">
                  <div>
                    <p className="text-[18px] font-bold text-stone-800">{selected.count}</p>
                    <p className="mt-0.5 text-[11px] text-stone-400">文档数量</p>
                  </div>
                  <div>
                    <p className="text-[18px] font-bold text-stone-800">{formatSize(selected.sizeGb)}</p>
                    <p className="mt-0.5 text-[11px] text-stone-400">知识库大小</p>
                  </div>
                  <div>
                    <p className="text-[18px] font-bold text-stone-800">{Math.max(128, selected.count)}K</p>
                    <p className="mt-0.5 text-[11px] text-stone-400">向量条目数</p>
                  </div>
                </div>

                {/* 标签 */}
                <div className="mt-5 px-5">
                  <p className="text-[13.5px] font-semibold text-stone-800">标签</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selected.tags.length ? selected.tags.map((t) => (
                      <span key={t} className="rounded-full border border-[#ece6db] bg-[#fbf8f4] px-2.5 py-1 text-[11px] text-stone-500">
                        {t}
                      </span>
                    )) : (
                      <span className="text-[11px] text-stone-400">暂无标签</span>
                    )}
                  </div>
                </div>

                {/* 能力设置 */}
                <div className="mt-5 px-5">
                  <p className="text-[13.5px] font-semibold text-stone-800">能力设置</p>
                  <div className="mt-2 space-y-1">
                    {ABILITIES.map((s, idx) => {
                      const key = (["semantic", "qa", "cite"] as const)[idx];
                      return (
                        <div key={s.label} className="flex items-center gap-3 py-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fbf3ec] text-[#c05f3c]">
                            <s.icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-stone-700">{s.label}</p>
                            <p className="text-[11px] text-stone-400">{s.desc}</p>
                          </div>
                          <button
                            onClick={() => toggleAbility(key)}
                            className={`relative h-5 w-9 rounded-full transition ${abilities[key] ? "bg-[#ff6a3d]" : "bg-stone-200"}`}
                          >
                            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${abilities[key] ? "right-0.5" : "left-0.5"}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 最近更新 */}
                <div className="mt-5 px-5">
                  <p className="text-[13.5px] font-semibold text-stone-800">最近更新的文档</p>
                  <div className="mt-2 space-y-0.5">
                    {RECENT_DOCS.map((d) => (
                      <button
                        key={d.name}
                        onClick={() => demo("打开文档")}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-left transition hover:bg-[#fdfaf5]"
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${d.tint}`}>
                          <FileText className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-stone-700">{d.name}</span>
                        <span className="shrink-0 text-[11px] text-stone-400">{d.time}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => demo("查看全部文档")}
                      className="flex items-center gap-1 px-2 py-1 text-[12px] text-[#c05f3c] transition hover:opacity-80"
                    >
                      查看全部文档 <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-auto flex items-center gap-2 border-t border-[#f0eadf] p-4">
                  <button
                    onClick={() => demo("分享知识库")}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#ece6db] bg-white py-2.5 text-[13px] font-medium text-stone-600 transition hover:border-[#e0b79c]"
                  >
                    <Share2 className="h-4 w-4" /> 分享知识库
                  </button>
                  <button
                    onClick={() => demo("管理知识库")}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 py-2.5 text-[13px] font-medium text-white shadow-sm transition hover:brightness-105"
                  >
                    <Users className="h-4 w-4" /> 管理知识库
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-stone-400">选择一个知识库查看详情</div>
            )}
          </aside>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
