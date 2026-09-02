"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  Box,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  File,
  FileText,
  FolderPlus,
  Grid3X3,
  Layers,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  Search,
  Share2,
  SlidersHorizontal,
  Star,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { ShellSidebar } from "@/components/mockup/ShellSidebar";
import { toast } from "@/lib/store/toast";
import { Toaster } from "@/components/Toaster";

type DocType = "word" | "pdf" | "excel" | "ppt";

interface DocRow {
  id: string;
  name: string;
  desc: string;
  owner: string;
  tags: string[];
  time: string;
  size: string;
  type: DocType;
  favorite?: boolean;
}

const DOC_STYLE: Record<DocType, { bg: string; text: string; letter: string }> = {
  word: { bg: "bg-sky-50 text-sky-600", text: "text-sky-600", letter: "W" },
  pdf: { bg: "bg-red-50 text-red-500", text: "text-red-500", letter: "PDF" },
  excel: { bg: "bg-emerald-50 text-emerald-600", text: "text-emerald-600", letter: "X" },
  ppt: { bg: "bg-orange-50 text-orange-500", text: "text-orange-500", letter: "P" },
};

const TABS = ["全部文档", "我创建的", "与我共享", "收藏夹", "回收站"];

const DOCS: DocRow[] = [
  { id: "d1", name: "产品需求分析报告.docx", desc: "详细的产品需求分析和竞品竞品文档", owner: "Alex Chen", tags: ["产品"], time: "今天 14:30", size: "2.4 MB", type: "word", favorite: true },
  { id: "d2", name: "竞品调研报告.pdf", desc: "市场竞品分析和对比研究报告", owner: "张晓明", tags: ["市场", "竞品"], time: "今天 11:20", size: "1.8 MB", type: "pdf" },
  { id: "d3", name: "用户需求统计.xlsx", desc: "用户需求收集和统计分析表格", owner: "李若雪", tags: ["用户研究"], time: "昨天 16:45", size: "856 KB", type: "excel" },
  { id: "d4", name: "产品演示文档.pptx", desc: "产品功能演示和方案介绍", owner: "王浩", tags: ["演示"], time: "昨天 10:15", size: "5.2 MB", type: "ppt" },
  { id: "d5", name: "PRD产品需求文档.docx", desc: "产品需求文档 PRD v2.0 版本", owner: "Alex Chen", tags: ["产品", "PRD"], time: "08-13 09:30", size: "3.1 MB", type: "word", favorite: true },
  { id: "d6", name: "设计规范文档.pdf", desc: "产品设计规范和组件使用说明", owner: "陈思思", tags: ["设计"], time: "08-12 15:20", size: "4.7 MB", type: "pdf" },
  { id: "d7", name: "项目进度跟踪表.xlsx", desc: "项目进度计划和实际完成情况跟踪", owner: "张晓明", tags: ["项目管理"], time: "08-11 14:10", size: "1.2 MB", type: "excel" },
  { id: "d8", name: "会议纪要_产品评审会.docx", desc: "产品评审会议纪要和决议事项", owner: "李若雪", tags: ["会议记录", "评审"], time: "08-10 11:30", size: "766 KB", type: "word", favorite: true },
  { id: "d9", name: "营销活动策划案.pptx", desc: "季度营销活动策划与执行计划", owner: "王浩", tags: ["营销"], time: "08-09 16:40", size: "6.8 MB", type: "ppt" },
  { id: "d10", name: "用户反馈汇总.csv", desc: "各渠道用户反馈数据汇总", owner: "李若雪", tags: ["用户研究"], time: "08-08 14:05", size: "420 KB", type: "excel" },
];

const RECENT_DOCS = [
  { name: "产品需求分析报告.docx", time: "今天查看", type: "word" as DocType },
  { name: "竞品调研报告.pdf", time: "今天查看", type: "pdf" as DocType },
  { name: "用户需求统计.xlsx", time: "昨天查看", type: "excel" as DocType },
  { name: "产品演示文档.pptx", time: "昨天查看", type: "ppt" as DocType },
  { name: "PRD产品需求文档.docx", time: "2天前查看", type: "word" as DocType },
];

