"use client";

import { useState } from "react";
import {
  BookOpen,
  Briefcase,
  GraduationCap,
  LineChart,
  Megaphone,
  Palette,
  Search,
  Video,
  X,
} from "lucide-react";
import {
  TEMPLATES,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type TemplateCategory,
} from "@/lib/templates";
import { useChatStore } from "@/lib/store/chat";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const CATEGORY_ICON: Record<TemplateCategory, ReactNode> = {
  marketing: <Megaphone className="h-4 w-4" />,
  research: <LineChart className="h-4 w-4" />,
  business: <Briefcase className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  edu: <GraduationCap className="h-4 w-4" />,
  creative: <Palette className="h-4 w-4" />,
};

export function TemplatesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const runTemplate = useChatStore((s) => s.runTemplate);
  const sending = useChatStore((s) => s.sending);
  const [cat, setCat] = useState<TemplateCategory | "all">("all");
  const [query, setQuery] = useState("");

  if (!open) return null;

  const list = TEMPLATES.filter(
    (t) =>
      (cat === "all" || t.category === cat) &&
      (query.trim()
        ? (t.label + t.desc + t.prompt).toLowerCase().includes(query.trim().toLowerCase())
        : true)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <BookOpen className="h-5 w-5 text-brand-600" /> 模板库
            </div>
            <div className="mt-0.5 text-xs text-stone-400">选一个场景，自动创建任务并生成内容</div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-stone-400 hover:bg-stone-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-stone-100 px-5 py-3">
          <div className="mb-3 flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-stone-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索模板，如「PPT」「海报」「研究」…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-stone-300"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <CatChip active={cat === "all"} onClick={() => setCat("all")}>
              全部
            </CatChip>
            {CATEGORY_ORDER.map((c) => (
              <CatChip key={c} active={cat === c} onClick={() => setCat(c)}>
                <span className="flex items-center gap-1">
                  {CATEGORY_ICON[c]} {CATEGORY_LABELS[c]}
                </span>
              </CatChip>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {list.length === 0 ? (
            <div className="py-16 text-center text-sm text-stone-400">没有匹配的模板</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((t) => (
                <button
                  key={t.id}
                  disabled={sending}
                  onClick={() => {
                    void runTemplate({ mode: t.mode, prompt: t.prompt });
                    onClose();
                  }}
                  className="group rounded-xl border border-stone-200 p-4 text-left transition hover:border-brand-300 hover:bg-brand-50/40 disabled:opacity-40"
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium text-stone-800">
                      <span className="text-brand-500">{CATEGORY_ICON[t.category]}</span>
                      {t.label}
                    </span>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-500 group-hover:bg-brand-100 group-hover:text-brand-700">
                      {CATEGORY_LABELS[t.category]}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-stone-400">{t.desc}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CatChip({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs transition",
        active ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
      )}
    >
      {children}
    </button>
  );
}
