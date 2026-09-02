"use client";

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
import { toast } from "@/lib/store/toast";
import { Toaster } from "@/components/Toaster";

interface App {
  name: string;
  desc: string;
  icon: any;
  tint: string;
  bg: string;
  action: string;
}

const EFFICIENCY: App[] = [
  { name: "日程管理", desc: "管理安排每日计划议程", icon: Calendar, tint: "text-blue-600", bg: "bg-blue-50", action: "日程管理" },
  { name: "任务管理", desc: "创建提醒任务和处理任务", icon: ListChecks, tint: "text-emerald-600", bg: "bg-emerald-50", action: "任务管理" },
  { name: "笔记应用", desc: "快速记录想法和笔记", icon: PenLine, tint: "text-orange-600", bg: "bg-orange-50", action: "笔记应用" },
  { name: "待办清单", desc: "管理个人待办事项", icon: ClipboardList, tint: "text-violet-600", bg: "bg-violet-50", action: "待办清单" },
  { name: "时间提醒", desc: "记录工作时间和提醒", icon: Timer, tint: "text-sky-600", bg: "bg-sky-50", action: "时间提醒" },
  { name: "文件同步", desc: "跨设备同步文件", icon: RefreshCw, tint: "text-amber-600", bg: "bg-amber-50", action: "文件同步" },
];

const COMMUNICATION: App[] = [
  { name: "即时通讯", desc: "团队内部即时聊天", icon: MessageSquare, tint: "text-blue-600", bg: "bg-blue-50", action: "即时通讯" },
  { name: "视频会议", desc: "在线视频会议", icon: Video, tint: "text-violet-600", bg: "bg-violet-50", action: "视频会议" },
  { name: "邮件管理", desc: "管理邮件邮件附件", icon: Mail, tint: "text-red-500", bg: "bg-red-50", action: "邮件管理" },
  { name: "公告通知", desc: "发布团队公告", icon: BellDot, tint: "text-orange-600", bg: "bg-orange-50", action: "公告通知" },
  { name: "投票调查", desc: "创建投票和调查", icon: PieChart, tint: "text-emerald-600", bg: "bg-emerald-50", action: "投票调查" },
  { name: "反馈收集", desc: "收集用户反馈", icon: Mail, tint: "text-sky-600", bg: "bg-sky-50", action: "反馈收集" },
];

const PROJECT: App[] = [
  { name: "项目看板", desc: "可视化项目进度", icon: LayoutGrid, tint: "text-blue-600", bg: "bg-blue-50", action: "项目看板" },
  { name: "甘特图", desc: "可视化项目管理", icon: CalendarRange, tint: "text-emerald-600", bg: "bg-emerald-50", action: "甘特图" },
  { name: "里程碑", desc: "设置项目里程碑", icon: Waypoints, tint: "text-orange-600", bg: "bg-orange-50", action: "里程碑" },
  { name: "资源管理", desc: "管理项目资源", icon: Package, tint: "text-violet-600", bg: "bg-violet-50", action: "资源管理" },
  { name: "风险管理", desc: "识别潜在项目风险", icon: Target, tint: "text-red-500", bg: "bg-red-50", action: "风险管理" },
  { name: "报告生成", desc: "生成项目报告", icon: FileText, tint: "text-sky-600", bg: "bg-sky-50", action: "报告生成" },
];

const OTHER: App[] = [
  { name: "表单创建", desc: "创建在线表格", icon: ClipboardList, tint: "text-blue-600", bg: "bg-blue-50", action: "表单创建" },
  { name: "二维码生成", desc: "生成二维码", icon: QrCode, tint: "text-emerald-600", bg: "bg-emerald-50", action: "二维码生成" },
  { name: "条码生成", desc: "生成条码", icon: Grid3x3, tint: "text-orange-600", bg: "bg-orange-50", action: "条码生成" },
  { name: "单位换算", desc: "各种单位换算", icon: CalculatorIcon, tint: "text-violet-600", bg: "bg-violet-50", action: "单位换算" },
  { name: "计算器", desc: "科学计算器", icon: CalculatorIcon, tint: "text-sky-600", bg: "bg-sky-50", action: "计算器" },
  { name: "随机数生成", desc: "生成随机数", icon: Sparkles, tint: "text-amber-600", bg: "bg-amber-50", action: "随机数生成" },
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

function AppGrid({ title, apps }: { title: string; apps: App[] }) {
  return (
    <div className="mt-5">
      <h2 className="text-[15px] font-semibold text-stone-800">{title}</h2>
      <div className="mt-3 grid grid-cols-4 gap-3">
        {apps.map((a) => (
          <button
            key={a.name}
            onClick={() => toast(`演示预览：${a.action} 功能即将接入`, "info")}
            className="flex items-start gap-3 rounded-2xl border border-[#ece6db] bg-white p-4 text-left shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:shadow-md"
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

export default function AppsPage() {
  const demo = (label: string) => toast(`演示预览：${label} 功能即将接入`, "info");
  return (
    <div className="flex h-screen overflow-hidden bg-[#fbf8f4] text-stone-800">
      <ShellSidebar active="apps" />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* 顶栏 */}
        <header className="flex shrink-0 items-center justify-between border-b border-[#f0eadf] bg-[#fbf8f4] px-6 py-4">
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
              className="ml-2 flex items-center gap-1.5 rounded-xl border border-[#f0c9a8] bg-white px-4 py-2 text-[13px] font-medium text-[#c05f3c] transition hover:bg-[#fdeee1]"
            >
              <Plus className="h-4 w-4" /> 上传文档
            </button>
          </div>
        </header>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-5">
          <div className="mx-auto w-full max-w-[1180px]">
            <AppGrid title="效率办公" apps={EFFICIENCY} />
            <AppGrid title="沟通协作" apps={COMMUNICATION} />
            <AppGrid title="项目管理" apps={PROJECT} />
            <AppGrid title="其他应用" apps={OTHER} />

            {/* 底部提示卡 */}
            <div className="mt-5 flex items-center justify-between rounded-2xl border border-[#ece6db] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
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
