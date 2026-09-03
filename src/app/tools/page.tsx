"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import {
  ArrowUpRight,
  Clapperboard,
  FileImage,
  FileSpreadsheet,
  FileText,
  Plus,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { ShellSidebar } from "@/components/mockup/ShellSidebar";
import { toast } from "@/lib/store/toast";
import { Toaster } from "@/components/Toaster";
import { useChatStore } from "@/lib/store/chat";
import NotificationBell from "@/components/NotificationBell";
import CreditsBadge from "@/components/CreditsBadge";

interface Tool {
  name: string;
  desc: string;
  icon: typeof FileText;
  tint: string;
  bg: string;
  kind: "link" | "chat" | "soon";
  to?: string;
  prompt?: string;
  /** chat 卡进入的工作台模式：默认 chat，深度研究用 research */
  mode?: "chat" | "research" | "slides" | "image" | "video" | "docs";
  soonNote?: string;
}

const DOC_TOOLS: Tool[] = [
  { name: "格式转换", desc: "上传 PDF / Word / Excel / PPT / Markdown，自动解析正文", icon: FileText, tint: "text-blue-600", bg: "bg-blue-50", kind: "link", to: "/docs" },
  { name: "PDF 工具", desc: "PDF 上传解析、正文预览与下载", icon: FileText, tint: "text-red-500", bg: "bg-red-50", kind: "link", to: "/docs" },
  { name: "文档管理", desc: "上传、搜索、收藏、回收站、下载与删除", icon: FileText, tint: "text-amber-600", bg: "bg-amber-50", kind: "link", to: "/docs" },
  { name: "图片转文字", desc: "OCR 提取图片文字（需要本地/云端识别服务）", icon: FileImage, tint: "text-emerald-600", bg: "bg-emerald-50", kind: "soon", soonNote: "OCR 服务尚未接入" },
  { name: "文档压缩", desc: "减小文档体积（需要文件压缩后端）", icon: FileText, tint: "text-violet-600", bg: "bg-violet-50", kind: "soon", soonNote: "压缩引擎尚未接入" },
  { name: "水印添加", desc: "为文档或图片添加水印", icon: FileImage, tint: "text-orange-600", bg: "bg-orange-50", kind: "soon", soonNote: "图像处理尚未接入" },
];

const CONTENT_TOOLS: Tool[] = [
  { name: "深度研究", desc: "输入主题生成带引用角标的研究报告，可一键转 PPT（联网检索需 Tavily Key，未配置用演示来源）", icon: Search, tint: "text-sky-600", bg: "bg-sky-50", kind: "chat", mode: "research", prompt: "研究 2026 年 AI Agent 赛道的竞争格局与商业化路径" },
  { name: "AI 视频生成", desc: "输入描述生成动画短片，可预览与下载（内置演示引擎，零密钥可用）", icon: Clapperboard, tint: "text-fuchsia-600", bg: "bg-fuchsia-50", kind: "link", to: "/tools/video" },
  { name: "智能写作", desc: "辅助撰写与提升内容质量（进入对话预填指令）", icon: Sparkles, tint: "text-emerald-600", bg: "bg-emerald-50", kind: "chat", prompt: "你是一位专业写作助手。请根据我提供的内容与主题，协助撰写高质量内容，结构清晰、语言自然。" },
  { name: "内容润色", desc: "优化文字表达，提升可读性", icon: FileText, tint: "text-blue-600", bg: "bg-blue-50", kind: "chat", prompt: "请润色下面的文字，使其更流畅、专业、有感染力，保留原意，并说明主要改动：\n\n" },
  { name: "摘要提取", desc: "自动提取文章/文档的核心内容", icon: FileText, tint: "text-sky-600", bg: "bg-sky-50", kind: "chat", prompt: "请为下面的内容生成简洁的中文摘要（不超过 200 字），并给出 3 个关键词：\n\n" },
  { name: "语法检查", desc: "检查语法与标点并给出修改建议", icon: FileText, tint: "text-red-500", bg: "bg-red-50", kind: "chat", prompt: "请检查下面文本的语法、用词与标点问题，逐条列出问题并给出修改建议：\n\n" },
  { name: "关键词提取", desc: "自动提取关键词与标签", icon: Send, tint: "text-violet-600", bg: "bg-violet-50", kind: "chat", prompt: "从下面的文本中提取 8-10 个关键词，按重要性排序，并给出 3 个内容标签：\n\n" },
  { name: "中英翻译", desc: "信达雅互译，保留专业术语", icon: Send, tint: "text-orange-600", bg: "bg-orange-50", kind: "chat", prompt: "请将下面的内容翻译成中文（如已是中文则翻译成英文），保留专业术语与语气，只输出译文：\n\n" },
];

