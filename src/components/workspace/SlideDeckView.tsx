"use client";

import { useState } from "react";
import { Copy, Download, FileText, Loader2, MessageSquareText, Palette, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { THEME_LIST } from "@/lib/slides/themes";
import type { SlideDeck } from "@/lib/slides/types";
import { SlideView } from "./SlideView";
import { useChatStore } from "@/lib/store/chat";
import { toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export function SlideDeckView({ deck }: { deck: SlideDeck }) {
  const { tt } = useI18n();
  const { setDeckTheme, patchSlide, exportDeck, send, sending, generateSlideImages, rewriteSlide, addSlide, duplicateSlide, deleteSlide } =
    useChatStore();
  const [active, setActive] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [imaging, setImaging] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const idx = Math.min(active, deck.slides.length - 1);
  const needImg = deck.slides.filter((s) => s.imagePrompt && !s.imageUrl).length;

  const handleImages = async () => {
    setImaging(true);
    try {
      const n = await generateSlideImages();
      if (n > 0) toast(`已生成 ${n} 张配图`, "success");
    } finally {
      setImaging(false);
    }
  };

  const handleRewrite = async () => {
    setRewriting(true);
    try {
      await rewriteSlide(idx);
    } finally {
      setRewriting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportDeck();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex h-full flex-col print:!hidden">
      {/* 打印视图（导出 PDF）：隐藏于屏幕，打印时逐页输出 */}
      <div className="hidden print:block">
        {deck.slides.map((s, i) => (
          <div key={i} className="mb-[1.2cm] break-inside-avoid">
            <SlideView slide={s} themeId={deck.theme} index={i} editable={false} />
          </div>
        ))}
      </div>
      {/* 工具栏 */}
      <div className="border-b border-stone-200 px-4 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{deck.title}</div>
            <div className="text-xs text-stone-400">{deck.slides.length} 页 · 文字可直接点击编辑</div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => void send(`重新生成：${deck.title}`)}
              disabled={sending}
              className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs text-stone-600 hover:border-brand-300 disabled:opacity-40"
            >
              <RefreshCw className="h-3.5 w-3.5" /> 重新生成
            </button>
            {needImg > 0 && (
              <button
                onClick={() => void handleImages()}
                disabled={imaging || sending}
                className="flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-700 hover:border-sky-300 disabled:opacity-40"
              >
                {imaging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                AI 配图 {needImg}
              </button>
            )}
            <button
              onClick={() => window.print()}
              title={tt("导出 PDF（浏览器打印、另存为 PDF）")}
              className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs text-stone-600 hover:border-brand-300"
            >
              <FileText className="h-3.5 w-3.5" /> PDF
            </button>
            <button
              onClick={() => void handleExport()}
              disabled={exporting}
              className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-40"
            >
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              导出 PPTX
            </button>
          </div>
        </div>
        {/* 主题市场 */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <Palette className="h-3.5 w-3.5 text-stone-400" />
          {THEME_LIST.map((th) => (
            <button
              key={th.id}
              title={th.label}
              onClick={() => setDeckTheme(th.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] transition",
                deck.theme === th.id
                  ? "border-stone-800 bg-stone-800 font-medium text-white"
                  : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
              )}
            >
              <span
                className="h-3 w-3 rounded-full border border-black/10"
                style={{ background: th.primary }}
              />
              {th.label}
            </button>
          ))}
        </div>
      </div>

      {/* 主体：缩略图 + 大图 */}
      <div className="flex min-h-0 flex-1">
        <div className="w-28 shrink-0 space-y-2 overflow-y-auto border-r border-stone-100 p-2.5">
          {deck.slides.map((s, i) => (
            <div key={i} className="group/thumb relative">
              <button
                onClick={() => setActive(i)}
                className={cn(
                  "block w-full overflow-hidden rounded-md ring-2 transition",
                  i === idx ? "ring-brand-500" : "ring-transparent hover:ring-stone-200"
                )}
              >
                <SlideView slide={s} themeId={deck.theme} index={i} />
              </button>
              <div className="absolute right-1 top-1 hidden gap-0.5 group-hover/thumb:flex">
                <button
                  title={tt("复制该页")}
                  onClick={() => {
                    duplicateSlide(i);
                  }}
                  className="rounded bg-white/90 p-1 text-stone-500 shadow hover:text-brand-600"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <button
                  title={tt("删除该页")}
                  onClick={() => {
                    deleteSlide(i);
                    setActive((a) => Math.max(0, a - (i <= a ? 1 : 0)));
                  }}
                  className="rounded bg-white/90 p-1 text-stone-500 shadow hover:text-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={addSlide}
            className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-stone-300 py-2 text-xs text-stone-400 transition hover:border-brand-300 hover:text-brand-600"
          >
            <Plus className="h-3.5 w-3.5" /> 加一页
          </button>
        </div>
        <div className="min-w-0 flex-1 overflow-y-auto bg-stone-100 p-5">
          <div className="mx-auto max-w-2xl shadow-xl">
            <SlideView
              slide={deck.slides[idx]}
              themeId={deck.theme}
              index={idx}
              editable
              onPatch={(p) => patchSlide(idx, p)}
            />
          </div>
          {/* 演讲者备注 */}
          <div className="mx-auto mt-3 max-w-2xl rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-stone-400">
              <MessageSquareText className="h-3.5 w-3.5" /> 演讲者备注
              <span className="font-normal">{tt("（导出 PPTX / 打印时保留）")}</span>
            </div>
            <textarea
              value={deck.slides[idx]?.note ?? ""}
              onChange={(e) => patchSlide(idx, { note: e.target.value })}
              placeholder={tt("写本页演讲要点、时间控制、衔接词…")}
              rows={3}
              className="w-full resize-y rounded-lg border border-stone-200 bg-stone-50/60 px-3 py-2 text-[12.5px] leading-relaxed text-stone-600 outline-none transition focus:border-brand-300 focus:bg-white"
            />
          </div>
          <div className="mx-auto mt-4 flex max-w-2xl items-center justify-between text-xs text-stone-400">
            <span>第 {idx + 1} / {deck.slides.length} 页</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => duplicateSlide(idx)}
                className="flex items-center gap-1 rounded-md border border-stone-200 px-2 py-1 text-stone-600 transition hover:border-brand-300 hover:text-brand-600"
              >
                <Copy className="h-3 w-3" /> 复制本页
              </button>
              <button
                onClick={() => void handleRewrite()}
                disabled={rewriting || sending}
                title={tt("AI 用真实模型重写本页（需已配置 API Key）")}
                className="flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-stone-600 transition hover:border-sky-300 hover:text-sky-700 disabled:opacity-40"
              >
                {rewriting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-sky-500" />}
                AI 重写本页
              </button>
              <button
                onClick={() => {
                  deleteSlide(idx);
                  setActive((a) => Math.max(0, a - (idx <= a ? 1 : 0)));
                }}
                className="flex items-center gap-1 rounded-md border border-stone-200 px-2 py-1 text-stone-600 transition hover:border-red-300 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" /> 删除本页
              </button>
            </div>
            <span className="hidden lg:inline">{tt("点击文字可修改")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
