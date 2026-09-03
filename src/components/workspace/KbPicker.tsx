"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Check, ChevronDown, X } from "lucide-react";
import { toast } from "@/lib/store/toast";
import { useI18n } from "@/lib/i18n";

interface KbItem {
  id: string;
  name: string;
  desc: string;
  docCount: number;
}

/**
 * 工作台知识库选择器：
 * 选中后当前会话发送消息时自动 RAG 检索该库并注入上下文（store.send 内实现）。
 */
export default function KbPicker({ value, onChange }: { value?: string; onChange: (id: string | null) => void }) {
  const { tt } = useI18n();
  const [open, setOpen] = useState(false);
  const [kbs, setKbs] = useState<KbItem[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await fetch("/api/knowledge").then((r) => r.json())) as { bases?: KbItem[] };
      // 只显示已启用检索能力的库
      setKbs(data.bases ?? []);
      if ((data.bases ?? []).length > 0) setLoading(false);
    } catch {
      /* 忽略 */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const current = kbs.find((k) => k.id === value);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          if (kbs.length === 0) void load();
          setOpen((v) => !v);
        }}
        title={tt("绑定知识库：发送消息时自动检索相关内容")}
        className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-medium transition ${
          value
            ? "border-[var(--oc-brand-border)] bg-[var(--oc-brand-tint)] text-[var(--oc-brand)]"
            : "border-[var(--oc-border)] bg-white text-stone-500 hover:border-[var(--oc-brand-border)] hover:text-[var(--oc-brand)]"
        }`}
      >
        <BookOpen className="h-3.5 w-3.5" />
        <span className="max-w-[140px] truncate">{value ? current?.name ?? tt("知识库") : tt("绑定知识库")}</span>
        {value ? (
          <X
            className="h-3 w-3 opacity-60 transition hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
              toast(tt("已解除知识库绑定"), "info");
            }}
          />
        ) : (
          <ChevronDown className="h-3 w-3 opacity-60" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-40 w-[260px] overflow-hidden rounded-xl border border-[var(--oc-border)] bg-white py-1 shadow-xl">
          <p className="px-3 pb-1 pt-2 text-[10.5px] font-medium uppercase tracking-wide text-stone-400">
            选择知识库（发送时自动检索）
          </p>

          {kbs.length === 0 && (
            <div className="px-3 py-4 text-center text-[11.5px] text-stone-400">
              {loading ? tt("加载中…") : tt("还没有知识库")}
              <a href="/knowledge" className="mt-1 block text-[var(--oc-brand)] hover:underline">
                去知识库创建 →
              </a>
            </div>
          )}

          {kbs.map((k) => (
            <button
              key={k.id}
              onClick={() => {
                onChange(k.id);
                setOpen(false);
                toast(`已绑定知识库「${k.name}」，发送消息时将自动检索`, "success");
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-[var(--oc-hover)]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <BookOpen className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-medium text-stone-700">{k.name}</span>
                <span className="block text-[10.5px] text-stone-400">{k.docCount} 个文档</span>
              </span>
              {value === k.id && <Check className="h-4 w-4 shrink-0 text-[var(--oc-brand)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
