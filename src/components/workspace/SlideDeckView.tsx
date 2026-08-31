"use client";

import { useState } from "react";
import { Copy, Download, Loader2, Palette, Plus, RefreshCw, Trash2 } from "lucide-react";
import { THEME_LIST } from "@/lib/slides/themes";
import type { SlideDeck } from "@/lib/slides/types";
import { SlideView } from "./SlideView";
import { useChatStore } from "@/lib/store/chat";
import { cn } from "@/lib/utils";

export function SlideDeckView({ deck }: { deck: SlideDeck }) {
  const { setDeckTheme, patchSlide, exportDeck, send, sending, addSlide, duplicateSlide, deleteSlide } =
    useChatStore();
  const [active, setActive] = useState(0);
  const [exporting, setExporting] = useState(false);
  const idx = Math.min(active, deck.slides.length - 1);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportDeck();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
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
        {/* 主题切换 */}
        <div className="mt-2.5 flex items-center gap-2">
          <Palette className="h-3.5 w-3.5 text-stone-400" />
          <div className="flex items-center gap-1.5">
            {THEME_LIST.map((th) => (
              <button
                key={th.id}
                title={th.label}
                onClick={() => setDeckTheme(th.id)}
                className={cn(
                  "h-5 w-5 rounded-full border-2 transition",
                  deck.theme === th.id ? "border-stone-800 scale-110" : "border-white shadow"
                )}
                style={{ background: th.primary }}
              />
            ))}
          </div>
          <span className="text-xs text-stone-400">
            {THEME_LIST.find((t) => t.id === deck.theme)?.label}
          </span>
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
                  title="复制该页"
                  onClick={() => {
                    duplicateSlide(i);
                  }}
                  className="rounded bg-white/90 p-1 text-stone-500 shadow hover:text-brand-600"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <button
                  title="删除该页"
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
                onClick={() => {
                  deleteSlide(idx);
                  setActive((a) => Math.max(0, a - (idx <= a ? 1 : 0)));
                }}
                className="flex items-center gap-1 rounded-md border border-stone-200 px-2 py-1 text-stone-600 transition hover:border-red-300 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" /> 删除本页
              </button>
            </div>
            <span className="hidden lg:inline">点击文字可修改</span>
          </div>
        </div>
      </div>
    </div>
  );
}