const DATA_TOOLS: Tool[] = [
  { name: "表格处理", desc: "上传 CSV / XLSX，自动解析表格内容", icon: FileSpreadsheet, tint: "text-emerald-600", bg: "bg-emerald-50", kind: "link", to: "/docs" },
  { name: "数据导入", desc: "上传数据文件进文档中心统一管理", icon: Send, tint: "text-amber-600", bg: "bg-amber-50", kind: "link", to: "/docs" },
  { name: "数据导出", desc: "下载已上传的原始文件", icon: FileText, tint: "text-orange-600", bg: "bg-orange-50", kind: "link", to: "/docs" },
  { name: "数据可视化", desc: "分析数据并给出图表建议", icon: FileImage, tint: "text-sky-600", bg: "bg-sky-50", kind: "chat", prompt: "请分析下面的数据，并给出 3 个可视化图表建议（图表类型、x/y 轴、可读出的洞察），如有异常值请指出：\n\n" },
  { name: "数据分析", desc: "趋势、异常与建议一键解读", icon: FileText, tint: "text-blue-600", bg: "bg-blue-50", kind: "chat", prompt: "请分析下面的数据：总结整体趋势、关键指标、异常点与行动建议：\n\n" },
  { name: "去重工具", desc: "查找并清理重复内容（需要检索索引服务）", icon: Send, tint: "text-violet-600", bg: "bg-violet-50", kind: "soon", soonNote: "重复检测尚未接入" },
];

const COLLAB_TOOLS: Tool[] = [
  { name: "团队协作", desc: "多人共同编辑与评论文档", icon: Send, tint: "text-blue-600", bg: "bg-blue-50", kind: "soon", soonNote: "需要团队账号体系" },
  { name: "评论批注", desc: "在文档上留下评论与批注", icon: FileText, tint: "text-violet-600", bg: "bg-violet-50", kind: "soon", soonNote: "需要团队账号体系" },
  { name: "版本管理", desc: "查看与回滚文档历史版本", icon: FileText, tint: "text-emerald-600", bg: "bg-emerald-50", kind: "soon", soonNote: "需要版本存储服务" },
  { name: "权限管理", desc: "设置文档访问权限", icon: FileText, tint: "text-orange-600", bg: "bg-orange-50", kind: "soon", soonNote: "需要账号体系" },
  { name: "分享链接", desc: "生成只读分享链接（个人使用可先分享智能体/模板）", icon: Send, tint: "text-sky-600", bg: "bg-sky-50", kind: "soon", soonNote: "文档级分享在下个版本开放" },
  { name: "活动任务", desc: "创建文档协作任务", icon: Sparkles, tint: "text-amber-600", bg: "bg-amber-50", kind: "soon", soonNote: "需要团队账号体系" },
];

