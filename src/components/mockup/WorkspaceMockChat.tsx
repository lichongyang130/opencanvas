"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ArrowUp,
  Bell,
  Bot,
  BrainCircuit,
  ChevronDown,
  Copy,
  Database,
  FileText,
  Globe,
  Home,
  LayoutGrid,
  LayoutTemplate,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Share2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Wrench,
} from "lucide-react";

/* ────────────────────────────────────────────────
 *  1:1 还原 design/ai-chat-concepts/2.png
 *  「AI 对话工作台」— 宽左侧导航 + 中央对话流
 * ──────────────────────────────────────────────── */

const NAV_ITEMS = [
  { icon: Home, label: "首页", active: false },
  { icon: MessageSquare, label: "AI 对话", active: true },
  { icon: Bot, label: "智能体", active: false },
  { icon: Database, label: "知识库", active: false },
  { icon: FileText, label: "文档中心", active: false },
  { icon: LayoutTemplate, label: "模板中心", active: false },
  { icon: Wrench, label: "工具箱", active: false },
  { icon: LayoutGrid, label: "更多应用", active: false },
];

const RECENT_COMMON = [
  "产品策略会议纪要",
  "用户需求分析报告",
  "品牌营销方案",
  "培训课程大纲",
  "如何提高团队效率",
];

function AILogo() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-blue-500 text-white">
      <Sparkles className="h-3 w-3" />
    </span>
  );
}

