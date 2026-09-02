"use client";

import { useRouter } from "next/navigation";
import {
  Bell,
  BellDot,
  Calendar,
  CalendarRange,
  ClipboardList,
  FileText,
  Grid3x3,
  LayoutGrid,
  ListChecks,
  Mail,
  MessageSquare,
  Package,
  PenLine,
  PieChart,
  Plus,
  QrCode,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  Timer,
  Video,
  Waypoints,
} from "lucide-react";
import { ShellSidebar } from "@/components/mockup/ShellSidebar";
import { useChatStore } from "@/lib/store/chat";
import type { WorkspaceMode } from "@/lib/store/chat";
import { toast } from "@/lib/store/toast";
import { Toaster } from "@/components/Toaster";

interface App {
  name: string;
  desc: string;
  icon: any;
  tint: string;
  bg: string;
  mode: WorkspaceMode;
  prompt: string;
}

const EFFICIENCY: App[] = [
  { name: "日程管理", desc: "管理安排每日计划议程", icon: Calendar, tint: "text-blue-600", bg: "bg-blue-50", mode: "docs", prompt: "帮我制定一份今天的日程计划，包含上午、下午、晚上各 3 个重点事项，并给出优先级和时间分配。" },
  { name: "任务管理", desc: "创建提醒任务和处理任务", icon: ListChecks, tint: "text-emerald-600", bg: "bg-emerald-50", mode: "chat", prompt: "帮我梳理本周待办任务清单，按紧急重要四象限分类，每项标注负责人和截止时间。" },
  { name: "笔记应用", desc: "快速记录想法和笔记", icon: PenLine, tint: "text-orange-600", bg: "bg-orange-50", mode: "docs", prompt: "帮我整理一份结构化笔记：今天的主要想法、灵感、待跟进事项，用简洁列表呈现。" },
  { name: "待办清单", desc: "管理个人待办事项", icon: ClipboardList, tint: "text-violet-600", bg: "bg-violet-50", mode: "chat", prompt: "为以下目标生成一份可执行的待办清单：把目标拆解为阶段，每项标注预计耗时和优先级，并指出关键路径。" },
  { name: "时间提醒", desc: "记录工作时间和提醒", icon: Timer, tint: "text-sky-600", bg: "bg-sky-50", mode: "chat", prompt: "帮我设计一套每日时间管理提醒方案：包含工作、休息、专注时段建议，以及如何避免拖延。" },
  { name: "文件同步", desc: "跨设备同步文件", icon: RefreshCw, tint: "text-amber-600", bg: "bg-amber-50", mode: "docs", prompt: "写一份跨设备文件同步与备份方案：包含目录规划、同步策略、版本管理与安全建议。" },
];

const COMMUNICATION: App[] = [
  { name: "即时通讯", desc: "团队内部即时聊天", icon: MessageSquare, tint: "text-blue-600", bg: "bg-blue-50", mode: "chat", prompt: "帮我起草一条团队即时沟通消息，问候团队成员并同步本周重点项目进展，语气轻松友好。" },
  { name: "视频会议", desc: "在线视频会议", icon: Video, tint: "text-violet-600", bg: "bg-violet-50", mode: "docs", prompt: "帮我生成一份视频会议议程：包含开场、各议题讨论、时间分配、负责人与结论跟进事项。" },
  { name: "邮件管理", desc: "管理邮件邮件附件", icon: Mail, tint: "text-red-500", bg: "bg-red-50", mode: "chat", prompt: "帮我写一封专业的商务邮件，主题为项目进展同步，包含背景、关键进展、下一步计划与请对方确认事项。" },
  { name: "公告通知", desc: "发布团队公告", icon: BellDot, tint: "text-orange-600", bg: "bg-orange-50", mode: "docs", prompt: "帮我写一份团队公告：关于新版本上线安排，包含上线时间、注意事项、支持渠道，语气正式清晰。" },
  { name: "投票调查", desc: "创建投票和调查", icon: PieChart, tint: "text-emerald-600", bg: "bg-emerald-50", mode: "chat", prompt: "帮我设计一份团队内部投票调查：包含投票主题、5 个选项、补充说明，并给出结果分析思路。" },
  { name: "反馈收集", desc: "收集用户反馈", icon: Mail, tint: "text-sky-600", bg: "bg-sky-50", mode: "docs", prompt: "帮我写一份用户反馈收集模板：包含反馈渠道、问题分类、严重程度、负责人与处理时限。" },
];

const PROJECT: App[] = [
  { name: "项目看板", desc: "可视化项目进度", icon: LayoutGrid, tint: "text-blue-600", bg: "bg-blue-50", mode: "docs", prompt: "帮我生成一个项目看板结构：按待办/进行中/已完成三列，列出当前项目的主要任务与负责人。" },
  { name: "甘特图", desc: "可视化项目管理", icon: CalendarRange, tint: "text-emerald-600", bg: "bg-emerald-50", mode: "docs", prompt: "帮我制定一个项目甘特图计划：包含阶段、起止时间、里程碑、依赖关系与关键路径。" },
  { name: "里程碑", desc: "设置项目里程碑", icon: Waypoints, tint: "text-orange-600", bg: "bg-orange-50", mode: "docs", prompt: "帮我规划一个项目里程碑清单：每个里程碑包含目标、交付物、验收标准与时间节点。" },
  { name: "资源管理", desc: "管理项目资源", icon: Package, tint: "text-violet-600", bg: "bg-violet-50", mode: "docs", prompt: "帮我制定一份项目资源管理表：包含人力、预算、工具、设备资源，以及分配与调度建议。" },
  { name: "风险管理", desc: "识别潜在项目风险", icon: Target, tint: "text-red-500", bg: "bg-red-50", mode: "docs", prompt: "帮我做一份项目风险管理清单：识别主要风险、影响程度、发生概率、应对措施与责任人。" },
  { name: "报告生成", desc: "生成项目报告", icon: FileText, tint: "text-sky-600", bg: "bg-sky-50", mode: "docs", prompt: "帮我写一份项目周报：本周完成、进行中、风险与需协调事项、下周计划。" },
];

