"use client";

import {
  Bell,
  BookOpen,
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

const STATS = [
  { icon: Box, label: "知识库总数", value: "12", unit: "个", tint: "bg-violet-50 text-violet-600" },
  { icon: FileText, label: "文档总数", value: "1,248", unit: "个", tint: "bg-sky-50 text-sky-600" },
  { icon: Layers, label: "向量条目数", value: "856K", unit: "条", tint: "bg-orange-50 text-orange-600" },
  { icon: Gauge, label: "总大小", value: "18.6", unit: "GB", tint: "bg-emerald-50 text-emerald-600" },
];

const TABS = ["全部知识库", "我的知识库", "共享给我", "团队知识库"];

const ROWS = [
  { name: "产品文档库", desc: "包含产品需求文档、PRD、设计文档、产品说明等相关资料", count: "156", size: "2.4 GB", time: "今天 14:30", tint: "bg-sky-50 text-sky-600" },
  { name: "市场调研资料", desc: "市场分析、竞品调研、行业报告等内容", count: "89", size: "1.8 GB", time: "今天 11:20", tint: "bg-emerald-50 text-emerald-600" },
  { name: "技术知识库", desc: "技术文档、开发指南、API 文档等内容", count: "232", size: "3.7 GB", time: "昨天 16:45", tint: "bg-violet-50 text-violet-600" },
  { name: "培训资料库", desc: "培训课件、操作手册、学习资料等内容", count: "78", size: "1.2 GB", time: "昨天 10:15", tint: "bg-orange-50 text-orange-600" },
  { name: "公司制度文档", desc: "公司制度、流程规范、政策文件等内容", count: "45", size: "890 MB", time: "08-13 09:30", tint: "bg-amber-50 text-amber-600" },
  { name: "客户案例库", desc: "成功案例、解决方案、客户反馈等内容", count: "127", size: "2.1 GB", time: "08-12 15:20", tint: "bg-cyan-50 text-cyan-600" },
];

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

export default function KnowledgePage() {
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
            <button className="ml-2 flex items-center gap-1.5 rounded-xl border border-[#f0c9a8] bg-white px-4 py-2 text-[13px] font-medium text-[#c05f3c] transition hover:bg-[#fdeee1]">
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
              {STATS.map((s) => (
                <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-[#ece6db] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.tint}`}>
                    <s.icon className="h-[22px] w-[22px]" />
                  </span>
                  <div>
                    <p className="text-[12px] text-stone-400">{s.label}</p>
                    <p className="text-[20px] font-bold leading-tight text-stone-800">
                      {s.value} <span className="text-[12px] font-normal text-stone-400">{s.unit}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 列表区 */}
            <div className="mt-5 rounded-2xl border border-[#ece6db] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              {/* 标签栏 */}
              <div className="flex flex-wrap items-center gap-1 border-b border-[#f0eadf] px-4 pt-3">
                {TABS.map((tab, i) => (
                  <button
                    key={tab}
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
                    <input placeholder="搜索知识库" className="w-36 bg-transparent text-[12.5px] text-stone-700 outline-none placeholder:text-stone-400" />
                  </div>
                  <button className="flex items-center gap-1 rounded-lg border border-[#ece6db] bg-white px-3 py-1.5 text-[12.5px] text-stone-500 transition hover:text-stone-700">
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
              {ROWS.map((r) => (
                <div key={r.name} className="flex items-center border-t border-[#f5f0e8] px-5 py-3.5 transition hover:bg-[#fdfaf5]">
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
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* 分页 */}
              <div className="flex items-center justify-between border-t border-[#f0eadf] px-5 py-3.5 text-[12.5px] text-stone-500">
                <span>共 12 条</span>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-1 rounded-lg border border-[#ece6db] bg-white px-2.5 py-1.5 transition hover:text-stone-700">
                    10 条 / 页 <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex items-center gap-1">
                    <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ece6db] bg-white text-stone-400">
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#f0c9a8] bg-[#fdf1e3] text-[#c05f3c]">1</button>
                    <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ece6db] bg-white text-stone-500 transition hover:text-stone-700">2</button>
                    <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ece6db] bg-white text-stone-400">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span>前往</span>
                  <input className="h-7 w-9 rounded-lg border border-[#ece6db] bg-white text-center text-[12px] outline-none" defaultValue="1" />
                  <span>页</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧详情面板 */}
          <aside className="hidden w-[340px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#ece6db] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] xl:flex">
            <div className="px-5 pt-5">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <Folder className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="flex items-center gap-1.5 text-[16px] font-semibold text-stone-800">
                    产品文档库 <Shield className="h-3.5 w-3.5 text-stone-400" />
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 已启用
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-[12px] text-stone-400">
                <p><span className="text-stone-500">类别</span> · 产品</p>
                <p><span className="text-stone-500">创建人</span> · Alex Chen</p>
                <p><span className="text-stone-500">创建时间</span> · 2024-01-15 16:30</p>
              </div>
              <p className="mt-3 text-[12.5px] leading-6 text-stone-500">
                描述：包含产品需求文档、PRD、设计文档、产品说明等相关资料。
              </p>
            </div>

            {/* 统计 */}
            <div className="mx-5 mt-4 grid grid-cols-3 divide-x divide-[#f0eadf] rounded-xl border border-[#f0eadf] py-3 text-center">
              <div>
                <p className="text-[18px] font-bold text-stone-800">156</p>
                <p className="mt-0.5 text-[11px] text-stone-400">文档数量</p>
              </div>
              <div>
                <p className="text-[18px] font-bold text-stone-800">2.4 GB</p>
                <p className="mt-0.5 text-[11px] text-stone-400">知识库大小</p>
              </div>
              <div>
                <p className="text-[18px] font-bold text-stone-800">128K</p>
                <p className="mt-0.5 text-[11px] text-stone-400">向量条目数</p>
              </div>
            </div>

            {/* 标签 */}
            <div className="mt-5 px-5">
              <p className="text-[13.5px] font-semibold text-stone-800">标签</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TAGS.map((t) => (
                  <span key={t} className="rounded-full border border-[#ece6db] bg-[#fbf8f4] px-2.5 py-1 text-[11px] text-stone-500">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* 能力设置 */}
            <div className="mt-5 px-5">
              <p className="text-[13.5px] font-semibold text-stone-800">能力设置</p>
              <div className="mt-2 space-y-1">
                {ABILITIES.map((s) => (
                  <div key={s.label} className="flex items-center gap-3 py-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fbf3ec] text-[#c05f3c]">
                      <s.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-stone-700">{s.label}</p>
                      <p className="text-[11px] text-stone-400">{s.desc}</p>
                    </div>
                    <button className="relative h-5 w-9 rounded-full bg-[#ff6a3d]">
                      <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 最近更新 */}
            <div className="mt-5 px-5">
              <p className="text-[13.5px] font-semibold text-stone-800">最近更新的文档</p>
              <div className="mt-2 space-y-0.5">
                {RECENT_DOCS.map((d) => (
                  <button key={d.name} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-left transition hover:bg-[#fdfaf5]">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${d.tint}`}>
                      <FileText className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-stone-700">{d.name}</span>
                    <span className="shrink-0 text-[11px] text-stone-400">{d.time}</span>
                  </button>
                ))}
                <button className="flex items-center gap-1 px-2 py-1 text-[12px] text-[#c05f3c] transition hover:opacity-80">
                  查看全部文档 <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-auto flex items-center gap-2 border-t border-[#f0eadf] p-4">
              <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#ece6db] bg-white py-2.5 text-[13px] font-medium text-stone-600 transition hover:border-[#e0b79c]">
                <Share2 className="h-4 w-4" /> 分享知识库
              </button>
              <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 py-2.5 text-[13px] font-medium text-white shadow-sm transition hover:brightness-105">
                <Users className="h-4 w-4" /> 管理知识库
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