function AICard({
  time,
  children,
  footer,
}: {
  time: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <AILogo />
      <div className="min-w-0 max-w-[840px] flex-1">
        <div className="rounded-xl rounded-tl-sm border border-[#e9e4d9] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="mb-2 text-xs text-stone-400">AI 助手 {time}</p>
          <div className="text-[14px] leading-7 text-stone-800">{children}</div>
          {footer && <div className="mt-3">{footer}</div>}
        </div>
        <div className="mt-1.5 flex items-center gap-3 px-1 text-stone-300">
          <button className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-stone-100 hover:text-stone-500">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-stone-100 hover:text-stone-500">
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-stone-100 hover:text-stone-500">
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-stone-100 hover:text-stone-500">
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function UserBubble({ time, text }: { time: string; text: string }) {
  return (
    <div className="flex items-start justify-end gap-3">
      <div className="max-w-[640px]">
        <p className="mb-1 text-right text-[11px] text-stone-400">{time}</p>
        <div className="rounded-xl rounded-tr-sm bg-[#fdeee3] px-4 py-3 text-[14px] leading-6 text-stone-800">
          {text}
        </div>
      </div>
      <Image
        src="/avatar.png"
        alt="Alex Chen"
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 rounded-full object-cover"
      />
    </div>
  );
}

const QUICK_SUGGESTIONS = [
  "帮我写一篇关于时间管理的文章",
  "分析一下这个文件的内容",
  "生成一个营销活动的创意方案",
  "解释这个概念：区块链技术",
];

function Sidebar() {
  return (
    <aside className="flex w-[236px] shrink-0 flex-col border-r border-[#efe9dd] bg-white">
      {/* 顶部 Logo */}
      <div className="flex items-center gap-3 px-5 pb-4 pt-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500 text-lg font-bold text-white shadow-sm">
          O
        </span>
        <span className="text-lg font-semibold tracking-tight text-stone-800">AI 对话</span>
      </div>

      {/* 导航 */}
      <nav className="flex flex-col gap-0.5 px-3">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={
              item.active
                ? "flex items-center gap-2.5 rounded-xl bg-[#fdeee1] px-3.5 py-2.5 text-[14px] font-medium text-[#c05f3c]"
                : "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[14px] text-stone-600 transition hover:bg-stone-50 hover:text-stone-900"
            }
          >
            <item.icon className="h-[18px] w-[18px]" strokeWidth={item.active ? 2.1 : 1.8} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mx-5 my-4 h-px bg-stone-100" />

      {/* 最近对话 */}
      <div className="flex-1 overflow-y-auto px-5">
        <p className="mb-2 text-xs font-medium text-stone-400">最近对话</p>
        <div className="-mx-2 flex flex-col gap-0.5">
          {RECENT_COMMON.map((r) => (
            <button
              key={r}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-stone-500 transition hover:bg-stone-50 hover:text-stone-800"
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-stone-300" />
              <span className="truncate">{r}</span>
            </button>
          ))}
          <button className="mt-1 flex items-center gap-1 px-2 text-xs text-stone-400 transition hover:text-[#c05f3c]">
            查看全部历史记录 <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      {/* 用户 */}
      <div className="border-t border-stone-100 p-3">
        <button className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 transition hover:bg-stone-50">
          <Image
            src="/avatar.png"
            alt="Alex Chen"
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
          />
          <span className="flex min-w-0 flex-1 flex-col items-start">
            <span className="text-[13.5px] font-medium text-stone-800">Alex Chen</span>
            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-[#fdeee1] px-1.5 py-px text-[10px] font-medium text-[#c05f3c]">
              <Sparkles className="h-2.5 w-2.5" /> 专业版
            </span>
          </span>
          <ChevronDown className="h-4 w-4 text-stone-400" />
        </button>
      </div>
    </aside>
  );
}

export default function WorkspaceMockChat() {
  const [input, setInput] = useState("");

  return (
    <div className="flex h-screen overflow-hidden bg-[#fbf8f4] text-stone-800">
      <Sidebar />

      {/* 主区域 */}
      <main className="relative flex min-w-0 flex-1 flex-col">
        {/* 顶栏 */}
        <header className="flex shrink-0 items-center justify-between border-b border-[#f0eadf] bg-[#fbf8f4] px-6 py-4">
          <div>
            <h1 className="text-[18px] font-semibold text-stone-900">AI 对话</h1>
            <p className="mt-0.5 text-[12.5px] text-stone-400">与 AI 助手的智能对话</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white hover:text-stone-700">
              <Bell className="h-[18px] w-[18px]" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white hover:text-stone-700">
              <LayoutGrid className="h-[18px] w-[18px]" />
            </button>
            <button className="ml-2 rounded-xl px-4 py-2 text-[13.5px] font-medium text-[#c05f3c]">
              新建对话
            </button>
          </div>
        </header>

        {/* 对话流 */}
        <div className="flex-1 overflow-y-auto px-10 py-6">
          <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-7">
            <AICard time="15:30">
              <p>你好，Alex! 👋</p>
              <p>我是你的 AI 助手，有什么可以帮你的吗？你可以问我任何问题，或者让我帮你完成各种任务。</p>
            </AICard>

            <UserBubble time="15:31" text="帮我生成一份关于人工智能发展趋势的报告大纲" />

            <AICard
              time="15:31"
              footer={
                <button className="ml-auto flex items-center gap-1 rounded-lg border border-[#e9e4d9] px-2.5 py-1 text-[11px] text-stone-400 transition hover:text-[#c05f3c]">
                  继续生成 <span aria-hidden>↓</span>
                </button>
              }
            >
              <p>好的！以下是一份关于人工智能发展趋势的报告大纲，供你参考：</p>
              <h3 className="mt-2 flex items-center gap-1 text-[15px] font-semibold text-stone-800">
                <FileText className="h-4 w-4 text-stone-500" />
                人工智能发展趋势报告大纲
              </h3>
              <p className="mt-2 font-medium text-stone-800">1. 摘要</p>
              <ul className="ml-4 list-disc text-stone-600">
                <li>人工智能发展现状概述</li>
                <li>关键趋势总结</li>
                <li>未来展望</li>
              </ul>
              <p className="mt-2 font-medium text-stone-800">2. 引言</p>
              <ul className="ml-4 list-disc text-stone-600">
                <li>人工智能的定义与范围</li>
                <li>研究背景与意义</li>
                <li>报告目的与方法</li>
              </ul>
            </AICard>
          </div>
        </div>

        {/* 快捷建议 + 输入舱 */}
        <div className="shrink-0 px-10 pb-6">
          <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-4">
            {/* 快捷建议 */}
            <div className="flex flex-wrap items-center gap-2">
              {QUICK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="rounded-full border border-[#ece6db] bg-white px-3.5 py-1.5 text-[12.5px] text-stone-500 shadow-sm transition hover:border-[#e0b79c] hover:text-[#c05f3c]"
                >
                  {s}
                </button>
              ))}
              <button className="ml-1 flex items-center gap-1 rounded-full px-2 py-1.5 text-[12px] text-stone-400 transition hover:text-[#c05f3c]">
                换一批 <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* 输入舱 */}
            <div className="rounded-2xl border border-[#ece6db] bg-white p-4 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={2}
                placeholder="输入你的问题或需求，按 Enter 发送，Shift + Enter 换行"
                className="w-full resize-none bg-transparent text-[14px] leading-7 text-stone-800 outline-none placeholder:text-stone-400"
              />
              <div className="mt-1 flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <button className="flex items-center gap-1.5 rounded-full border border-[#ece6db] px-3.5 py-2 text-[13px] text-stone-600 transition hover:border-[#e0b79c] hover:text-[#c05f3c]">
                    <BrainCircuit className="h-4 w-4" /> 深度思考 <ChevronDown className="h-3 w-3 text-stone-400" />
                  </button>
                  <button className="flex items-center gap-1.5 rounded-full border border-[#ece6db] px-3.5 py-2 text-[13px] text-stone-600 transition hover:border-[#e0b79c] hover:text-[#c05f3c]">
                    <Globe className="h-4 w-4" /> 联网搜索
                  </button>
                  <button className="flex items-center gap-1.5 rounded-full border border-[#ece6db] px-3.5 py-2 text-[13px] text-stone-600 transition hover:border-[#e0b79c] hover:text-[#c05f3c]">
                    <FileText className="h-4 w-4" /> 上传文件
                  </button>
                  <button className="flex items-center gap-1.5 rounded-full border border-[#ece6db] px-3.5 py-2 text-[13px] text-stone-600 transition hover:border-[#e0b79c] hover:text-[#c05f3c]">
                    <Bot className="h-4 w-4" /> 选择智能体
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100">
                    <Paperclip className="h-[18px] w-[18px]" />
                  </button>
                  <button
                    onClick={() => setInput("")}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-md shadow-orange-200 transition hover:brightness-105 active:scale-95"
                  >
                    <ArrowUp className="h-5 w-5" strokeWidth={2.4} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
