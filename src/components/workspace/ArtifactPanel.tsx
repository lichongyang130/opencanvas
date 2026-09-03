"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText as FileTextIcon,
  History,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  Loader2,
  Maximize,
  MonitorPlay,
  Palette,
  Pencil,
  Scissors,
  Search,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import { useChatStore, MODE_LABELS, type UIImage } from "@/lib/store/chat";
import { getOverrides } from "@/lib/settings";
import { toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";
import { SlideDeckView } from "./SlideDeckView";
import { ReportView } from "./ReportView";
import { DocView } from "./DocView";

/** 产物分享：生成公开只读链接并复制 */
async function shareArtifact(kind: "slides" | "docs" | "image" | "report", payload: Record<string, unknown>) {
  try {
    const r = await fetch("/api/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, data: payload }),
    });
    const j = (await r.json()) as { url?: string; error?: string };
    if (!j.url) throw new Error(j.error || "生成失败");
    await navigator.clipboard?.writeText(`${location.origin}${j.url}`);
    toast("分享链接已复制，任何人可查看（只读）", "success");
  } catch (err) {
    toast(err instanceof Error ? err.message : "分享失败，请重试", "error");
  }
}

function ImageGallery({ images }: { images: UIImage[] }) {
  const [zoom, setZoom] = useState<UIImage | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // 正在处理的图 id
  const downloadRef = useRef<HTMLAnchorElement>(null);
  const { addImages } = useChatStore();

  const download = (img: UIImage) => {
    const a = downloadRef.current ?? document.createElement("a");
    a.href = img.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.download = `ai-image-${img.id}.png`;
    if (img.url.startsWith("data:")) a.click();
    else window.open(img.url, "_blank", "noopener");
  };

  /** 图生图：以该图为参考生成变体（自动选模型：FLUX dev / 万相 i2i） */
  const createVariant = async (img: UIImage) => {
    const style = window.prompt("描述变体风格（留空 = 保持原图风格微调）", "");
    if (style === null) return;
    const prompt = style.trim() || `基于参考图生成风格一致的变体`;
    setBusy(img.id);
    try {
      const ov = getOverrides();
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "auto", prompt, size: "1024x1024", imageUrl: img.url, overrides: ov }),
      });
      const data = (await res.json()) as { url?: string; model?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "变体生成失败");
      const next: UIImage = {
        id: crypto.randomUUID(),
        prompt: `变体：${prompt}`,
        model: data.model ?? "auto",
        url: data.url,
        createdAt: Date.now(),
      };
      addImages([next]);
      toast(`已生成变体（${data.model}）`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "变体生成失败", "error");
    } finally {
      setBusy(null);
    }
  };

  /** 通用调用：POST /api/images 并把结果加入画廊 */
  const imageCall = async (img: UIImage, body: Record<string, unknown>) => {
    setBusy(img.id);
    try {
      const ov = getOverrides();
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, overrides: ov }),
      });
      const data = (await res.json()) as { url?: string; model?: string; error?: string; credits?: number };
      if (!res.ok || !data.url) throw new Error(data.error ?? "图像生成失败");
      const next: UIImage = {
        id: crypto.randomUUID(),
        prompt: String(body.label ?? body.prompt ?? "图像"),
        model: data.model ?? "auto",
        url: data.url,
        createdAt: Date.now(),
      };
      addImages([next]);
      toast(`已完成（${data.model}）${data.credits ? `，消耗 ${data.credits} 积分` : ""}`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "图像生成失败", "error");
    } finally {
      setBusy(null);
    }
  };

  /** 背景移除：优先服务端 remove.bg（需 KEY），否则本地 @imgly WASM（免费、模型从 CDN 加载） */
  const removeBg = async (img: UIImage) => {
    setBusy(img.id);
    try {
      let url: string | null = null;
      let src = "本地 AI";
      // 1) 服务端 remove.bg
      const res = await fetch("/api/images/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: img.url }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) {
        url = data.url;
        src = "remove.bg";
      } else {
        // 2) 客户端 @imgly（零配置）；外链先取 Blob 再处理（部分 CDN 支持跨域）
        const { removeBackground } = await import("@imgly/background-removal");
        let input: string | Blob = img.url;
        if (img.url.startsWith("http")) {
          try {
            const r = await fetch(img.url);
            if (r.ok) input = await r.blob();
          } catch {
            /* 跨域取图失败时仍尝试原 URL */
          }
        }
        const blob = (await removeBackground(input, {
          progress: () => { /* 需要时显示进度 */ },
        })) as Blob;
        url = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = () => reject(new Error("读取结果失败"));
          r.readAsDataURL(blob);
        });
        src = "本地 AI";
      }
      const next: UIImage = {
        id: crypto.randomUUID(),
        prompt: `${img.prompt}（去背景）`,
        model: "remove-bg",
        url,
        createdAt: Date.now(),
      };
      addImages([next]);
      toast(`背景已移除（${src}）`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "背景移除失败", "error");
    } finally {
      setBusy(null);
    }
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
            <figcaption className="p-3">
              <div className="flex items-start justify-between gap-2">
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
              </div>
              {/* 图片工具行 */}
              <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-stone-100 pt-2">
                <button
                  onClick={() => void createVariant(img)}
                  disabled={busy === img.id}
                  title="以该图为参考生成变体"
                  className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-[10.5px] text-stone-500 transition hover:bg-sky-50 hover:text-sky-600 disabled:opacity-40"
                >
                  {busy === img.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} 变体
                </button>
                <button
                  onClick={() => {
                    const cmd = window.prompt("输入编辑指令（如：把背景换成沙滩 / 去掉路人）", "");
                    if (cmd?.trim()) {
                      void imageCall(img, {
                        model: "wanx2.1-imageedit",
                        functionName: "description_edit",
                        prompt: cmd.trim(),
                        imageUrl: img.url,
                        size: "1024x1024",
                        label: `编辑：${cmd.trim()}`,
                      });
                    }
                  }}
                  disabled={busy === img.id}
                  title="AI 指令编辑（万相 imageedit，需 DASHSCOPE_KEY）"
                  className="rounded-lg px-1.5 py-1 text-[10.5px] text-stone-500 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40"
                >
                  <Pencil className="mr-0.5 inline h-3 w-3" /> 编辑
                </button>
                <button
                  onClick={() => {
                    const dir = window.prompt("扩展方向：四周 / 上 / 下 / 左 / 右", "四周");
                    if (!dir?.trim()) return;
                    const d = dir.trim();
                    const scales =
                      d.includes("上") || d.includes("左") || d.includes("右") || d.includes("下")
                        ? d.includes("上") && !["左", "右", "下"].some((x) => d.includes(x))
                          ? { top: 1.5 }
                          : d.includes("下") && !["左", "右", "上"].some((x) => d.includes(x))
                            ? { bottom: 1.5 }
                            : d.includes("左") && !["右", "上", "下"].some((x) => d.includes(x))
                              ? { left: 1.5 }
                              : d.includes("右") && !["左", "上", "下"].some((x) => d.includes(x))
                                ? { right: 1.5 }
                                : { top: 1.5, bottom: 1.5, left: 1.5, right: 1.5 }
                        : { top: 1.5, bottom: 1.5, left: 1.5, right: 1.5 };
                    void imageCall(img, {
                      model: "wanx2.1-imageedit",
                      functionName: "expand",
                      prompt: `${d}扩展画面，保持原图主体与风格`,
                      imageUrl: img.url,
                      size: "1024x1024",
                      scales,
                      label: `扩图：${d}`,
                    });
                  }}
                  disabled={busy === img.id}
                  title="智能扩图（万相 expand）"
                  className="rounded-lg px-1.5 py-1 text-[10.5px] text-stone-500 transition hover:bg-teal-50 hover:text-teal-600 disabled:opacity-40"
                >
                  <Maximize className="mr-0.5 inline h-3 w-3" /> 扩图
                </button>
                <button
                  onClick={() => {
                    const style = window.prompt("输入目标风格（如：水彩 / 赛博朋克 / 法式绘本）", "水彩");
                    if (style?.trim()) {
                      void imageCall(img, {
                        model: "wanx2.1-imageedit",
                        functionName: "stylization_all",
                        prompt: `转换成${style.trim()}风格`,
                        imageUrl: img.url,
                        size: "1024x1024",
                        label: `风格化：${style.trim()}`,
                      });
                    }
                  }}
                  disabled={busy === img.id}
                  title="风格化重绘（万相 stylization_all）"
                  className="rounded-lg px-1.5 py-1 text-[10.5px] text-stone-500 transition hover:bg-fuchsia-50 hover:text-fuchsia-600 disabled:opacity-40"
                >
                  <Palette className="mr-0.5 inline h-3 w-3" /> 风格
                </button>
                <button
                  onClick={() => {
                    if (!window.confirm("以该图为参考，串行生成 3 个视角（正面 / 侧面 / 俯视）？")) return;
                    void (async () => {
                      setBusy(img.id);
                      const views = ["正面", "侧面", "俯视"];
                      try {
                        for (const v of views) {
                          await imageCall(img, {
                            model: "auto",
                            prompt: `保持参考图的同一主体与风格，生成${v}视角的完整画面`,
                            imageUrl: img.url,
                            size: "1024x1024",
                            label: `组图-${v}`,
                          });
                        }
                      } finally {
                        setBusy(null);
                      }
                    })();
                  }}
                  disabled={busy === img.id}
                  title="同款组图：同一主体多视角（串行 3 张）"
                  className="rounded-lg px-1.5 py-1 text-[10.5px] text-stone-500 transition hover:bg-amber-50 hover:text-amber-600 disabled:opacity-40"
                >
                  <Layers className="mr-0.5 inline h-3 w-3" /> 组图
                </button>
                <button
                  onClick={() => void removeBg(img)}
                  disabled={busy === img.id}
                  title="去除背景（remove.bg 或本地 AI）"
                  className="rounded-lg px-1.5 py-1 text-[10.5px] text-stone-500 transition hover:bg-violet-50 hover:text-violet-600 disabled:opacity-40"
                >
                  <Scissors className="mr-0.5 inline h-3 w-3" /> 去背景
                </button>
              </div>
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
        "max-md:fixed max-md:inset-0 max-md:z-40 max-md:w-full max-md:border-l-0",
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
        <div className="flex items-center gap-1">
          {convo &&
            ((mode === "image" && (convo.images?.length ?? 0) > 0) ||
              (mode === "slides" && convo.deck) ||
              (mode === "docs" && convo.doc) ||
              (mode === "research" && convo.report)) && (
              <button
                onClick={() => {
                  if (mode === "slides" && convo?.deck) {
                    void shareArtifact("slides", { deck: convo.deck, title: convo.deck.title });
                  } else if (mode === "docs" && convo?.doc) {
                    void shareArtifact("docs", { doc: convo.doc, title: convo.doc.title });
                  } else if (mode === "image" && convo?.images) {
                    void shareArtifact("image", { images: convo.images, title: convo.title });
                  } else if (mode === "research" && convo?.report) {
                    void shareArtifact("report", { report: convo.report, title: convo.report.topic });
                  }
                }}
                title="生成公开只读链接（复制后可分享给任何人）"
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] text-stone-500 transition hover:bg-stone-100 hover:text-brand-600"
              >
                <Share2 className="h-3.5 w-3.5" /> 分享
              </button>
            )}
          <button
            onClick={() => setArtifactOpen(false)}
            title="关闭画布"
            className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
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
      ) : /* 代码沙箱（多产物 Tab：代码预览 ↔ 对话文档） */
      mode === "chat" && convo?.codePreview && lastAssistant ? (
        <ChatArtifacts
          code={
            <CodePreview
              html={convo.codePreview.html}
              lang={convo.codePreview.lang}
              history={convo.codePreview.history ?? []}
              onClose={() => setCodePreview(null)}
            />
          }
          doc={
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <article className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium text-stone-400">
                  <FileTextIcon className="h-3.5 w-3.5" />
                  最新回复
                </div>
                <div className="whitespace-pre-wrap text-sm leading-7 text-stone-700">
                  {lastAssistant.content}
                  {lastAssistant.streaming && <span className="streaming-cursor" />}
                </div>
              </article>
            </div>
          }
        />
      ) : mode === "chat" && convo?.codePreview ? (
        <CodePreview
          html={convo.codePreview.html}
          lang={convo.codePreview.lang}
          history={convo.codePreview.history ?? []}
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

/** 聊天产物多 Tab：代码沙箱预览 ↔ 最新回复文档 */
function ChatArtifacts({ code, doc }: { code: React.ReactNode; doc: React.ReactNode }) {
  const [tab, setTab] = useState<"code" | "doc">("code");
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-1 border-b border-stone-100 px-4 py-1.5">
        <button
          onClick={() => setTab("code")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium transition",
            tab === "code" ? "bg-brand-50 text-brand-700" : "text-stone-500 hover:bg-stone-100"
          )}
        >
          <MonitorPlay className="h-3.5 w-3.5" /> 代码预览
        </button>
        <button
          onClick={() => setTab("doc")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium transition",
            tab === "doc" ? "bg-brand-50 text-brand-700" : "text-stone-500 hover:bg-stone-100"
          )}
        >
          <FileTextIcon className="h-3.5 w-3.5" /> 对话产物
        </button>
      </div>
      {tab === "code" ? code : doc}
    </div>
  );
}

