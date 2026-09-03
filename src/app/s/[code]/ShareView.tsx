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
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { useChatStore, type UIDoc, type UIImage } from "@/lib/store/chat";
import type { SlideDeck } from "@/lib/slides/types";
import type { ResearchReport } from "@/lib/research/types";
import { toast } from "@/lib/store/toast";
import { Toaster } from "@/components/Toaster";
import { DocView } from "@/components/workspace/DocView";
import { ReportView } from "@/components/workspace/ReportView";
import { KIND_LABEL, type SharePayload } from "@/lib/share-types";
import { cn } from "@/lib/utils";

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
              {s.quote && (
                <blockquote className="mt-4 border-l-4 border-brand-300 pl-4 text-lg italic text-stone-700">
                  “{s.quote}”
                </blockquote>
              )}
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
                <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">📝 演讲者备注：{s.note}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-stone-400">该页为空</p>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-stone-100 px-5 py-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-500 transition hover:bg-stone-50 disabled:opacity-40"
          >
            上一页
          </button>
          <span className="text-xs text-stone-400">
            {deck.slides.length} 页 · 主题 {deck.theme}
          </span>
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

export default function ShareView({ code, initial }: { code: string; initial: SharePayload | null }) {
  const router = useRouter();
  const { startAgent, runTemplate, fillTemplate, hydrated } = useChatStore();
  const [data, setData] = useState<SharePayload | null>(initial);
  const [state, setState] = useState<"loading" | "ok" | "missing">(initial ? "ok" : "loading");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetch(`/api/shares/${code}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("missing");
        const j = (await r.json()) as SharePayload & { error?: string };
        if (j.error) throw new Error("missing");
        setData(j);
        setState("ok");
      })
      .catch(() => setState((s) => (s === "ok" ? s : "missing")));
  }, [code]);

  const importArtifact = async () => {
    if (!data || !["slides", "docs", "image", "report"].includes(data.kind)) return;
    setImporting(true);
    try {
      const r = await fetch(`/api/shares/${code}/import`, { method: "POST" });
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
      id: (data.data.id as string) ?? "shared",
      name: data.data.name as string,
      emoji: data.data.emoji as string,
      system: data.data.system as string,
      starter: data.data.starter as string,
      builtin: false,
    });
    toast(`已载入「${data.data.name}」，开始对话吧`, "success");
    router.push("/chat");
  };

  const handleUseTemplate = () => {
    if (data?.kind !== "template") return;
    void runTemplate({
      mode: (data.data.mode as never) ?? "chat",
      prompt: data.data.prompt as string,
    });
    toast(`已开始「${data.data.label}」`, "success");
    router.push("/chat");
  };

  const handleUseCase = () => {
    if (data?.kind !== "case") return;
    void fillTemplate({ mode: "chat", prompt: data.data.prompt as string });
    toast("已把案例填入输入框，确认后发送", "success");
    router.push("/chat");
  };

  const kind = data?.kind ?? "agent";
  const icon =
    data?.kind === "agent"
      ? (data.data.emoji as string) ?? "🤖"
      : data?.kind === "image"
        ? "🖼️"
        : data?.kind === "slides"
          ? "📊"
          : data?.kind === "report"
            ? "🔎"
            : data?.kind === "template"
              ? "✨"
              : "📄";

  return (
    <div className="flex min-h-screen flex-col bg-[var(--oc-bg)] text-stone-800">
      <header className="flex items-center justify-between border-b border-[var(--oc-border-soft)] bg-[var(--oc-bg)] px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500 text-[17px] text-white shadow-sm">
            {icon}
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
            <div className="overflow-hidden rounded-2xl border border-[var(--oc-border)] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
              <div className="bg-gradient-to-br from-[var(--oc-brand-tint)] to-[var(--oc-bg)] px-7 pb-6 pt-7">
                <p className="text-[11px] font-medium uppercase tracking-wider text-stone-400">
                  {KIND_LABEL[kind]} · 公开只读
                </p>
                <h1 className="mt-1.5 text-[22px] font-semibold text-stone-900">{data.title}</h1>
                {data.description && <p className="mt-2 text-[13px] leading-6 text-stone-600">{data.description}</p>}
              </div>

              <div className="space-y-4 px-7 py-5">
                {data.kind === "agent" && (
                  <>
                    <div className="flex items-center gap-4">
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[34px] shadow-sm">
                        {data.data.emoji as React.ReactNode}
                      </span>
                      <span className="inline-block rounded-md bg-[var(--oc-brand-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--oc-brand)]">
                        {data.data.category as React.ReactNode}
                      </span>
                    </div>
                    {data.data.system && (
                      <div>
                        <p className="text-[12.5px] font-semibold text-stone-700">它如何工作</p>
                        <p className="mt-1.5 whitespace-pre-wrap rounded-xl border border-[var(--oc-border-soft)] bg-[var(--oc-hover)] px-3.5 py-3 text-[12.5px] leading-5 text-stone-500">
                          {String(data.data.system ?? "")}
                        </p>
                      </div>
                    )}
                    {data.data.starter && (
                      <div>
                        <p className="text-[12.5px] font-semibold text-stone-700">开场白</p>
                        <p className="mt-1.5 rounded-xl border border-[var(--oc-border-soft)] bg-[var(--oc-hover)] px-3.5 py-3 text-[12.5px] text-stone-600">
                          “{data.data.starter as string}”
                        </p>
                      </div>
                    )}
                  </>
                )}

                {data.kind === "template" && (
                  <div>
                    <p className="text-[12.5px] font-semibold text-stone-700">模板提示词</p>
                    <p className="mt-1.5 whitespace-pre-wrap rounded-xl border border-[var(--oc-border-soft)] bg-[var(--oc-hover)] px-3.5 py-3 text-[12.5px] leading-5 text-stone-500">
                      {data.data.prompt as string}
                    </p>
                  </div>
                )}

                {data.kind === "case" && Boolean(data.data.image) && (
                   
                  <img src={data.data.image as string} alt={data.title} className="w-full rounded-xl border border-[var(--oc-border-soft)]" />
                )}

                {data.kind === "slides" && <DeckReadonly deck={data.data.deck as SlideDeck} />}
                {data.kind === "docs" && <DocView doc={data.data.doc as UIDoc} />}
                {data.kind === "report" && <ReportView report={data.data.report as ResearchReport} />}
                {data.kind === "image" && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {(data.data.images as UIImage[])?.map((img) => (
                      <figure
                        key={img.id}
                        className="overflow-hidden rounded-xl border border-[var(--oc-border-soft)] bg-white shadow-sm"
                      >
                        { }
                        <img src={img.url} alt={img.prompt} className="w-full" />
                        <figcaption className="truncate px-2 py-1.5 text-[10.5px] text-stone-400">{img.model}</figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </div>

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

                {["slides", "docs", "image", "report"].includes(data.kind) && (
                  <button
                    onClick={() => void importArtifact()}
                    disabled={importing}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 py-2.5 text-[13px] font-medium text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
                  >
                    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
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