const OTHER: App[] = [
  { name: "表单创建", desc: "创建在线表格", icon: ClipboardList, tint: "text-blue-600", bg: "bg-blue-50", mode: "chat", prompt: "帮我设计一份在线表单：包含收集信息的字段类型（文本/单选/多选/日期）、必填项与填写说明。" },
  { name: "二维码生成", desc: "生成二维码", icon: QrCode, tint: "text-emerald-600", bg: "bg-emerald-50", mode: "chat", prompt: "帮我把这段内容整理成适合生成二维码的文字简介：内容简洁、重点突出，控制在 100 字以内。" },
  { name: "条码生成", desc: "生成条码", icon: Grid3x3, tint: "text-orange-600", bg: "bg-orange-50", mode: "chat", prompt: "帮我整理一批商品信息清单，用于生成条码：包含商品名称、编号、规格，格式清晰。" },
  { name: "单位换算", desc: "各种单位换算", icon: CalculatorIcon, tint: "text-violet-600", bg: "bg-violet-50", mode: "chat", prompt: "帮我整理一份常用单位换算速查表：长度、重量、温度、面积、数据存储的单位及换算关系。" },
  { name: "计算器", desc: "科学计算器", icon: CalculatorIcon, tint: "text-sky-600", bg: "bg-sky-50", mode: "chat", prompt: "帮我把下面这些数字做成一个清晰的计算说明：列出计算过程、公式与结果。输入：12000 元，税率 13%，求含税金额。" },
  { name: "随机数生成", desc: "生成随机数", icon: Sparkles, tint: "text-amber-600", bg: "bg-amber-50", mode: "chat", prompt: "帮我生成 10 组随机数规则建议，并给出 3 种随机抽样方法，用于活动抽奖或数据抽样场景。" },
];

function CalculatorIcon(props: any) {
  return <Calc className="h-5 w-5" {...props} />;
}

function Calc({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 6h8" />
      <path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
    </svg>
  );
}

export default function AppsPage() {
  const router = useRouter();
  const { runTemplate } = useChatStore();

  const launch = async (app: App) => {
    toast(`正在打开「${app.name}」…`, "info");
    await runTemplate({ mode: app.mode, prompt: app.prompt });
    router.push("/chat");
  };

  const demo = (label: string) => toast(`演示预览：${label} 功能即将接入`, "info");

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--oc-bg)] text-stone-800">
      <ShellSidebar active="apps" />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* 顶栏 */}
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--oc-border-soft)] bg-[var(--oc-bg)] px-6 py-4">
          <div>
            <h1 className="text-[18px] font-semibold text-stone-900">更多应用</h1>
            <p className="mt-0.5 text-[12.5px] text-stone-400">发现更多实用应用，扩展你的工作能力</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white hover:text-stone-700">
              <Bell className="h-[18px] w-[18px]" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white hover:text-stone-700">
              <Grid3x3 className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={() => demo("上传文档")}
              className="ml-2 flex items-center gap-1.5 rounded-xl border border-[var(--oc-brand-border-soft)] bg-white px-4 py-2 text-[13px] font-medium text-[var(--oc-brand)] transition hover:bg-[var(--oc-brand-hover)]"
            >
              <Plus className="h-4 w-4" /> 上传文档
            </button>
          </div>
        </header>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-5">
          <div className="mx-auto w-full max-w-[1180px]">
            <AppGrid title="效率办公" apps={EFFICIENCY} onLaunch={launch} />
            <AppGrid title="沟通协作" apps={COMMUNICATION} onLaunch={launch} />
            <AppGrid title="项目管理" apps={PROJECT} onLaunch={launch} />
            <AppGrid title="其他应用" apps={OTHER} onLaunch={launch} />

            {/* 底部提示卡 */}
            <div className="mt-5 flex items-center justify-between rounded-2xl border border-[var(--oc-border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Package className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-stone-800">更多应用持续更新中</p>
                  <p className="mt-0.5 text-[12px] text-stone-400">我们正在不断增加更多实用应用，满足你的各种需求</p>
                </div>
              </div>
              <button
                onClick={() => demo("提交应用")}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 px-4 py-2 text-[13px] font-medium text-white shadow-sm transition hover:brightness-105"
              >
                <Send className="h-4 w-4" /> 提交应用
              </button>
            </div>
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function AppGrid({ title, apps, onLaunch }: { title: string; apps: App[]; onLaunch: (a: App) => void | Promise<void> }) {
  return (
    <div className="mt-5">
      <h2 className="text-[15px] font-semibold text-stone-800">{title}</h2>
      <div className="mt-3 grid grid-cols-4 gap-3">
        {apps.map((a) => (
          <button
            key={a.name}
            onClick={() => void onLaunch(a)}
            className="flex items-start gap-3 rounded-2xl border border-[var(--oc-border)] bg-white p-4 text-left shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:shadow-md"
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.bg} ${a.tint}`}>
              <a.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13.5px] font-semibold text-stone-800">{a.name}</span>
              <span className="mt-1 block text-xs leading-5 text-stone-400">{a.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
