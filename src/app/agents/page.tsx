"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/lib/store/chat";
import { PERSONAS } from "@/lib/personas";
import {
  Bell,
  BookOpen,
  Box,
  ChevronRight,
  FileText,
  Folder,
  LayoutGrid,
  MessageCircle,
  MoreHorizontal,
  PencilRuler,
  Play,
  Plus,
  Search,
  Share2,
  SlidersHorizontal,
  Target,
  X,
} from "lucide-react";
import { ShellSidebar } from "@/components/mockup/ShellSidebar";
import { toast } from "@/lib/store/toast";
import { Toaster } from "@/components/Toaster";

type AgentCat = "工作" | "创作" | "开发" | "效率";

const CAT_STYLE: Record<AgentCat, { text: string; bg: string; dot: string }> = {
  工作: { text: "text-orange-600", bg: "bg-orange-50", dot: "bg-orange-500" },
  创作: { text: "text-sky-600", bg: "bg-sky-50", dot: "bg-sky-500" },
  开发: { text: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  效率: { text: "text-violet-600", bg: "bg-violet-50", dot: "bg-violet-500" },
};

const AGENT_CARDS = [
  { name: "产品经理助手", cat: "工作" as AgentCat, desc: "帮助产品经理进行需求分析、竞品调研、PRD撰写等工作", avatar: "/mock-avatars/pm.png", persona: "pm" },
  { name: "数据分析师", cat: "工作" as AgentCat, desc: "数据清洗、分析、可视化及业务洞察", avatar: "/mock-avatars/analyst.png", persona: "data-analyst" },
  { name: "内容创作助手", cat: "创作" as AgentCat, desc: "文案写作、文案创作、内容优化", avatar: "/mock-avatars/content.png", persona: "copywriter" },
  { name: "编程助手", cat: "开发" as AgentCat, desc: "代码编写、调试、技术问答", avatar: "/mock-avatars/coder.png", persona: "code-reviewer" },
  { name: "会议纪要助手", cat: "效率" as AgentCat, desc: "语音转写、会议纪要、待办整理", avatar: "/mock-avatars/meeting.png", persona: "hr" },
];

const AGENT_ROWS = [
  { name: "产品经理助手", desc: "帮助产品经理进行需求分析、竞品调研、PRD撰写等工作", cat: "工作" as AgentCat, count: "128 次", time: "今天 14:30", avatar: "/mock-avatars/pm.png", persona: "pm" },
  { name: "数据分析师", desc: "数据清洗、分析、可视化及业务洞察", cat: "工作" as AgentCat, count: "96 次", time: "今天 11:20", avatar: "/mock-avatars/analyst.png", persona: "data-analyst" },
  { name: "内容创作助手", desc: "文案写作、文案创作、内容优化", cat: "创作" as AgentCat, count: "75 次", time: "昨天 16:45", avatar: "/mock-avatars/content.png", persona: "copywriter" },
  { name: "编程助手", desc: "代码编写、调试、技术问答", cat: "开发" as AgentCat, count: "62 次", time: "昨天 10:15", avatar: "/mock-avatars/coder.png", persona: "code-reviewer" },
  { name: "会议纪要助手", desc: "语音转写、会议纪要、待办整理", cat: "效率" as AgentCat, count: "48 次", time: "08-13 09:30", avatar: "/mock-avatars/meeting.png", persona: "hr" },
];

const CATEGORY_TABS = ["全部智能体", "工作", "创作", "开发", "效率", "自定义"];

const SKILLS = [
  { icon: Target, label: "需求分析", desc: "分析用户需求和业务需求" },
  { icon: Box, label: "竞品调研", desc: "进行竞品分析和市场调研" },
  { icon: FileText, label: "PRD撰写", desc: "撰写产品需求文档" },
  { icon: PencilRuler, label: "原型设计建议", desc: "提供产品原型设计建议" },
];

export default function AgentsPage() {
  const router = useRouter();
  const { newConversation, selectConversation, setPersona } = useChatStore();
  const demo = (label: string) => toast(`演示预览：${label} 功能即将接入`, "info");

  /** 开始对话：创建一个绑定该智能体角色的会话，并跳转到 /chat */
  const startChat = async (personaId: string) => {
    const persona = PERSONAS.find((p) => p.id === personaId);
    const id = await newConversation("chat");
    await selectConversation(id);
    setPersona(personaId);
    toast(`已创建「${persona?.name ?? "助手"}」智能体对话`, "success");
    router.push("/chat");
  };
  return (
    <div className="flex h-screen overflow-hidden bg-[#fbf8f4] text-stone-800">
      <ShellSidebar active="agents" />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* 顶栏 */}
        <header className="flex shrink-0 items-center justify-between border-b border-[#f0eadf] bg-[#fbf8f4] px-6 py-4">
          <div>
            <h1 className="text-[18px] font-semibold text-stone-900">智能体</h1>
            <p className="mt-0.5 text-[12.5px] text-stone-400">创建、管理和使用你的 AI 智能体团队</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white hover:text-stone-700">
              <Bell className="h-[18px] w-[18px]" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white hover:text-stone-700">
              <LayoutGrid className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={() => demo("创建智能体")}
              className="ml-2 flex items-center gap-1.5 rounded-xl border border-[#f0c9a8] bg-white px-4 py-2 text-[13px] font-medium text-[#c05f3c] transition hover:bg-[#fdeee1]"
            >
              <Plus className="h-4 w-4" /> 创建智能体
            </button>
          </div>
        </header>

        {/* 内容 */}
        <div className="flex min-h-0 flex-1 overflow-hidden px-6 pb-6 pt-5">
          {/* 主区域 */}
          <div className="min-w-0 flex-1 overflow-y-auto pr-4">
            {/* 我的智能体 */}
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-stone-800">我的智能体</h2>
              <button
                onClick={() => demo("查看全部")}
                className="flex items-center gap-1 text-[12.5px] text-stone-400 transition hover:text-[#c05f3c]"
              >
                查看全部 <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-3">
              {AGENT_CARDS.map((a) => {
                const s = CAT_STYLE[a.cat];
                return (
                  <button
                    key={a.name}
                    onClick={() => void startChat(a.persona)}
                    className="relative rounded-2xl border border-[#ece6db] bg-white p-4 text-left shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:shadow-md"
                  >
                    <span className={`absolute right-3 top-3 h-2 w-2 rounded-full ${s.dot}`} />
                    <div className="mx-auto h-16 w-16 overflow-hidden rounded-full border border-stone-100">
                      <Image src={a.avatar} alt={a.name} width={64} height={64} className="h-full w-full object-cover" />
                    </div>
                    <p className="mt-3 text-center text-[14px] font-semibold text-stone-800">{a.name}</p>
                    <div className="mt-1 flex justify-center">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${s.bg} ${s.text}`}>{a.cat}</span>
                    </div>
                    <p className="mt-2 text-center text-xs leading-5 text-stone-400">{a.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* 列表区 */}
            <div className="mt-6 rounded-2xl border border-[#ece6db] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              {/* 标签栏 */}
              <div className="flex flex-wrap items-center gap-1 border-b border-[#f0eadf] px-4 pt-3">
                {CATEGORY_TABS.map((tab, i) => (
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
                    <input placeholder="搜索智能体" className="w-36 bg-transparent text-[12.5px] text-stone-700 outline-none placeholder:text-stone-400" />
                  </div>
                  <button className="flex items-center gap-1 rounded-lg border border-[#ece6db] bg-white px-3 py-1.5 text-[12.5px] text-stone-500 transition hover:text-stone-700">
                    <SlidersHorizontal className="h-3.5 w-3.5" /> 筛选
                  </button>
                </div>
              </div>

              {/* 表头 */}
              <div className="flex items-center px-5 py-2.5 text-[12px] text-stone-400">
                <span className="w-[42%]">名称</span>
                <span className="w-[20%]">使用次数</span>
                <span className="w-[24%]">更新时间</span>
                <span className="flex-1 text-right">操作</span>
              </div>

              {/* 行 */}
              {AGENT_ROWS.map((r) => {
                const s = CAT_STYLE[r.cat];
                return (
                  <div key={r.name} className="flex items-center border-t border-[#f5f0e8] px-5 py-3.5 transition hover:bg-[#fdfaf5]">
                    <div className="flex w-[42%] items-center gap-3 pr-2">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-stone-100">
                        <Image src={r.avatar} alt={r.name} width={44} height={44} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-semibold text-stone-800">{r.name}</p>
                        <p className="mt-0.5 truncate text-xs text-stone-400">{r.desc}</p>
                        <span className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium ${s.bg} ${s.text}`}>{r.cat}</span>
                      </div>
                    </div>
                    <span className="w-[20%] text-[13px] text-stone-600">{r.count}</span>
                    <span className="w-[24%] text-[13px] text-stone-500">{r.time}</span>
                    <div className="flex flex-1 items-center justify-end gap-1">
                      <button
                        onClick={() => void startChat(r.persona)}
                        title={`与 ${r.name} 开始对话`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
                      >
                        <Play className="h-4 w-4" />
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
              })}
            </div>
          </div>

          {/* 右侧详情面板 */}
          <aside className="hidden w-[340px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#ece6db] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] xl:flex">
            <div className="flex items-center justify-between px-4 pt-3">
              <span />
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-start gap-3 px-5">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-stone-100">
                <Image src="/mock-avatars/pm.png" alt="产品经理助手" width={64} height={64} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 pt-1">
                <p className="flex items-center gap-1.5 text-[16px] font-semibold text-stone-800">
                  产品经理助手 <PencilRuler className="h-3.5 w-3.5 text-stone-400" />
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 在线
                </p>
                <p className="mt-1 text-[12px] text-stone-400">
                  工作 · v1.0
                </p>
              </div>
            </div>

            <p className="mt-3 px-5 text-[12.5px] leading-6 text-stone-500">
              帮助产品经理进行需求分析、竞品调研、PRD撰写等工作
            </p>

            {/* 统计 */}
            <div className="mx-5 mt-4 grid grid-cols-3 divide-x divide-[#f0eadf] rounded-xl border border-[#f0eadf] py-3 text-center">
              <div>
                <p className="text-[18px] font-bold text-stone-800">128</p>
                <p className="mt-0.5 text-[11px] text-stone-400">使用次数</p>
              </div>
              <div>
                <p className="text-[18px] font-bold text-stone-800">98%</p>
                <p className="mt-0.5 text-[11px] text-stone-400">满意度</p>
              </div>
              <div>
                <p className="text-[18px] font-bold text-stone-800">23</p>
                <p className="mt-0.5 text-[11px] text-stone-400">任务完成</p>
              </div>
            </div>

            {/* 能力设置 */}
            <div className="mt-5 px-5">
              <p className="text-[13.5px] font-semibold text-stone-800">能力设置</p>
              <div className="mt-2 space-y-1">
                {SKILLS.map((s) => (
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

            {/* 知识库 */}
            <div className="mt-5 px-5">
              <p className="text-[13.5px] font-semibold text-stone-800">知识库</p>
              <div className="mt-2 space-y-1">
                <button className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-left transition hover:bg-[#fdfaf5]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-stone-700">产品文档库</span>
                    <span className="block text-[11px] text-stone-400">包含 45 个文档</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-stone-300" />
                </button>
                <button className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-left transition hover:bg-[#fdfaf5]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Folder className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-stone-700">竞品资料库</span>
                    <span className="block text-[11px] text-stone-400">包含 23 个文档</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-stone-300" />
                </button>
              </div>
            </div>

            <div className="mt-auto flex items-center gap-2 border-t border-[#f0eadf] p-4">
              <button
                onClick={() => demo("分享智能体")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#ece6db] bg-white py-2.5 text-[13px] font-medium text-stone-600 transition hover:border-[#e0b79c]"
              >
                <Share2 className="h-4 w-4" /> 分享智能体
              </button>
              <button
                onClick={() => void startChat("pm")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 py-2.5 text-[13px] font-medium text-white shadow-sm transition hover:brightness-105"
              >
                <MessageCircle className="h-4 w-4" /> 开始对话
              </button>
            </div>
          </aside>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
