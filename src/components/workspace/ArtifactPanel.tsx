"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText as FileTextIcon,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  MonitorPlay,
  Search,
  X,
} from "lucide-react";
import { useChatStore, MODE_LABELS, type UIImage } from "@/lib/store/chat";
import { cn } from "@/lib/utils";
import { SlideDeckView } from "./SlideDeckView";
import { ReportView } from "./ReportView";
import { DocView } from "./DocView";

function ImageGallery({ images }: { images: UIImage[] }) {
  const [zoom, setZoom] = useState<UIImage | null>(null);
  const downloadRef = useRef<HTMLAnchorElement>(null);

  const download = (img: UIImage) => {
    const a = downloadRef.current ?? document.createElement("a");
    a.href = img.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.download = `ai-image-${img.id}.png`;
    if (img.url.startsWith("data:")) a.click();
    else window.open(img.url, "_blank", "noopener");
  };

  return (
    <>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {[...images].reverse().map((img) => (
          <figure key={img.id} className="group overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
            <button onClick={() => setZoom(img)} className="block w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.prompt} className="w-full" />
            </button>
            <figcaption className="flex items-start justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="truncate text-xs text-stone-600">{img.prompt}</p>
                <p className="mt-0.5 text-[10px] text-stone-400">{img.model}</p>
              </div>
              <button
                onClick={() => download(img)}
                title="下载/打开"
                className="shrink-0 rounded-lg border border-stone-200 p-1.5 text-stone-500 transition hover:border-brand-300 hover:text-brand-600"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </figcaption>
          </figure>
        ))}
      </div>

      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8"
          onClick={() => setZoom(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom.url} alt={zoom.prompt} className="max-h-full max-w-full rounded-lg shadow-2xl" />
        </div>
      )}
    </>
  );
}

/**
 * 产物画布（Artifact Panel）—— OpenCanvas 式右侧栏。
 * - PPT 模式：完整幻灯片工作台（主题/编辑/导出）
 * - 其他模式：最近一条 AI 回复作为"文档"产物
 * 后续阶段：图片、视频、代码预览挂载在这里。
 * 
 * 默认关闭，有产物时自动弹出。
 */
const CANVAS_WIDTH: Record<string, string> = {
  narrow: "w-[24rem]",
  standard: "w-[30rem]",
  wide: "w-[38rem]",
};