function CodePreview({
  html,
  lang,
  history,
  onClose,
}: {
  html: string;
  lang: string;
  history: { html: string; lang: string; createdAt: number }[];
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [runId, setRunId] = useState(0);
  const [histOpen, setHistOpen] = useState(false);
  const [viewing, setViewing] = useState<{ html: string; lang: string; createdAt: number } | null>(null);
  const current = viewing ?? { html, lang, createdAt: Date.now() }; // 始终展示选中版本

  const openInTab = () => {
    const blob = new Blob([current.html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(current.html);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 忽略 */
    }
  };

  const jsxLike = ["jsx", "react", "tsx"].includes(current.lang.toLowerCase());

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
          {history.length > 0 && (
            <button
              onClick={() => setHistOpen((v) => !v)}
              title="版本历史"
              className={cn(
                "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] transition hover:bg-stone-100",
                histOpen ? "bg-stone-100 text-stone-700" : "text-stone-500"
              )}
            >
              <History className="h-3.5 w-3.5" /> 历史 {history.length}
            </button>
          )}
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

      {history.length > 0 && (
        <div className="flex items-center gap-1.5 border-b border-stone-100 px-5 py-2">
          <History className="h-3.5 w-3.5 text-stone-400" />
          <span className="text-[11px] text-stone-400">版本历史</span>
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => { setViewing(null); setHistOpen(false); }}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10.5px] transition",
                !viewing ? "bg-brand-50 font-medium text-brand-700" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
              )}
            >
              当前
            </button>
            {history.map((h, i) => (
              <button
                key={h.createdAt}
                onClick={() => { setViewing(h); setHistOpen(false); }}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10.5px] transition",
                  viewing?.createdAt === h.createdAt ? "bg-brand-50 font-medium text-brand-700" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                )}
              >
                v{history.length - i}
              </button>
            ))}
          </div>
          {viewing && (
            <button
              onClick={() => {
                setViewing(null);
                setHistOpen(false);
              }}
              className="ml-auto rounded-full px-2 py-0.5 text-[10.5px] text-stone-400 hover:text-stone-600"
            >
              恢复最新
            </button>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1 bg-[#f5f2ee] p-3">
        {histOpen ? (
          <div className="mx-auto max-w-md space-y-1.5 rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
            <p className="text-[11.5px] font-medium text-stone-500">选择要查看的版本</p>
            {history.map((h, i) => (
              <button
                key={h.createdAt}
                onClick={() => { setViewing(h); setHistOpen(false); }}
                className="flex w-full items-center justify-between rounded-lg border border-stone-100 px-3 py-2 text-left transition hover:border-brand-300"
              >
                <span className="text-xs text-stone-600">v{history.length - i} · {h.lang}</span>
                <span className="text-[10.5px] text-stone-400">{new Date(h.createdAt).toLocaleTimeString("zh-CN")}</span>
              </button>
            ))}
          </div>
        ) : (
          <iframe
            key={runId}
            title="AI 代码沙箱预览"
            sandbox="allow-scripts allow-modals allow-forms allow-popups"
            srcDoc={current.html}
            className="h-full w-full rounded-xl border border-stone-200 bg-white shadow-inner"
          />
        )}
      </div>
    </div>
  );
}
