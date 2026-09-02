"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  Check,
  Copy,
  FileText,
  ImageIcon,
  Loader2,
  Mail,
  BookOpen,
  Mic,
  MonitorPlay,
  Paperclip,
  Pencil,
  Presentation,
  RefreshCw,
  Search,
  Send,
  Square,
  Video,
  Volume2,
  Wand2,
  X,
} from "lucide-react";
import { useChatStore, MODE_LABELS, type WorkspaceMode, type UIMessage } from "@/lib/store/chat";
import { IMAGE_MODELS } from "@/lib/gateway/image/models";
import { extractPageHtml } from "@/lib/code";
import { Markdown } from "./Markdown";
import { PersonaPicker } from "./PersonaPicker";
import KbPicker from "./KbPicker";
import { ModelSelector } from "./ModelSelector";
import { MODELS } from "@/lib/gateway/models";
import { toast } from "@/lib/store/toast";
import { getOverrides } from "@/lib/settings";
import { SLASH_COMMANDS, matchSlash, TONE_CHIPS, LENGTH_CHIPS, AUDIENCE_CHIPS, type PromptChip } from "@/lib/slash";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════
 *  能力体系（E5 分体式输入舱用）
 * ═══════════════════════════════════════════ */

interface SubCapability {
  id: string;
  label: string;
  emoji: string;
  mode: WorkspaceMode;
}

interface CatDef {
  id: string;
  label: string;
  emoji: string;
  items: SubCapability[];
}

const CAPABILITIES: CatDef[] = [
  {
    id: "brand",
    label: "品牌与传播",
    emoji: "🌐",
    items: [
      { id: "brand-website", label: "产品官网", emoji: "🌐", mode: "docs" },
      { id: "brand-landing", label: "营销落地页", emoji: "", mode: "docs" },
      { id: "brand-mall", label: "品牌商城", emoji: "🛒", mode: "docs" },
      { id: "brand-visual", label: "品牌主视觉", emoji: "", mode: "image" },
      { id: "brand-poster", label: "活动海报", emoji: "🪧", mode: "image" },
      { id: "brand-launch", label: "产品发布会", emoji: "🎤", mode: "slides" },
    ],
  },
  {
    id: "content",
    label: "内容与视频",
    emoji: "",
    items: [
      { id: "content-concept", label: "产品概念图", emoji: "💡", mode: "image" },
      { id: "content-promo", label: "产品宣传片", emoji: "🎬", mode: "video" },
      { id: "content-short", label: "社交短视频", emoji: "", mode: "video" },
      { id: "content-tutorial", label: "功能讲解", emoji: "🎓", mode: "video" },
      { id: "content-3d", label: "3D 产品展示", emoji: "🧊", mode: "image" },
      { id: "content-hall", label: "3D 虚拟展厅", emoji: "🏛️", mode: "image" },
    ],
  },
  {
    id: "product",
    label: "产品与体验",
    emoji: "📱",
    items: [
      { id: "product-flow", label: "用户流程图", emoji: "🗺️", mode: "docs" },
      { id: "product-wire", label: "低保真原型", emoji: "️", mode: "docs" },
      { id: "product-app", label: "移动应用 MVP", emoji: "📲", mode: "docs" },
      { id: "product-companion", label: "设备伴侣", emoji: "🤖", mode: "docs" },
      { id: "product-web", label: "Web 应用", emoji: "💻", mode: "docs" },
      { id: "product-ext", label: "浏览器扩展", emoji: "🧩", mode: "docs" },
    ],
  },
  {
    id: "data",
    label: "数据与运营",
    emoji: "📊",
    items: [
      { id: "data-ops", label: "运营看板", emoji: "📈", mode: "docs" },
      { id: "data-cockpit", label: "管理驾驶舱", emoji: "🛰️", mode: "docs" },
      { id: "data-monitor", label: "系统监控台", emoji: "🔭", mode: "docs" },
      { id: "data-agent", label: "AI Agent 工作流", emoji: "🕸️", mode: "docs" },
    ],
  },
  {
    id: "consult",
    label: "咨询与策划",
    emoji: "💼",
    items: [
      { id: "consult-pitch", label: "融资路演", emoji: "💼", mode: "slides" },
      { id: "consult-strategy", label: "战略方案", emoji: "♟️", mode: "docs" },
      { id: "consult-research", label: "研究报告", emoji: "🔬", mode: "research" },
      { id: "consult-prd", label: "产品需求文档", emoji: "📐", mode: "docs" },
      { id: "consult-training", label: "培训课件", emoji: "", mode: "slides" },
    ],
  },
];

