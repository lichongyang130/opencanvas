"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Download,
  FileText as FileTextIcon,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  MessageCircle,
  Presentation,
  Share2,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { useChatStore, type UIDoc, type UIImage } from "@/lib/store/chat";
import type { SlideDeck } from "@/lib/slides/types";
import type { ResearchReport } from "@/lib/research/types";
import { toast } from "@/lib/store/toast";
import { Toaster } from "@/components/Toaster";
import { Markdown } from "@/components/workspace/Markdown";
import { ReportView } from "@/components/workspace/ReportView";
import { DocView } from "@/components/workspace/DocView";
import { cn } from "@/lib/utils";

interface SharedAgent {
  id: string;
  name: string;
  desc: string;
  category: string;
  emoji: string;
  system: string;
  starter: string;
  createdAt: number;
  updatedAt: number;
}

interface SharedTemplate {
  id: string;
  label: string;
  desc: string;
  category: string;
  mode: string;
  prompt: string;
  author: string;
}

interface SharedCase {
  code: string;
  templateId: string;
  label: string;
  prompt: string;
  values: Record<string, string>;
  output?: string;
  image?: string;
  source?: string;
}

type SharePayload =
  | { kind: "agent"; agent: SharedAgent }
  | { kind: "template"; template: SharedTemplate }
  | { kind: "case"; case: SharedCase }
  | { kind: "slides" | "docs" | "image" | "report"; data: Record<string, unknown> };

const KIND_LABEL: Record<string, string> = {
  agent: "共享智能体",
  template: "共享模板",
  case: "真实案例",
  slides: "PPT 演示文稿",
  docs: "文档产物",
  image: "图片作品",
  report: "研究报告",
};