function DocIcon({ type }: { type: DocType }) {
  const s = DOC_STYLE[type];
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.bg} ${s.text}`}>
      {type === "word" || type === "excel" ? (
        <FileText className="h-5 w-5" />
      ) : type === "ppt" ? (
        <File className="h-5 w-5" />
      ) : (
        <File className="h-5 w-5" />
      )}
    </span>
  );
}

const PAGE_SIZE = 10;

export default function DocsPage() {
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const demo = (label: string) => toast(`演示预览：${label} 功能即将接入`, "info");

  const rows = useMemo(() => {
    let list = DOCS;
    if (tab === 1) list = list.filter((d) => d.owner === "Alex Chen");
    if (tab === 2) list = list.filter((d) => d.owner !== "Alex Chen");
    if (tab === 3) list = list.filter((d) => d.favorite);
    if (tab === 4) return [];
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((d) => d.name.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q) || d.tags.some((t) => t.includes(q)));
    return list;
  }, [tab, query]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageRows = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const toggleFav = (id: string) => setFavorites((s) => ({ ...s, [id]: !s[id] }));

  const stats = [
    { icon: FileText, label: "文档总数", value: "186", unit: "个", tint: "bg-blue-50 text-blue-600" },
    { icon: File, label: "我的文档", value: "128", unit: "个", tint: "bg-sky-50 text-sky-600" },
    { icon: Users, label: "团队文档", value: "58", unit: "个", tint: "bg-orange-50 text-orange-600" },
    { icon: Box, label: "存储空间", value: "2.4", unit: "GB / 10 GB", tint: "bg-violet-50 text-violet-600", bar: true },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#fbf8f4] text-stone-800">
      <ShellSidebar active="docs" />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* 顶栏 */}
        <header className="flex shrink-0 items-center justify-between border-b border-[#f0eadf] bg-[#fbf8f4] px-6 py-4">
          <div>
            <h1 className="text-[18px] font-semibold text-stone-900">文档中心</h1>
            <p className="mt-0.5 text-[12.5px] text-stone-400">集中管理你的所有文档，支持预览、分享和协作</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white hover:text-stone-700">
              <Bell className="h-[18px] w-[18px]" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white hover:text-stone-700">
              <LayoutGrid className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={() => demo("上传文档")}
              className="ml-2 flex items-center gap-1.5 rounded-xl border border-[#f0c9a8] bg-white px-4 py-2 text-[13px] font-medium text-[#c05f3c] transition hover:bg-[#fdeee1]"
            >
              <Plus className="h-4 w-4" /> 上传文档
            </button>
          </div>
        </header>

        {/* 内容 */}
        <div className="flex min-h-0 flex-1 overflow-hidden px-6 pb-6 pt-5">
          {/* 主区域 */}
          <div className="min-w-0 flex-1 overflow-y-auto pr-4">
            {/* 统计 */}
            <div className="grid grid-cols-4 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-[#ece6db] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.tint}`}>
                    <s.icon className="h-[22px] w-[22px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-stone-400">{s.label}</p>
                    <p className="text-[20px] font-bold leading-tight text-stone-800">
                      {s.value} <span className="text-[12px] font-normal text-stone-400">{s.unit}</span>
                    </p>
                    {s.bar && (
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                        <div className="h-full w-[24%] rounded-full bg-orange-400" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 列表区 */}
            <div className="mt-5 rounded-2xl border border-[#ece6db] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              {/* 标签栏 */}
              <div className="flex flex-wrap items-center gap-1 border-b border-[#f0eadf] px-4 pt-3">
                {TABS.map((t, i) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTab(i);
                      setPage(1);
                    }}
                    className={
                      i === tab
                        ? "relative px-3 pb-3 pt-1 text-[13px] font-medium text-[#c05f3c]"
                        : "px-3 pb-3 pt-1 text-[13px] text-stone-500 transition hover:text-stone-800"
                    }
                  >
                    {t}
                    {i === tab && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#f07a3f]" />}
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
                      placeholder="搜索文档名称、内容或标签"
                      className="w-44 bg-transparent text-[12.5px] text-stone-700 outline-none placeholder:text-stone-400"
                    />
                  </div>
                  <button
                    onClick={() => demo("筛选")}
                    className="flex items-center gap-1 rounded-lg border border-[#ece6db] bg-white px-3 py-1.5 text-[12.5px] text-stone-500 transition hover:text-stone-700"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" /> 筛选
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ece6db] bg-white text-stone-400 transition hover:text-stone-700">
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* 表头 */}
              <div className="flex items-center px-5 py-2.5 text-[12px] text-stone-400">
                <span className="w-[42%]">文档名称</span>
                <span className="w-[16%]">所有者</span>
                <span className="w-[18%]">标签</span>
                <span className="w-[12%]">更新时间</span>
                <span className="w-[10%]">大小</span>
                <span className="flex-1 text-right">操作</span>
              </div>

              {/* 行 */}
              {pageRows.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-14 text-stone-400">
                  <Trash2 className="h-8 w-8 text-stone-300" />
                  <p className="text-sm">回收站是空的</p>
                </div>
              ) : (
                pageRows.map((r) => {
                  const s = DOC_STYLE[r.type];
                  const fav = favorites[r.id] ?? r.favorite;
                  return (
                    <div key={r.id} className="flex items-center border-t border-[#f5f0e8] px-5 py-3.5 transition hover:bg-[#fdfaf5]">
                      <div className="flex w-[42%] items-center gap-3 pr-2">
                        <DocIcon type={r.type} />
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-medium text-stone-700">{r.name}</p>
                          <p className="mt-0.5 truncate text-xs text-stone-400">{r.desc}</p>
                        </div>
                      </div>
                      <div className="flex w-[16%] items-center gap-2 pr-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-rose-200 text-[10px] font-semibold text-stone-600">
                          {r.owner === "Alex Chen" ? "A" : r.owner.slice(0, 1)}
                        </span>
                        <span className="truncate text-[12.5px] text-stone-600">{r.owner}</span>
                      </div>
                      <div className="flex w-[18%] flex-wrap gap-1 pr-2">
                        {r.tags.map((t) => (
                          <span key={t} className="rounded-md bg-[#fbf3ec] px-1.5 py-0.5 text-[10px] font-medium text-[#c05f3c]">
                            {t}
                          </span>
                        ))}
                      </div>
                      <span className="w-[12%] text-[12.5px] text-stone-500">{r.time}</span>
                      <span className="w-[10%] text-[12.5px] text-stone-500">{r.size}</span>
                      <div className="flex flex-1 items-center justify-end gap-1">
                        <button
                          onClick={() => toggleFav(r.id)}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-stone-100 ${fav ? "text-amber-400" : "text-stone-400 hover:text-stone-600"}`}
                        >
                          <Star className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
                        </button>
                        <button
                          onClick={() => demo("分享文档")}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => demo("更多操作")}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* 分页 */}
              <div className="flex items-center justify-between border-t border-[#f0eadf] px-5 py-3.5 text-[12.5px] text-stone-500">
                <span>共 {186} 个文档</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <button
                      disabled={current <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ece6db] bg-white text-stone-400 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    {Array.from({ length: Math.min(pageCount, 4) }, (_, i) => i + 1).map((p) => (
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
                    {pageCount > 4 && <span className="px-1 text-stone-300">…</span>}
                    {pageCount > 4 && (
                      <button
                        onClick={() => setPage(pageCount)}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg border border-[#ece6db] bg-white text-stone-500 transition hover:text-stone-700 ${
                          current === pageCount ? "border-[#f0c9a8] bg-[#fdf1e3] text-[#c05f3c]" : ""
                        }`}
                      >
                        {pageCount}
                      </button>
                    )}
                    <button
                      disabled={current >= pageCount}
                      onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ece6db] bg-white text-stone-400 disabled:opacity-40"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button className="flex items-center gap-1 rounded-lg border border-[#ece6db] bg-white px-2.5 py-1.5 transition hover:text-stone-700">
                    {PAGE_SIZE} 条/页 <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧面板 */}
          <aside className="hidden w-[320px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#ece6db] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] xl:flex">
            {/* 存储空间 */}
            <div className="border-b border-[#f0eadf] p-5">
              <p className="text-[14px] font-semibold text-stone-800">存储空间</p>
              <div className="mt-4 flex items-center gap-5">
                <div className="relative h-28 w-28 shrink-0">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#f0eadf" strokeWidth="12" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#f07a3f" strokeWidth="12" strokeDasharray="326.7" strokeDashoffset="248" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-[20px] font-bold text-stone-800">2.4 GB</p>
                    <p className="text-[11px] text-stone-400">/ 10 GB</p>
                  </div>
                </div>
                <div className="flex-1 space-y-2 text-[12px] text-stone-500">
                  <p className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-orange-400" />文档文件</span>
                    <span>1.8 GB</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-300" />图片文件</span>
                    <span>450 MB</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-stone-300" />其他文件</span>
                    <span>190 MB</span>
                  </p>
                  <button
                    onClick={() => demo("管理存储空间")}
                    className="w-full rounded-lg border border-[#ece6db] bg-white py-2 text-[12.5px] font-medium text-stone-600 transition hover:border-[#e0b79c] hover:text-[#c05f3c]"
                  >
                    管理存储空间
                  </button>
                </div>
              </div>
            </div>

            {/* 快速操作 */}
            <div className="border-b border-[#f0eadf] p-5">
              <p className="text-[14px] font-semibold text-stone-800">快速操作</p>
              <div className="mt-3 space-y-1">
                <button onClick={() => demo("上传文档")} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-[#fdfaf5]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Upload className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-stone-700">上传文档</span>
                    <span className="block text-[11px] text-stone-400">支持拖拽或选择文件上传</span>
                  </span>
                </button>
                <button onClick={() => demo("新建文件夹")} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-[#fdfaf5]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><FolderPlus className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-stone-700">新建文件夹</span>
                    <span className="block text-[11px] text-stone-400">创建文件夹来组织文档</span>
                  </span>
                </button>
                <button onClick={() => demo("批量操作")} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-[#fdfaf5]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600"><Layers className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-stone-700">批量操作</span>
                    <span className="block text-[11px] text-stone-400">批量移动、删除或分享文档</span>
                  </span>
                </button>
              </div>
            </div>

            {/* 最近文档 */}
            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-[14px] font-semibold text-stone-800">最近文档</p>
              <div className="mt-3 space-y-1">
                {RECENT_DOCS.map((d) => (
                  <button key={d.name} onClick={() => demo("打开文档")} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-[#fdfaf5]">
                    <DocIcon type={d.type} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium text-stone-700">{d.name}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] text-stone-400"><Clock className="h-3 w-3" />{d.time}</span>
                    </span>
                  </button>
                ))}
                <button onClick={() => demo("查看全部")} className="flex items-center gap-1 px-2 py-1 text-[12px] text-[#c05f3c] transition hover:opacity-80">
                  查看全部 <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
