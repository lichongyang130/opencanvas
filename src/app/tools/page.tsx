"use client";

import {
  Bell,
  FileImage,
  FileText,
  LayoutGrid,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";
import { ShellSidebar } from "@/components/mockup/ShellSidebar";
import { toast } from "@/lib/store/toast";
import { Toaster } from "@/components/Toaster";

interface Tool {
  name: string;
  desc: string;
  icon: any;
  tint: string;
  bg: string;
  action: string;
}

const DOC_TOOLS: Tool[] = [
  { name: "格式转换", desc: "支持 PDF、Word、Excel、PPT 等常见格式互转", icon: FileText, tint: "text-blue-600", bg: "bg-blue-50", action: "格式转换" },
  { name: "PDF 工具", desc: "合并、拆分、加密、压缩、PDF 文件", icon: FileText, tint: "text-red-500", bg: "bg-red-50", action: "PDF 工具" },
  { name: "图片转文字", desc: "提取图片中的文字内容", icon: FileImage, tint: "text-emerald-600", bg: "bg-emerald-50", action: "图片转文字" },
  { name: "文档压缩", desc: "减小文件体积大小，方便存储和传输", icon: FileText, tint: "text-violet-600", bg: "bg-violet-50", action: "文档压缩" },
  { name: "水印添加", desc: "为文档或图片添加文字或图片水印", icon: FileImage, tint: "text-orange-600", bg: "bg-orange-50", action: "水印添加" },
  { name: "文档管理", desc: "批量、删除、重新命名等文档管理", icon: FileText, tint: "text-amber-600", bg: "bg-amber-50", action: "文档管理" },
];

const CONTENT_TOOLS: Tool[] = [
  { name: "智能写作", desc: "辅助撰写、修改、提升内容质量", icon: Sparkles, tint: "text-emerald-600", bg: "bg-emerald-50", action: "智能写作" },
  { name: "内容润色", desc: "优化文字表达，提升可读性", icon: FileText, tint: "text-blue-600", bg: "bg-blue-50", action: "内容润色" },
  { name: "摘要提取", desc: "自动提取文章、报告、文档内容", icon: FileText, tint: "text-sky-600", bg: "bg-sky-50", action: "摘要提取" },
  { name: "语法检查", desc: "检查语法与拼写错误，纠正表达", icon: FileText, tint: "text-red-500", bg: "bg-red-50", action: "语法检查" },
  { name: "关键词提取", desc: "自动提取关键词与标签", icon: Send, tint: "text-violet-600", bg: "bg-violet-50", action: "关键词提取" },
  { name: "摘要生成", desc: "自动生成文章摘要", icon: Sparkles, tint: "text-orange-600", bg: "bg-orange-50", action: "摘要生成" },
];

const DATA_TOOLS: Tool[] = [
  { name: "表格处理", desc: "Excel 表格编辑与处理", icon: FileText, tint: "text-emerald-600", bg: "bg-emerald-50", action: "表格处理" },
  { name: "数据可视化", desc: "将数据转化为图表和图像", icon: FileImage, tint: "text-sky-600", bg: "bg-sky-50", action: "数据可视化" },
  { name: "数据分析", desc: "数据统计分析和数据整理", icon: FileText, tint: "text-blue-600", bg: "bg-blue-50", action: "数据分析" },
  { name: "去重工具", desc: "查找和删除重复内容", icon: FileText, tint: "text-violet-600", bg: "bg-violet-50", action: "去重工具" },
  { name: "数据导入", desc: "导入外部数据到系统", icon: Send, tint: "text-amber-600", bg: "bg-amber-50", action: "数据导入" },
  { name: "数据导出", desc: "导出数据到不同格式", icon: FileText, tint: "text-orange-600", bg: "bg-orange-50", action: "数据导出" },
];

const COLLAB_TOOLS: Tool[] = [
  { name: "团队协作", desc: "多人协作编辑文档", icon: Send, tint: "text-blue-600", bg: "bg-blue-50", action: "团队协作" },
  { name: "评论批注", desc: "添加评论和批注", icon: FileText, tint: "text-violet-600", bg: "bg-violet-50", action: "评论批注" },
  { name: "版本管理", desc: "管理文档版本历史", icon: FileText, tint: "text-emerald-600", bg: "bg-emerald-50", action: "版本管理" },
  { name: "权限管理", desc: "设置文档访问权限", icon: FileText, tint: "text-orange-600", bg: "bg-orange-50", action: "权限管理" },
  { name: "分享链接", desc: "生成分享链接", icon: Send, tint: "text-sky-600", bg: "bg-sky-50", action: "分享链接" },
  { name: "活动任务", desc: "创建文档协作任务", icon: Sparkles, tint: "text-amber-600", bg: "bg-amber-50", action: "活动任务" },
];

function ToolGrid({ title, tools }: { title: string; tools: Tool[] }) {
  return (
    <div className="mt-5">
      <h2 className="text-[15px] font-semibold text-stone-800">{title}</h2>
      <div className="mt-3 grid grid-cols-4 gap-3">
        {tools.map((t) => (
          <button
            key={t.name}
            onClick={() => toast(`演示预览：${t.action} 功能即将接入`, "info")}
            className="flex items-start gap-3 rounded-2xl border border-[#ece6db] bg-white p-4 text-left shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:shadow-md"
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.bg} ${t.tint}`}>
              <t.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13.5px] font-semibold text-stone-800">{t.name}</span>
              <span className="mt-1 block text-xs leading-5 text-stone-400">{t.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ToolsPage() {
  const demo = (label: string) => toast(`演示预览：${label} 功能即将接入`, "info");
  return (
    <div className="flex h-screen overflow-hidden bg-[#fbf8f4] text-stone-800">
      <ShellSidebar active="tools" />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* 顶栏 */}
        <header className="flex shrink-0 items-center justify-between border-b border-[#f0eadf] bg-[#fbf8f4] px-6 py-4">
          <div>
            <h1 className="text-[18px] font-semibold text-stone-900">工具箱</h1>
            <p className="mt-0.5 text-[12.5px] text-stone-400">高效工具，提升你的工作效率</p>
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
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-5">
          <div className="mx-auto w-full max-w-[1180px]">
            <ToolGrid title="文档处理" tools={DOC_TOOLS} />
            <ToolGrid title="内容创作" tools={CONTENT_TOOLS} />
            <ToolGrid title="数据处理" tools={DATA_TOOLS} />
            <ToolGrid title="协作工具" tools={COLLAB_TOOLS} />
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
