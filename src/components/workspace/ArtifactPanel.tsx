"use client";

import { useEffect, useRef, useState } from "react";
import {
  Download,
  FileText as FileTextIcon,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useChatStore, type UIImage } from "@/lib/store/chat";
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
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
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
export function ArtifactPanel({
  conversationId,
  onClose,
}: {
  conversationId?: string;
  /** 外部控制显隐时传入（例如首页用本地状态控制抽屉） */
  onClose?: () => void;
} = {}) {
  const { conversations, activeId, sending, artifactOpen, artifactDismissed, setArtifactOpen } =
    useChatStore();
  // conversationId：外部指定要看的会话（首页等场景）；不传则跟随当前会话
  const convo = conversations.find((c) => c.id === (conversationId ?? activeId));
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
    (mode === "chat" && lastAssistant);

  // 有产物时自动弹出（但用户手动收起后不再强行弹出，直到下一次生成/切换会话）
  useEffect(() => {
    if (hasArtifact && !artifactOpen && !artifactDismissed) {
      setArtifactOpen(true);
    }
  }, [hasArtifact, artifactOpen, artifactDismissed, setArtifactOpen]);

  // 隐藏状态或无产物内容时不渲染
  if (!artifactOpen) {
    return null;
  }

  return (
    <aside className="absolute inset-y-0 right-0 z-30 flex w-full shrink-0 flex-col border-l border-stone-200 bg-white shadow-2xl sm:static sm:w-[26rem] sm:shadow-none lg:w-[30rem]">
      {/* 画布标题栏 */}
      <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-stone-800">
          <LayoutDashboard className="h-4 w-4 text-orange-500" />
          AI 创作画布
        </h2>
        <button
          onClick={() => (onClose ? onClose() : setArtifactOpen(false))}
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
      ) : lastAssistant ? (
        <div className="flex-1 overflow-y-auto p-5">
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
        <div className="flex flex-1 flex-col items-center justify-center text-center text-stone-400">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <p className="text-sm">
            AI 生成的文档、PPT、图片、视频
            <br />
            会实时呈现在这里
          </p>
        </div>
      )}
    </aside>
  );
}