const EXAMPLES: Record<WorkspaceMode, string[]> = {
  chat: ["帮我写一封商务合作邮件", "解释一下什么是 RAG", "把这段话翻译成英文"],
  research: ["研究 2025 年 AI 搜索赛道的竞争格局", "调研美国精品咖啡市场规模与趋势"],
  slides: ["为「AI 写作助手产品发布会」生成一套 10 页 PPT", "做一份季度经营复盘 PPT 大纲"],
  image: [
    "一只戴宇航头盔的柯基在月球上，电影感海报",
    "新中式茶饮品牌的社媒宣传图，清新水彩风",
    "赛博朋克风格的未来城市夜景，霓虹灯",
  ],
  video: ["为新款降噪耳机写一条 15 秒带货短视频脚本", "生成咖啡品牌上市的短视频分镜"],
  docs: ["写一份 SaaS 产品商业计划书", "起草一份远程办公管理制度"],
};

const IMAGE_SIZES = [
  { id: "1024x1024", label: "方形 1:1" },
  { id: "1792x1024", label: "横版 16:9" },
  { id: "1024x1792", label: "竖版 9:16" },
];

const IMAGE_STYLES = [
  "电影感海报",
  "3D 渲染",
  "水彩手绘",
  "赛博朋克",
  "极简扁平",
  "新中式国风",
  "吉卜力动画风",
  "产品摄影",
];

/** 首页功能卡片 */
const HOME_CARDS: {
  icon: typeof Mail;
  title: string;
  desc: string;
  mode: WorkspaceMode;
  prompt: string;
}[] = [
  { icon: Mail, title: "撰写邮件", desc: "起草清晰、有说服力的商务邮件", mode: "chat", prompt: "帮我写一封商务合作邮件" },
  { icon: FileText, title: "生成文档", desc: "商业计划书 / 制度 / 报告一键成稿", mode: "docs", prompt: "写一份 SaaS 产品商业计划书" },
  { icon: Presentation, title: "制作 PPT", desc: "输入主题，生成整套幻灯片", mode: "slides", prompt: "为产品发布会生成一套 10 页 PPT" },
  { icon: ImageIcon, title: "生成图片", desc: "描述画面，AI 立即出图", mode: "image", prompt: "一只戴宇航头盔的柯基在月球上，电影感海报" },
  { icon: Search, title: "深度研究", desc: "市场 / 竞品 / 行业调研报告", mode: "research", prompt: "研究 2025 年 AI 搜索赛道的竞争格局" },
  { icon: Video, title: "视频脚本", desc: "带货 / 分镜 / 口播脚本", mode: "video", prompt: "为新款降噪耳机写一条 15 秒带货短视频脚本" },
];

/* ═══════════════════════════════════════════
 *  消息气泡
 * ═══════════════════════════════════════════ */