export function ArtifactPanel() {
  const {
    conversations,
    activeId,
    sending,
    artifactOpen,
    autoOpenArtifact,
    setArtifactOpen,
    setCodePreview,
    canvasWidth,
  } = useChatStore();
  const convo = conversations.find((c) => c.id === activeId);
  const mode = convo?.mode ?? "chat";

  const lastAssistant = [...(convo?.messages ?? [])]
    .reverse()
    .find((m) => m.role === "assistant" && m.content && !m.error);

  // 检测是否有产物内容
  const hasArtifact = 
    (mode === "image" && (convo?.images?.length ?? 0) > 0) ||
    (mode === "research" && convo?.report) ||
    (mode === "docs" && convo?.doc) ||
    (mode === "slides" && convo?.deck) ||
    (mode === "chat" && (convo?.codePreview || lastAssistant));

  // 有产物时自动弹出（可在设置中关闭）
  useEffect(() => {
    if (autoOpenArtifact && hasArtifact && !artifactOpen) {
      setArtifactOpen(true);
    }
  }, [autoOpenArtifact, hasArtifact, artifactOpen, setArtifactOpen]);

  // 隐藏状态或无产物内容时不渲染
  if (!artifactOpen) {
    return null;
  }

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-l border-stone-200 bg-white",
        CANVAS_WIDTH[canvasWidth]
      )}
    >
      {/* 画布标题栏 */}
      <div className="flex shrink-0 items-center justify-between border-b border-stone-100 bg-gradient-to-r from-orange-50/60 to-transparent px-5 py-3">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-stone-800">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-sm shadow-orange-200">
            <LayoutDashboard className="h-3.5 w-3.5" />
          </span>
          AI 创作画布
        </h2>
        <button
          onClick={() => setArtifactOpen(false)}
          title="关闭画布"
          className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 图像画廊 */}
      {mode === "image" && (convo?.images?.length ?? 0) > 0 ? (
        <ImageGallery images={convo!.images!} />
      ) : mode === "image" && sending ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-stone-400">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-sm">正在生成图像…</p>
        </div>
      ) : mode === "image" ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center text-stone-400">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">
            <ImageIcon className="h-6 w-6" />
          </div>
          <p className="text-sm">在左侧描述你想要的画面<br />生成的图片会展示在这里</p>
        </div>
      ) : /* 深度研究报告 */
      mode === "research" && convo?.report ? (
        <ReportView report={convo.report} />
      ) : mode === "research" && convo?.researchStatus === "loading" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-stone-400">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-sm">{convo.researchMessage ?? "正在研究…"}</p>
          <p className="text-xs">深度研究通常需要 20~60 秒</p>
        </div>
      ) : mode === "research" ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center text-stone-400">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">
            <Search className="h-6 w-6" />
          </div>
          <p className="text-sm">在左侧输入研究主题<br />生成带引用的研究报告，可一键转 PPT</p>
        </div>
      ) : /* 文档工作台 */
      mode === "docs" && convo?.doc ? (
        <DocView doc={convo.doc} />
      ) : mode === "docs" && sending ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-stone-400">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-sm">AI 正在撰写文档…</p>
        </div>
      ) : mode === "docs" ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center text-stone-400">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">
            <FileTextIcon className="h-6 w-6" />
          </div>
          <p className="text-sm">在左侧描述要写的文档<br />生成后可在这里编辑、AI 续写、导出 Word</p>
        </div>
      ) : /* PPT 工作台 */
      mode === "slides" && convo?.deck ? (
        <SlideDeckView deck={convo.deck} />
      ) : mode === "slides" && convo?.deckStatus === "loading" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-stone-400">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-sm">{convo.deckMessage ?? "正在生成…"}</p>
          <p className="text-xs">PPT 生成通常需要 10~30 秒</p>
        </div>
      ) : mode === "slides" ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center text-stone-400">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <p className="text-sm">在左侧输入 PPT 主题<br />例如「AI 写作助手产品发布会」</p>
        </div>
      ) : /* 代码沙箱 */
      mode === "chat" && convo?.codePreview ? (
        <CodePreview
          html={convo.codePreview.html}
          lang={convo.codePreview.lang}
          onClose={() => setCodePreview(null)}
        />
      ) : lastAssistant ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <article className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-stone-400">
              <FileTextIcon className="h-3.5 w-3.5" />
              文档 · v1
            </div>
            <div className="whitespace-pre-wrap text-sm leading-7 text-stone-700">
              {lastAssistant.content}
              {lastAssistant.streaming && <span className="streaming-cursor" />}
            </div>
          </article>
        </div>
      ) : (
        <div className="flex flex-1 select-none flex-col items-center justify-center bg-[radial-gradient(70%_60%_at_50%_40%,rgba(255,183,148,0.10),transparent_70%)] px-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-rose-100 shadow-inner">
            <LayoutDashboard className="h-7 w-7 text-orange-400" />
          </div>
          <p className="text-[15px] font-medium text-stone-600">AI 创作画布已就绪</p>
          <p className="mt-2 text-[13px] leading-6 text-stone-400">
            对话生成的文档、PPT、图片与研究报告
            <br />
            会实时呈现在这里
          </p>
          <div className="mt-6 grid w-full gap-2">
            {["生成 PPT", "撰写文档", "AI 绘图"].map((t) => (
              <span
                key={t}
                className="rounded-xl border border-stone-200/80 bg-white/80 px-4 py-2.5 text-left text-xs text-stone-500 shadow-sm"
              >
                <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-gradient-to-r from-orange-400 to-red-400" />
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

/* ---------------- 代码沙箱 ---------------- */

function CodePreview({ html, lang, onClose }: { html: string; lang: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [runId, setRunId] = useState(0);

  const openInTab = () => {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 忽略 */
    }
  };

  const jsxLike = ["jsx", "react", "tsx"].includes(lang.toLowerCase());

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-stone-100 px-5 py-3">
        <h3 className="flex items-center gap-2 text-[13.5px] font-semibold text-stone-800">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <MonitorPlay className="h-4 w-4" />
          </span>
          代码沙箱 · 实时预览
          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-400 uppercase">{lang}</span>
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setRunId((v) => v + 1)}
            title="重新加载预览"
            className="rounded-lg px-2.5 py-1.5 text-[12px] text-stone-500 transition hover:bg-stone-100"
          >
            重新运行
          </button>
          <button
            onClick={() => void copy()}
            title="复制源码"
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] text-stone-500 transition hover:bg-stone-100"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "已复制" : "复制"}
          </button>
          <button
            onClick={openInTab}
            title="新窗口打开"
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] text-stone-500 transition hover:bg-stone-100"
          >
            <ExternalLink className="h-3.5 w-3.5" /> 新窗口
          </button>
          <button
            onClick={onClose}
            title="关闭预览"
            className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {jsxLike && (
        <p className="border-b border-amber-100 bg-amber-50 px-5 py-2 text-[11.5px] text-amber-700">
          JSX/React 源码无法在浏览器直接运行——请在对话中让 AI「输出纯 HTML 版本」即可在这里实时预览。
        </p>
      )}

      <div className="min-h-0 flex-1 bg-[#f5f2ee] p-3">
        <iframe
          key={runId}
          title="AI 代码沙箱预览"
          sandbox="allow-scripts allow-modals allow-forms allow-popups"
          srcDoc={html}
          className="h-full w-full rounded-xl border border-stone-200 bg-white shadow-inner"
        />
      </div>
    </div>
  );
}