function ToolGrid({ title, tools, onUse }: { title: string; tools: Tool[]; onUse: (t: Tool) => void }) {
  return (
    <div className="mt-5">
      {title && <h2 className="text-[15px] font-semibold text-stone-800">{title}</h2>}
      <div className="mt-3 grid grid-cols-3 gap-3">
        {tools.map((t) => (
          <button
            key={t.name}
            onClick={() => onUse(t)}
            disabled={t.kind === "soon"}
            className={`flex items-start gap-3 rounded-2xl border p-4 text-left shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition ${
              t.kind === "soon"
                ? "cursor-not-allowed border-[var(--oc-border-soft)] bg-[#faf8f4]/60 opacity-60"
                : "border-[var(--oc-border)] bg-white hover:shadow-md"
            }`}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.bg} ${t.tint}`}>
              <t.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="block text-[13.5px] font-semibold text-stone-800">{t.name}</span>
                {t.kind === "soon" && (
                  <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[9.5px] font-medium text-stone-400">规划中</span>
                )}
                {t.kind === "link" && <ArrowUpRight className="h-3.5 w-3.5 text-stone-300" />}
              </span>
              <span className="mt-1 block text-xs leading-5 text-stone-400">{t.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ToolsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { fillTemplate } = useChatStore();
  const [kw, setKw] = useState("");

  const allTools = useMemo(
    () => [...DOC_TOOLS, ...CONTENT_TOOLS, ...DATA_TOOLS, ...COLLAB_TOOLS],
    []
  );
  const searching = kw.trim().length > 0;
  const filtered = useMemo(() => {
    const k = kw.trim().toLowerCase();
    if (!k) return null;
    return allTools.filter(
      (t) => t.name.toLowerCase().includes(k) || t.desc.toLowerCase().includes(k)
    );
  }, [kw, allTools]);

  const onUse = async (t: Tool) => {
    if (t.kind === "link" && t.to) {
      router.push(t.to);
      return;
    }
    if (t.kind === "chat" && t.prompt) {
      await fillTemplate({ mode: t.mode ?? "chat", prompt: t.prompt });
      toast(`已打开对话框并预填「${t.name}」指令，粘贴内容后发送即可`, "success");
      router.push("/chat");
      return;
    }
    if (t.kind === "soon") {
      toast(t.soonNote ?? "该工具正在规划中", "info");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--oc-bg)] text-stone-800">
      <ShellSidebar active="tools" />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* 顶栏 */}
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--oc-border-soft)] bg-[var(--oc-bg)] px-6 py-4">
          <div>
            <h1 className="text-[18px] font-semibold text-stone-900">{t("pages.tools")}</h1>
            <p className="mt-0.5 text-[12.5px] text-stone-400">
              能真实执行的工具已接真；「规划中」为需要专业后端能力的项目
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <CreditsBadge />
            <button
              onClick={() => router.push("/docs")}
              className="ml-2 flex items-center gap-1.5 rounded-xl border border-[var(--oc-brand-border-soft)] bg-white px-4 py-2 text-[13px] font-medium text-[var(--oc-brand)] transition hover:bg-[var(--oc-brand-hover)]"
            >
              <Plus className="h-4 w-4" /> 上传文档
            </button>
          </div>
        </header>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-5">
          <div className="mx-auto w-full max-w-[1180px]">
            {/* 搜索 */}
            <div className="flex items-center gap-2 rounded-xl border border-[var(--oc-border)] bg-white px-3.5 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <Search className="h-4 w-4 shrink-0 text-stone-400" />
              <input
                value={kw}
                onChange={(e) => setKw(e.target.value)}
                placeholder="搜索 26 个工具（如：研究、视频、翻译、PDF）"
                className="min-w-0 flex-1 bg-transparent text-[13px] text-stone-700 outline-none placeholder:text-stone-400"
              />
              {searching && (
                <button onClick={() => setKw("")} className="shrink-0 rounded-md px-2 py-0.5 text-[11.5px] text-stone-400 transition hover:bg-[var(--oc-hover)] hover:text-stone-600">
                  清除
                </button>
              )}
            </div>

            {searching && filtered ? (
              <>
                <p className="mt-4 text-[12.5px] text-stone-400">
                  找到 {filtered.length} 个匹配「{kw.trim()}」的工具
                </p>
                <ToolGrid title="" tools={filtered} onUse={onUse} />
                {filtered.length === 0 && (
                  <div className="mt-4 rounded-2xl border border-[var(--oc-border-soft)] bg-white px-6 py-12 text-center text-stone-400">
                    <Search className="mx-auto h-6 w-6 text-stone-300" />
                    <p className="mt-2 text-[13px]">没有找到匹配的工具</p>
                    <p className="mt-1 text-[11.5px]">试试「写作」「翻译」「PDF」等关键词</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <ToolGrid title="文档处理" tools={DOC_TOOLS} onUse={onUse} />
                <ToolGrid title="内容创作（基于 AI 对话引擎）" tools={CONTENT_TOOLS} onUse={onUse} />
                <ToolGrid title="数据处理" tools={DATA_TOOLS} onUse={onUse} />
                <div className="mt-5 flex items-center justify-between">
                  <h2 className="text-[15px] font-semibold text-stone-800">
                    协作工具
                    <span className="ml-2 text-[12px] font-normal text-stone-400">需要团队版账号，当前单机版未开放</span>
                  </h2>
                </div>
                <ToolGrid title="" tools={COLLAB_TOOLS} onUse={onUse} />
              </>
            )}
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