function MessageBubble({ m, index }: { m: UIMessage; index: number }) {
  const [copied, setCopied] = useState(false);
  const [refsOpen, setRefsOpen] = useState(false);
  const { setCodePreview } = useChatStore();
  const sending = useChatStore((s) => s.sending);
  const copy = () => {
    navigator.clipboard?.writeText(m.content).then(
      () => {
        setCopied(true);
        toast("已复制", "success");
        setTimeout(() => setCopied(false), 1500);
      },
      () => toast("复制失败", "error")
    );
  };
  const isUser = m.role === "user";
  // 从 AI 回复中提取可运行的 HTML 页面
  const pageHtml = useMemo(() => (m.role === "assistant" ? extractPageHtml(m.content) : null), [m.content, m.role]);

  return (
    <div className={cn("group/msg flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-brand-600 text-white"
            : m.error
              ? "border border-red-200 bg-red-50 text-red-700"
              : "border border-stone-200 bg-white text-stone-800",
          m.streaming && !m.content && "text-stone-400"
        )}
      >
        {m.streaming && !m.content ? (
          "正在思考…"
        ) : isUser ? (
          <div className="whitespace-pre-wrap">{m.content}</div>
        ) : (
          <div className="markdown-body">
            <Markdown content={m.content} />
            {m.streaming && <span className="streaming-cursor" />}
          </div>
        )}
        {/* 知识库引用来源 */}
        {!isUser && (m.refs?.length ?? 0) > 0 && (
          <div className="mt-2 border-t border-stone-100 pt-2">
            <button
              onClick={() => setRefsOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[11px] font-medium text-[#c05f3c] transition hover:bg-[#fbf3ec]"
            >
              <BookOpen className="h-3 w-3" />
              引用来源 {m.refs!.length} 条
              <span className="text-[9px] opacity-60">{refsOpen ? "▲" : "▼"}</span>
            </button>
            {refsOpen && (
              <div className="mt-1.5 space-y-1.5">
                {m.refs!.map((r, i) => (
                  <div key={`${r.docId}-${i}`} className="rounded-lg border border-stone-100 bg-[#fdfaf6] px-2.5 py-2">
                    <p className="text-[10.5px] font-medium text-stone-500">
                      资料{i + 1} · {r.docName}
                      <span className="ml-2 rounded bg-[#fbf3ec] px-1.5 py-0.5 text-[9.5px] text-[#c05f3c]">
                        相关度 {r.score}
                      </span>
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-stone-400">{r.snippet}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!m.streaming && m.content && (
          <div
            className={cn(
              "mt-1.5 flex justify-end gap-1 opacity-0 transition group-hover/msg:opacity-100",
              isUser && "justify-start"
            )}
          >
            {!isUser && pageHtml && (
              <button
                onClick={() => setCodePreview(pageHtml.html, pageHtml.lang)}
                title="在右侧沙箱中运行预览"
                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-emerald-600 transition hover:bg-emerald-50"
              >
                <MonitorPlay className="h-3 w-3" /> 运行预览
              </button>
            )}
            {!isUser && (
              <button
                onClick={() => {
                  if (speechSynthesis.speaking) { speechSynthesis.cancel(); return; }
                  const u = new SpeechSynthesisUtterance(m.content);
                  u.lang = "zh-CN";
                  speechSynthesis.speak(u);
                }}
                title="朗读该回复"
                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-stone-400 transition hover:bg-stone-100"
              >
                <Volume2 className="h-3 w-3" /> 朗读
              </button>
            )}
            {!isUser && !sending && (
              <button
                onClick={() => void useChatStore.getState().regenerate()}
                title="重新生成该回复"
                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-stone-400 transition hover:bg-stone-100"
              >
                <RefreshCw className="h-3 w-3" /> 重生成
              </button>
            )}
            {isUser && !sending && (
              <button
                onClick={() => useChatStore.getState().editResendFrom(index)}
                title="编辑并重发（删除此后回复，内容回填输入框）"
                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-stone-400 transition hover:bg-stone-100"
              >
                <Pencil className="h-3 w-3" /> 编辑
              </button>
            )}
            <button
              onClick={copy}
              title="复制"
              className={cn(
                "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] transition",
                isUser ? "text-white/70 hover:bg-white/10" : "text-stone-400 hover:bg-stone-100"
              )}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "已复制" : "复制"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
 *  分体式输入舱组件 (E5)
 * ═══════════════════════════════════════════ */

function SplitComposer({
  input,
  setInput,
  inputRef,
  submit,
  sending,
  stopGeneration,
  model,
  setModel,
  mode,
  imgSize,
  setImgSize,
  enhancing,
  enhancePrompt,
  slashMatches,
  slashIdx,
  setSlashIdx,
  runSlash,
  sendKey,
  attachments,
  onAddFiles,
  onRemoveAttachment,
  uploading,
}: {
  sendKey: "enter" | "ctrlEnter";
  input: string;
  setInput: (v: string | ((prev: string) => string)) => void;
  inputRef: React.Ref<HTMLTextAreaElement>;
  submit: () => void;
  sending: boolean;
  stopGeneration: () => void;
  model: string;
  setModel: (id: string, provider?: string) => void;
  mode: WorkspaceMode;
  imgSize: string;
  setImgSize: (v: string) => void;
  enhancing: boolean;
  enhancePrompt: () => void;
  slashMatches: ReturnType<typeof matchSlash>;
  slashIdx: number;
  setSlashIdx: (v: number | ((prev: number) => number)) => void;
  runSlash: (cmd: (typeof SLASH_COMMANDS)[number]) => void;
  attachments: Attachment[];
  onAddFiles: (files: File[] | FileList) => void;
  onRemoveAttachment: (id: string) => void;
  uploading: boolean;
}) {
  const [activeCat, setActiveCat] = useState<string>("brand");
  const [listening, setListening] = useState(false);
  const activeCategory = CAPABILITIES.find((c) => c.id === activeCat) ?? CAPABILITIES[0];

  /** 语音输入（Web Speech API，Chrome/Edge/Android；不支持时提示） */
  const toggleVoice = () => {
    type VoiceRecognition = {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      start: () => void;
      stop: () => void;
      onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      onend: (() => void) | null;
      onerror: (() => void) | null;
    };
    const w = window as unknown as {
      SpeechRecognition?: new () => VoiceRecognition;
      webkitSpeechRecognition?: new () => VoiceRecognition;
    };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      toast("当前浏览器不支持语音输入（请用 Chrome/Edge）", "info");
      return;
    }
    if (listening) {
      setListening(false);
      return;
    }
    try {
      const rec = new SR();
      rec.lang = "zh-CN";
      rec.interimResults = true;
      rec.continuous = false;
      rec.onresult = (e) => {
        const parts: string[] = [];
        for (let i = 0; i < e.results.length; i++) parts.push(e.results[i][0]?.transcript ?? "");
        setInput((v) => v + parts.join(""));
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      rec.start();
      setListening(true);
    } catch {
      toast("语音输入启动失败", "error");
    }
  };

  const handleCapabilityClick = (item: SubCapability) => {
    setInput("");
    useChatStore.getState().setMode(item.mode);
    toast(`已选择：${item.label}`, "info");
  };

  return (
    <div
      className="rounded-2xl border border-[var(--oc-border-strong)] bg-white shadow-sm overflow-hidden"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files ?? []);
        if (files.length > 0) onAddFiles(files);
      }}
    >
      <div className="flex min-h-[160px]">
        {/* ──── 左侧能力区 (约 38%，窄屏隐藏) ──── */}
        <div className="hidden w-[38%] shrink-0 flex-col border-r border-[var(--oc-border-strong)] bg-[var(--oc-bg)] sm:flex">
          {/* 分类标签栏 */}
          <div className="flex items-center gap-0 border-b border-[var(--oc-border-strong)] px-2 py-1.5">
            {CAPABILITIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] transition",
                  activeCat === cat.id
                    ? "bg-brand-600 font-medium text-white"
                    : "text-stone-500 hover:bg-stone-100"
                )}
              >
                <span className="text-xs">{cat.emoji}</span>
                <span className="hidden sm:inline">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* 子能力网格 */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="grid grid-cols-2 gap-1.5">
              {activeCategory.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleCapabilityClick(item)}
                  className={cn(
                    "group flex items-start gap-1.5 rounded-lg border border-transparent px-2 py-2 text-left transition",
                    "hover:border-stone-200 hover:bg-white hover:shadow-sm"
                  )}
                >
                  <span className="mt-0.5 text-sm leading-none">{item.emoji}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-medium text-stone-700 group-hover:text-stone-900">
                      {item.label}
                    </span>
                    <span className="block text-[9px] text-stone-400">
                      {MODE_LABELS[item.mode]}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ──── 右侧输入区 (约 62%) ──── */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* 图片模式参数 */}
          {mode === "image" && (
            <div className="flex flex-wrap items-center gap-1.5 border-b border-stone-100 px-3 py-1.5">
              <span className="text-[10px] text-stone-400">尺寸</span>
              {IMAGE_SIZES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setImgSize(s.id)}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] transition",
                    imgSize === s.id
                      ? "border-brand-500 bg-brand-50 font-medium text-brand-700"
                      : "border-stone-200 text-stone-500 hover:border-brand-300"
                  )}
                >
                  {s.label}
                </button>
              ))}
              <span className="ml-1 text-[10px] text-stone-400">风格</span>
              {IMAGE_STYLES.slice(0, 4).map((st) => (
                <button
                  key={st}
                  onClick={() => setInput((v) => (v.trim() ? v.replace(/[，,。\s]*$/, "") + "，" + st : st))}
                  className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600 transition hover:bg-brand-100 hover:text-brand-700"
                >
                  {st}
                </button>
              ))}
            </div>
          )}

          {/* 斜杠命令菜单 */}
          {slashMatches && (
            <div className="absolute bottom-full left-0 z-20 mb-2 max-h-72 w-72 overflow-y-auto rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl">
              <div className="px-2 py-1 text-[11px] text-stone-400">快捷命令（↑↓ 选择，Enter 执行）</div>
              {slashMatches.length === 0 && (
                <div className="px-2 py-3 text-center text-xs text-stone-400">没有匹配的命令</div>
              )}
              {slashMatches.map((c, i) => (
                <button
                  key={c.cmd}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    runSlash(c);
                  }}
                  onMouseEnter={() => setSlashIdx(i)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left",
                    i === slashIdx ? "bg-brand-50" : "hover:bg-stone-50"
                  )}
                >
                  <span className="flex h-6 w-12 shrink-0 items-center justify-center rounded bg-stone-100 font-mono text-[11px] text-stone-500">
                    /{c.cmd}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-stone-700">{c.label}</span>
                    <span className="block truncate text-[11px] text-stone-400">{c.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 文字类模式参数 */}
          {mode !== "image" && !slashMatches && (
            <div className="flex flex-wrap items-center gap-1 border-b border-stone-100 px-3 py-1.5">
              <span className="text-[10px] text-stone-400">语气</span>
              {TONE_CHIPS.slice(0, 4).map((c) => (
                <button
                  key={c.id}
                  className="rounded-full border border-stone-200 px-2 py-0.5 text-[10px] text-stone-500 transition hover:border-brand-300"
                >
                  {c.label}
                </button>
              ))}
              <span className="ml-1 text-[10px] text-stone-400">长度</span>
              {LENGTH_CHIPS.slice(0, 3).map((c) => (
                <button
                  key={c.id}
                  className="rounded-full border border-stone-200 px-2 py-0.5 text-[10px] text-stone-500 transition hover:border-brand-300"
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {/* 附件条 */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-b border-stone-100 px-3 py-2">
              {attachments.map((a) => (
                <span
                  key={a.id}
                  className="flex max-w-[220px] items-center gap-1.5 rounded-lg border border-[var(--oc-border)] bg-[var(--oc-bg)] py-1 pl-1.5 pr-1 text-[11px] text-stone-600"
                >
                  {a.kind === "image" && a.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.url} alt={a.name} className="h-7 w-7 rounded object-cover" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                  )}
                  <span className="truncate">{a.name}</span>
                  <button
                    onClick={() => onRemoveAttachment(a.id)}
                    className="rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                    title="移除附件"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {uploading && <Loader2 className="h-4 w-4 self-center animate-spin text-stone-400" />}
            </div>
          )}

          {/* 输入框 */}
          <div className="relative flex flex-1 flex-col">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                const isSend =
                  sendKey === "ctrlEnter"
                    ? e.key === "Enter" && !e.shiftKey && (e.ctrlKey || e.metaKey)
                    : e.key === "Enter" && !e.shiftKey;
                if (slashMatches && slashMatches.length > 0) {
                  if (e.key === "ArrowDown") { e.preventDefault(); setSlashIdx((i) => (i + 1) % slashMatches.length); return; }
                  if (e.key === "ArrowUp") { e.preventDefault(); setSlashIdx((i) => (i - 1 + slashMatches.length) % slashMatches.length); return; }
                  if (isSend) { e.preventDefault(); runSlash(slashMatches[Math.min(slashIdx, slashMatches.length - 1)]); return; }
                  if (e.key === "Escape") { e.preventDefault(); setInput(""); return; }
                }
                  if (isSend) { e.preventDefault(); submit(); }
                  // ↑ 键召回上一条用户输入（输入框为空时）
                  if (e.key === "ArrowUp" && !input && !e.shiftKey) {
                    const msgs = useChatStore.getState().conversations.find((c) => c.id === useChatStore.getState().activeId)?.messages ?? [];
                    const lastUser = [...msgs].reverse().find((m) => m.role === "user");
                    if (lastUser) { e.preventDefault(); setInput(lastUser.content); }
                  }
              }}
              onPaste={(e) => {
                const files = Array.from(e.clipboardData.files ?? []);
                if (files.length > 0) {
                  e.preventDefault();
                  onAddFiles(files);
                }
              }}
              rows={3}
              placeholder={
                mode === "image"
                  ? "描述你想要的画面…"
                  : mode === "chat"
                    ? "分配任务，或问我任何事…（可粘贴图片 / 添加文档）"
                    : `${MODE_LABELS[mode]}：描述你的需求…`
              }
              className="flex-1 min-h-[80px] w-full resize-none bg-transparent px-4 py-3 text-[14px] leading-relaxed outline-none placeholder:text-stone-400"
            />
          </div>

          {/* 底部工具栏 */}
          <div className="flex items-center justify-between border-t border-stone-100 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => document.getElementById("oc-attach-input")?.click()}
                disabled={uploading}
                title="添加附件：图片 / TXT / MD / PDF / DOCX"
                className="flex h-7 items-center gap-1 rounded-full border border-stone-200 px-2.5 text-[11px] text-stone-500 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-30"
              >
                <Paperclip className="h-3 w-3" />
                附件
              </button>
              <input
                id="oc-attach-input"
                type="file"
                multiple
                accept="image/*,.txt,.md,.csv,.pdf,.docx,.doc,.json,.html,.log,.yml,.yaml"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) onAddFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => void enhancePrompt()}
                disabled={!input.trim() || enhancing}
                title="优化提示词"
                className="flex h-7 items-center gap-1 rounded-full border border-stone-200 px-2.5 text-[11px] text-stone-500 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-30"
              >
                {enhancing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                优化
              </button>
              <button
                onClick={toggleVoice}
                title={listening ? "停止语音输入" : "语音输入（Chrome/Edge）"}
                className={cn(
                  "flex h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] transition",
                  listening
                    ? "border-rose-300 bg-rose-50 text-rose-600"
                    : "border-stone-200 text-stone-500 hover:border-brand-300 hover:text-brand-600"
                )}
              >
                {listening ? <Mic className="h-3 w-3 animate-pulse" /> : <Mic className="h-3 w-3" />}
                {listening ? "聆听中…" : "语音"}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <ModelSelector
                value={model}
                onChange={(id, provider) => {
                  setModel(id, provider);
                  const label = MODELS.find((m) => m.id === id)?.label ?? id;
                  toast(`已切换到 ${label}`, "success");
                }}
              />
              {sending ? (
                <button
                  onClick={stopGeneration}
                  title="停止生成"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-700 text-white transition hover:bg-stone-800"
                >
                  <Square className="h-3 w-3 fill-current" />
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={!input.trim()}
                  title="发送"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:bg-stone-200 disabled:text-stone-400"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 对话附件：图片（data URL 展示）或文本/文档（提取正文注入模型） */
interface Attachment {
  id: string;
  name: string;
  kind: "image" | "text";
  url?: string;
  content?: string;
  size: number;
}

/* ═══════════════════════════════════════════
 *  主 ChatPanel
 * ═══════════════════════════════════════════ */

export function ChatPanel() {
  const { conversations, activeId, send, sending, stopGeneration, model, setModel } = useChatStore();
  const pendingInput = useChatStore((s) => s.pendingInput);
  const sendKey = useChatStore((s) => s.sendKey);
  const setKbId = useChatStore((s) => s.setKbId);
  const convo = conversations.find((c) => c.id === activeId);
  const [input, setInput] = useState("");
  const [imgSize, setImgSize] = useState("1024x1024");
  const [picModel, setPicModel] = useState("auto");
  const [picConfigured, setPicConfigured] = useState<Record<string, boolean>>({});
  const [showJump, setShowJump] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [slashIdx, setSlashIdx] = useState(0);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const slashMatches = matchSlash(input);
  useEffect(() => setSlashIdx(0), [input]);

  // 图像模型配置状态（用于图片模式下拉提示「未配置密钥」）
  useEffect(() => {
    let live = true;
    fetch("/api/models")
      .then((r) => r.json())
      .then((d: { imageStatus?: Record<string, boolean> }) => {
        if (live) setPicConfigured(d.imageStatus ?? {});
      })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (pendingInput) {
      setInput(pendingInput.text);
      inputRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingInput?.nonce]);

  const applyChip = (chip: PromptChip) => {
    setInput((v) => {
      const has = v.includes(chip.suffix);
      if (has) return v.replace(new RegExp(`\\n?${chip.suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g"), "").trimEnd();
      if (v.startsWith("/")) return v;
      return v.trim() ? v.replace(/\s*$/, "") + "\n" + chip.suffix : chip.suffix;
    });
  };
  const chipOn = (c: PromptChip) => input.includes(c.suffix);

  const runSlash = (cmd: (typeof SLASH_COMMANDS)[number]) => {
    if (cmd.kind === "action" && cmd.mode) {
      useChatStore.getState().setMode(cmd.mode);
      setInput("");
      toast(`已切换到${MODE_LABELS[cmd.mode]}工作台`, "info");
      return;
    }
    const raw = input.replace(/^\/[a-z]*\s*/i, "").trim();
    const text = (cmd.insert ?? "").replace("{q}", raw);
    setInput(text);
    setTimeout(() => {
      const ta = inputRef.current;
      if (!ta) return;
      const pos = text.includes("「") ? text.indexOf("」") : text.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    }, 0);
  };

  useEffect(() => {
    if (messages.length === 0) inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const messages = convo?.messages ?? [];
  const mode: WorkspaceMode = convo?.mode ?? "chat";

  const scrollToBottom = (smooth = true) =>
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: smooth ? "smooth" : "auto" });

  useEffect(() => { scrollToBottom(); }, [messages.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => { setShowJump(el.scrollHeight - el.scrollTop - el.clientHeight >= 120); };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // 发送中跟随最新消息滚动；scrollToBottom 由本组件定义，仅随 sending/最后一条消息变化触发
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (sending) scrollToBottom(); }, [sending, messages[messages.length - 1]?.content]);

  /** 添加附件：图片 → data URL；文本/文档 → 上传解析提取正文 */
  const addFiles = async (files: File[] | FileList) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true);
    try {
      for (const f of list) {
        if (f.size > 20 * 1024 * 1024) {
          toast(`「${f.name}」超过 20MB，已跳过`, "error");
          continue;
        }
        if (f.type.startsWith("image/")) {
          const url = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result));
            r.onerror = () => reject(new Error("读取图片失败"));
            r.readAsDataURL(f);
          });
          setAttachments((prev) => [
            ...prev,
            { id: crypto.randomUUID(), name: f.name, kind: "image", url, size: f.size },
          ]);
        } else {
          const res = await fetch("/api/documents", {
            method: "POST",
            body: (() => {
              const fd = new FormData();
              fd.append("files", f);
              return fd;
            })(),
          });
          const data = (await res.json()) as { documents?: { content?: string }[]; errors?: string[] };
          const doc = data.documents?.[0];
          if (!res.ok || !doc) throw new Error(data.errors?.[0] ?? "上传失败");
          if (!doc.content) {
            toast(`「${f.name}」暂不支持正文解析，已跳过`, "info");
            continue;
          }
          const content = doc.content.slice(0, 8000); // 控制注入长度
          setAttachments((prev) => [
            ...prev,
            { id: crypto.randomUUID(), name: f.name, kind: "text", content, size: f.size },
          ]);
        }
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "附件处理失败", "error");
    } finally {
      setUploading(false);
    }
  };

  const submit = () => {
    if (sending || (uploading && attachments.length === 0)) return;
    const text = input.trim();
    if (!text && attachments.filter((a) => a.kind !== "image").length === 0) return;
    let payload = text;
    // 附件 → 注入模型上下文：文本内容拼接；图片以 markdown 呈现（视觉模型可读）
    const imgAtts = attachments.filter((a) => a.kind === "image");
    const txtAtts = attachments.filter((a) => a.kind === "text");
    // 图片模式：图片附件作为「参考图（图生图）」单独传参，不拼进提示词
    if (mode === "image") {
      if (txtAtts.length > 0) {
        const blocks = txtAtts
          .map((a) => `【附件：${a.name}】\n${a.content ?? ""}`)
          .join("\n\n");
        payload = payload ? `${payload}\n\n${blocks}` : blocks;
      }
      const refUrl = imgAtts[0]?.url;
      setInput("");
      setAttachments([]);
      void useChatStore.getState().generateImage(payload, imgSize, {
        model: picModel,
        imageUrl: refUrl,
      });
      return;
    }
    if (imgAtts.length > 0) {
      const imgs = imgAtts.map((a) => `![${a.name}](${a.url})`).join("\n");
      payload = payload ? `${payload}\n\n${imgs}` : imgs;
    }
    if (txtAtts.length > 0) {
      const blocks = txtAtts
        .map((a) => `【附件：${a.name}】\n${a.content ?? ""}`)
        .join("\n\n");
      payload = payload ? `${payload}\n\n${blocks}` : blocks;
    }
    setInput("");
    setAttachments([]);
    void send(payload);
  };

  const enhancePrompt = async () => {
    const raw = input.trim();
    if (!raw || enhancing) return;
    setEnhancing(true);
    const ov = getOverrides();
    const hasModel = Object.values(ov).some((p) => p?.apiKey);
    try {
      if (hasModel && mode !== "image") {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: convo?.model ?? "demo",
            overrides: ov,
            messages: [
              { role: "system", content: "你是提示词专家。把用户粗糙的需求改写成结构清晰、效果更好的中文提示词，包含：角色设定、具体任务、背景/受众、输出格式与约束。只输出改写后的提示词本身，不要解释、不要前后缀。" },
              { role: "user", content: raw },
            ],
          }),
        });
        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buf = "", acc = "";
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";
            for (const line of lines) {
              const t = line.trim();
              if (!t.startsWith("data:")) continue;
              let evt: { type: string; delta?: string } | null = null;
              try { evt = JSON.parse(t.slice(5).trim()) as { type: string; delta?: string }; } catch { continue; }
              if (evt.type === "token" && evt.delta) acc += evt.delta;
            }
          }
          if (acc.trim()) { setInput(acc.trim()); toast("提示词已优化", "success"); return; }
        }
      }
      const modeHint: Record<string, string> = {
        image: "请输出一段英文绘图提示词，包含：主体细节、艺术风格、构图景别、光线氛围、画质词，用逗号分隔。",
        slides: "请输出一份幻灯片结构：标题、封面副标题、每页标题与 3-4 个要点。",
        research: "请从背景、现状、关键数据、主要玩家、趋势与结论几个方面展开。",
        docs: "请输出结构完整的文档：标题、导语、分小节（含小标题与要点）、结论。",
        video: "请输出分镜脚本：每个镜头含时长、画面、旁白、字幕。",
        chat: "请分点、有条理地回答，必要时给出步骤和示例。",
      };
      const improved = `# 角色\n你是该领域的资深专家。\n\n# 任务\n${raw}\n\n# 要求\n- 面向：相关从业者 / 普通读者（按需）\n- 语言：中文，专业且易懂\n- 输出：${modeHint[mode] ?? modeHint.chat}\n- 约束：内容准确、结构清晰、可直接使用，避免空话`;
      setInput(improved);
      toast("已生成结构化提示词", "success");
    } catch { toast("优化失败，请重试", "error"); }
    finally { setEnhancing(false); }
  };

  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

  return (
    <div className="relative flex min-w-0 flex-1 flex-col bg-[#f9f5ec]">
      <div
        ref={scrollRef}
        className={cn("flex-1 overflow-y-auto px-6", messages.length === 0 ? "bg-[#f6f1e9] py-10" : "py-8")}
      >
        <div className={cn("mx-auto w-full", messages.length === 0 ? "max-w-4xl" : "max-w-2xl")}>
          {messages.length === 0 ? (
            <div className="pt-4 text-center">
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#4a2e1d] md:text-4xl">
                欢迎回来，今天想做点什么？
              </h1>
              <p className="mt-2 text-sm text-[var(--oc-muted-text)]">用 AI 把想法变成现实。</p>

              {/* E5 分体式输入舱 */}
              <div className="mx-auto mt-8 max-w-3xl">
                <div className="mb-2 flex items-center justify-between">
                  <KbPicker value={convo?.kbId} onChange={setKbId} />
                  {convo?.kbId && (
                    <span className="text-[11px] text-[var(--oc-muted-text)]">
                      已启用知识库检索 · 回答将带引用来源
                    </span>
                  )}
                </div>
                <SplitComposer
                  input={input}
                  setInput={setInput}
                  inputRef={inputRef}
                  submit={submit}
                  sending={sending}
                  stopGeneration={stopGeneration}
                  model={model}
                  setModel={setModel}
                  mode={mode}
                  imgSize={imgSize}
                  setImgSize={setImgSize}
                  enhancing={enhancing}
                  enhancePrompt={enhancePrompt}
                  slashMatches={slashMatches}
                  slashIdx={slashIdx}
                  setSlashIdx={setSlashIdx}
                  runSlash={runSlash}
                  sendKey={sendKey}
                  attachments={attachments}
                  onAddFiles={(f) => void addFiles(f)}
                  onRemoveAttachment={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
                  uploading={uploading}
                />
              </div>
              <p className="mt-2 text-xs text-[#a8977f]">回车发送 · Shift+回车换行 · 点击左侧能力卡片快速开始</p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <span className="text-sm text-[var(--oc-muted-text)]">试试：</span>
                {HOME_CARDS.slice(0, 4).map((q) => (
                  <button
                    key={q.title}
                    onClick={() => {
                      useChatStore.getState().setMode(q.mode);
                      setInput(q.prompt);
                      setTimeout(() => inputRef.current?.focus(), 0);
                    }}
                    className="rounded-full border border-[var(--oc-border-strong)] bg-white px-3.5 py-1.5 text-sm text-[#6b5b48] transition hover:border-[var(--oc-brand)] hover:text-[var(--oc-brand)]"
                  >
                    {q.title}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {mode === "chat" && (
                <div className="flex justify-center">
                  <PersonaPicker
                    onStarter={(t) => { setInput(t); setTimeout(() => inputRef.current?.focus(), 0); }}
                  />
                </div>
              )}
              {messages.map((m, i) => <MessageBubble key={m.id} m={m} index={i} />)}
            </div>
          )}
        </div>
      </div>

      {/* 回到底部 */}
      {showJump && messages.length > 0 && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-[200px] left-1/2 -translate-x-1/2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-500 shadow-md transition hover:text-brand-600"
        >
          ↓ 回到底部
        </button>
      )}

      {/* 对话中底部的分体式输入舱 */}
      {messages.length > 0 && (
        <div className="border-t border-[var(--oc-border-strong)] bg-[var(--oc-bg)] px-6 py-3">
          <div className="mx-auto w-full max-w-3xl">
            {mode === "chat" && (
              <div className="mb-2 flex items-center justify-between">
                <KbPicker value={convo?.kbId} onChange={setKbId} />
                {convo?.kbId && (
                  <span className="text-[11px] text-[var(--oc-muted-text)]">
                    已启用知识库检索 · 回答将带引用来源
                  </span>
                )}
              </div>
            )}
            <SplitComposer
              input={input}
              setInput={setInput}
              inputRef={inputRef}
              submit={submit}
              sending={sending}
              stopGeneration={stopGeneration}
              model={model}
              setModel={setModel}
              mode={mode}
              imgSize={imgSize}
              setImgSize={setImgSize}
              enhancing={enhancing}
              enhancePrompt={enhancePrompt}
              slashMatches={slashMatches}
              slashIdx={slashIdx}
              setSlashIdx={setSlashIdx}
              runSlash={runSlash}
              sendKey={sendKey}
              attachments={attachments}
              onAddFiles={(f) => void addFiles(f)}
              onRemoveAttachment={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
              uploading={uploading}
            />
          </div>
        </div>
      )}
    </div>
  );
}