/** 只读 PPT 预览（访客页：不进入画布编辑，可下载 PPTX） */
function DeckReadonly({ deck }: { deck: SlideDeck }) {
  const [page, setPage] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const s = deck.slides[page];

  const download = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/slides/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deck }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${deck.title || "幻灯片"}.pptx`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast("PPTX 已下载", "success");
    } catch {
      toast("导出失败，请重试", "error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl">
      {/* 页面预览 */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="min-h-[340px] p-8">
          {s ? (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-stone-400">
                {s.layout} · 第 {page + 1} / {deck.slides.length} 页
              </p>
              <h3 className="mt-2 font-serif text-2xl font-semibold text-stone-800">{s.title}</h3>
              {s.subtitle && <p className="mt-1 text-sm text-stone-500">{s.subtitle}</p>}
              {s.bullets && (
                <ul className="mt-4 space-y-1.5">
                  {s.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              {s.stats && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {s.stats.map((st, i) => (
                    <div key={i} className="rounded-xl bg-stone-50 p-4 text-center">
                      <p className="text-2xl font-bold text-brand-600">{st.value}</p>
                      <p className="mt-0.5 text-xs text-stone-500">{st.label}</p>
                    </div>
                  ))}
                </div>
              )}
              {s.timeline && (
                <ol className="mt-4 space-y-2">
                  {s.timeline.map((t, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-stone-600">
                      <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600">
                        {t.time}
                      </span>
                      {t.label}
                    </li>
                  ))}
                </ol>
              )}
              {s.quote && <blockquote className="mt-4 border-l-4 border-brand-300 pl-4 text-lg italic text-stone-700">“{s.quote}”</blockquote>}
              {s.process && (
                <ol className="mt-4 space-y-1.5">
                  {s.process.map((p, i) => (
                    <li key={i} className="text-sm text-stone-600">
                      <span className="mr-2 font-semibold text-brand-600">{i + 1}.</span>
                      {p}
                    </li>
                  ))}
                </ol>
              )}
              {s.compareRows && (
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-left text-xs text-stone-400">
                      <th className="py-1.5">{s.compareTitle ?? "对比项"}</th>
                      <th className="py-1.5">A</th>
                      <th className="py-1.5">B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.compareRows.map((r, i) => (
                      <tr key={i} className="border-b border-stone-100">
                        <td className="py-1.5 text-stone-500">{r.left}</td>
                        <td className="py-1.5 text-stone-700">{r.right}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {s.team && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {s.team.map((t, i) => (
                    <div key={i} className="rounded-xl border border-stone-100 p-3 text-center">
                      <p className="text-2xl">{t.emoji ?? "🙂"}</p>
                      <p className="mt-1 text-sm font-medium text-stone-700">{t.name}</p>
                      <p className="text-xs text-stone-400">{t.role}</p>
                    </div>
                  ))}
                </div>
              )}
              {s.note && (
                <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  📝 演讲者备注：{s.note}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-stone-400">该页为空</p>
          )}
        </div>
        {/* 翻页 */}
        <div className="flex items-center justify-between border-t border-stone-100 px-5 py-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-500 transition hover:bg-stone-50 disabled:opacity-40"
          >
            上一页
          </button>
          <span className="text-xs text-stone-400">{deck.slides.length} 页 · 主题 {deck.theme}</span>
          <button
            onClick={() => setPage((p) => Math.min(deck.slides.length - 1, p + 1))}
            disabled={page === deck.slides.length - 1}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-500 transition hover:bg-stone-50 disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => void download()}
          disabled={downloading}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white py-2.5 text-[13px] font-medium text-stone-600 transition hover:border-brand-300 disabled:opacity-60"
        >
          <Download className="h-4 w-4" /> {downloading ? "导出中…" : "下载 PPTX"}
        </button>
      </div>
    </div>
  );
}

export default function SharePage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const { startAgent, runTemplate, fillTemplate, hydrated } = useChatStore();
  const [data, setData] = useState<SharePayload | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetch(`/api/shares/${params.code}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("missing");
        const j = (await r.json()) as SharePayload & { error?: string };
        if (j.error) throw new Error("missing");
        setData(j);
        setState("ok");
      })
      .catch(() => setState("missing"));
  }, [params.code]);

  /** 复制产物到工作台：服务端建会话写产物 → 意图跳转 /chat */
  const importArtifact = async () => {
    if (!data || data.kind === "agent" || data.kind === "template" || data.kind === "case") return;
    setImporting(true);
    try {
      const r = await fetch(`/api/shares/${params.code}/import`, { method: "POST" });
      const j = (await r.json()) as { conversationId?: string; error?: string };
      if (!j.conversationId) throw new Error(j.error || "导入失败");
      try {
        sessionStorage.setItem(
          "oc:homeIntent",
          JSON.stringify({ type: "convo", id: j.conversationId, ts: Date.now() })
        );
      } catch {}
      toast("已复制到工作台，正在打开…", "success");
      router.push("/chat");
    } catch (err) {
      toast(err instanceof Error ? err.message : "导入失败，请重试", "error");
    } finally {
      setImporting(false);
    }
  };

  const handleUseAgent = async () => {
    if (data?.kind !== "agent") return;
    await startAgent({
      id: data.agent.id,
      name: data.agent.name,
      emoji: data.agent.emoji,
      system: data.agent.system,
      starter: data.agent.starter,
      builtin: false,
    });
    toast(`已载入「${data.agent.name}」，开始对话吧`, "success");
    router.push("/chat");
  };

  const handleUseTemplate = () => {
    if (data?.kind !== "template") return;
    void runTemplate({
      mode: (data.template.mode as never) ?? "chat",
      prompt: data.template.prompt,
    });
    toast(`已开始「${data.template.label}」`, "success");
    router.push("/chat");
  };

  const handleUseCase = () => {
    if (data?.kind !== "case") return;
    void fillTemplate({ mode: "chat", prompt: data.case.prompt });
    toast("已把案例填入输入框，确认后发送", "success");
    router.push("/chat");
  };

  const kind = data?.kind ?? "agent";
  const title =
    data?.kind === "agent"
      ? data.agent.name
      : data?.kind === "template"
        ? data.template.label
        : data?.kind === "case"
          ? data.case.label
          : data?.kind === "slides"
            ? ((data.data.deck as { title?: string } | undefined)?.title ?? "PPT 演示文稿")
            : data?.kind === "docs"
              ? ((data.data.doc as { title?: string } | undefined)?.title ?? "文档产物")
              : data?.kind === "image"
                ? ((data.data.title as string) ?? "图片作品")
                : data?.kind === "report"
                  ? ((data.data.report as { topic?: string } | undefined)?.topic ?? "研究报告")
                  : "";

  return (
    <div className="flex min-h-screen flex-col bg-[var(--oc-bg)] text-stone-800">
      {/* 顶栏 */}
      <header className="flex items-center justify-between border-b border-[var(--oc-border-soft)] bg-[var(--oc-bg)] px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500 text-[17px] text-white shadow-sm">
            {data?.kind === "agent" ? data.agent.emoji : data?.kind === "image" ? "🖼️" : data?.kind === "slides" ? "📊" : data?.kind === "report" ? "🔎" : data?.kind === "template" ? "✨" : "📄"}
          </span>
          <div>
            <p className="text-[15px] font-semibold text-stone-900">OpenCanvas</p>
            <p className="text-[11px] text-stone-400">{KIND_LABEL[kind] ?? "共享内容"}</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] text-stone-500 transition hover:bg-white hover:text-stone-700"
        >
          <ArrowLeft className="h-4 w-4" /> 返回首页
        </button>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 py-10">
        {state === "loading" && (
          <div className="mt-20 flex flex-col items-center text-stone-400">
            <Sparkles className="h-6 w-6 animate-pulse text-[var(--oc-brand-border)]" />
            <p className="mt-3 text-[13px]">正在加载共享内容…</p>
          </div>
        )}

        {state === "missing" && (
          <div className="mt-20 flex w-full max-w-md flex-col items-center rounded-2xl border border-[var(--oc-border)] bg-white px-8 py-14 text-center shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
              <X className="h-6 w-6" />
            </span>
            <p className="mt-4 text-[15px] font-semibold text-stone-700">分享不存在或已失效</p>
            <p className="mt-1.5 text-[12.5px] text-stone-400">该内容可能已被作者删除或取消了分享</p>
            <button
              onClick={() => router.push("/")}
              className="mt-5 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 px-5 py-2 text-[13px] font-medium text-white shadow-sm transition hover:brightness-105"
            >
              回到 OpenCanvas
            </button>
          </div>
        )}

        {state === "ok" && data && (
          <div className="w-full max-w-3xl">
            {/* 头部卡片 */}
            <div className="overflow-hidden rounded-2xl border border-[var(--oc-border)] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
              <div className="bg-gradient-to-br from-[var(--oc-brand-tint)] to-[var(--oc-bg)] px-7 pb-6 pt-7">
                <p className="text-[11px] font-medium uppercase tracking-wider text-stone-400">
                  {KIND_LABEL[kind]} · 公开只读
                </p>
                <h1 className="mt-1.5 text-[22px] font-semibold text-stone-900">{title}</h1>
                {data.kind === "agent" && (
                  <p className="mt-2 text-[13px] leading-6 text-stone-600">
                    {data.agent.desc || "一个被分享的 AI 智能体"}
                  </p>
                )}
                {data.kind === "template" && (
                  <p className="mt-2 text-[13px] leading-6 text-stone-600">
                    {data.template.desc} <span className="text-stone-400">· {data.template.author}</span>
                  </p>
                )}
                {data.kind === "case" && data.case.output && (
                  <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl border border-[var(--oc-border-soft)] bg-white/70 px-4 py-3 text-[12.5px] leading-5 text-stone-500">
                    {data.case.output}
                  </p>
                )}
              </div>

              {/* 内容区 */}
              <div className="space-y-4 px-7 py-5">
                {data.kind === "agent" && (
                  <>
                    <div className="flex items-center gap-4">
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[34px] shadow-sm">
                        {data.agent.emoji}
                      </span>
                      <div>
                        <span className="inline-block rounded-md bg-[var(--oc-brand-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--oc-brand)]">
                          {data.agent.category}
                        </span>
                      </div>
                    </div>
                    {data.agent.system && (
                      <div>
                        <p className="text-[12.5px] font-semibold text-stone-700">它如何工作</p>
                        <p className="mt-1.5 whitespace-pre-wrap rounded-xl border border-[var(--oc-border-soft)] bg-[var(--oc-hover)] px-3.5 py-3 text-[12.5px] leading-5 text-stone-500">
                          {data.agent.system}
                        </p>
                      </div>
                    )}
                    {data.agent.starter && (
                      <div>
                        <p className="text-[12.5px] font-semibold text-stone-700">开场白</p>
                        <p className="mt-1.5 rounded-xl border border-[var(--oc-border-soft)] bg-[var(--oc-hover)] px-3.5 py-3 text-[12.5px] text-stone-600">
                          “{data.agent.starter}”
                        </p>
                      </div>
                    )}
                  </>
                )}

                {data.kind === "template" && (
                  <div>
                    <p className="text-[12.5px] font-semibold text-stone-700">模板提示词</p>
                    <p className="mt-1.5 whitespace-pre-wrap rounded-xl border border-[var(--oc-border-soft)] bg-[var(--oc-hover)] px-3.5 py-3 text-[12.5px] leading-5 text-stone-500">
                      {data.template.prompt}
                    </p>
                  </div>
                )}

                {data.kind === "case" && data.case.image && (
                  <img
                    src={data.case.image}
                    alt={data.case.label}
                    className="w-full rounded-xl border border-[var(--oc-border-soft)]"
                  />
                )}

                {data.kind === "slides" && (
                  <DeckReadonly deck={data.data.deck as SlideDeck} />
                )}
                {data.kind === "docs" && <DocView doc={data.data.doc as UIDoc} />}
                {data.kind === "report" && <ReportView report={data.data.report as ResearchReport} />}
                {data.kind === "image" && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {(data.data.images as UIImage[])?.map((img) => (
                      <figure
                        key={img.id}
                        className="overflow-hidden rounded-xl border border-[var(--oc-border-soft)] bg-white shadow-sm"
                      >
                        <img src={img.url} alt={img.prompt} className="w-full" />
                        <figcaption className="truncate px-2 py-1.5 text-[10.5px] text-stone-400">
                          {img.model}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </div>

              {/* 底部操作 */}
              <div className="flex items-center gap-2 border-t border-[var(--oc-border-soft)] bg-[var(--oc-bg)] px-7 py-4">
                <button
                  onClick={() => router.push("/")}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--oc-border)] bg-white py-2.5 text-[13px] font-medium text-stone-600 transition hover:border-[var(--oc-brand-border)]"
                >
                  <LayoutDashboard className="h-4 w-4" /> 返回首页
                </button>

                {data.kind === "agent" && (
                  <button
                    onClick={() => void handleUseAgent()}
                    disabled={!hydrated}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 py-2.5 text-[13px] font-medium text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
                  >
                    <MessageCircle className="h-4 w-4" /> 立即使用
                  </button>
                )}

                {data.kind === "template" && (
                  <button
                    onClick={handleUseTemplate}
                    disabled={!hydrated}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 py-2.5 text-[13px] font-medium text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
                  >
                    <Wand2 className="h-4 w-4" /> 开始创作
                  </button>
                )}

                {data.kind === "case" && (
                  <button
                    onClick={handleUseCase}
                    disabled={!hydrated}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 py-2.5 text-[13px] font-medium text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
                  >
                    <Copy className="h-4 w-4" /> 做同款
                  </button>
                )}

                {(data.kind === "slides" || data.kind === "docs" || data.kind === "image" || data.kind === "report") && (
                  <button
                    onClick={() => void importArtifact()}
                    disabled={importing}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 py-2.5 text-[13px] font-medium text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
                  >
                    {importing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {importing ? "复制中…" : "复制到我的工作台"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
}
