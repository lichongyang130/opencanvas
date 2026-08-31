"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Columns2,
  Copy,
  Download,
  Eye,
  FileText,
  Loader2,
  Pencil,
  Wand2,
} from "lucide-react";
import { useChatStore, type UIDoc } from "@/lib/store/chat";
import { Markdown } from "./Markdown";
import { downloadMarkdown, downloadWord } from "@/lib/docs/export";
import { toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";

type Mode = "edit" | "preview" | "split";

const AI_OPS: { id: "continue" | "polish" | "shorten" | "expand" | "fix"; label: string }[] = [
  { id: "continue", label: "续写" },
  { id: "polish", label: "润色" },
  { id: "expand", label: "扩写" },
  { id: "shorten", label: "精简" },
  { id: "fix", label: "纠错" },
];

export function DocView({ doc }: { doc: UIDoc }) {
  const { setDoc, aiDoc, docBusy } = useChatStore();
  const [mode, setMode] = useState<Mode>("split");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onChange = (content: string) => {
    setDoc({ ...doc, content });
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaved(true);
    }, 900);
  };

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const copy = async () => {
    await navigator.clipboard?.writeText(doc.content);
    setCopied(true);
    toast("已复制 Markdown", "success");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex h-full flex-col">
      {/* 工具栏 */}
      <div className="border-b border-stone-200 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-brand-600" />
            <input
              value={doc.title}
              onChange={(e) => setDoc({ ...doc, title: e.target.value })}
              className="min-w-0 flex-1 truncate bg-transparent text-sm font-semibold outline-none"
            />
            <span className="shrink-0 text-[11px] text-stone-400">
              {docBusy ? (
                <span className="flex items-center gap-1 text-brand-600">
                  <Loader2 className="h-3 w-3 animate-spin" /> AI 处理中
                </span>
              ) : saved ? (
                "已自动保存"
              ) : (
                "编辑中"
              )}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <div className="flex items-center rounded-lg border border-stone-200 p-0.5">
              {(
                [
                  { m: "edit", icon: <Pencil className="h-3.5 w-3.5" />, t: "编辑" },
                  { m: "split", icon: <Columns2 className="h-3.5 w-3.5" />, t: "分屏" },
                  { m: "preview", icon: <Eye className="h-3.5 w-3.5" />, t: "预览" },
                ] as const
              ).map((b) => (
                <button
                  key={b.m}
                  title={b.t}
                  onClick={() => setMode(b.m)}
                  className={cn(
                    "rounded-md p-1.5 transition",
                    mode === b.m ? "bg-brand-600 text-white" : "text-stone-500 hover:bg-stone-100"
                  )}
                >
                  {b.icon}
                </button>
              ))}
            </div>
            <button
              title="复制"
              onClick={() => void copy()}
              className="rounded-lg border border-stone-200 p-1.5 text-stone-500 transition hover:border-brand-300 hover:text-brand-600"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              title="导出 Word"
              onClick={() => {
                downloadWord(doc.title, doc.content);
                toast("已导出 Word", "success");
              }}
              className="flex items-center gap-1 rounded-lg border border-stone-200 px-2 py-1.5 text-xs text-stone-600 transition hover:border-brand-300 hover:text-brand-600"
            >
              <Download className="h-3.5 w-3.5" /> Word
            </button>
            <button
              title="导出 Markdown"
              onClick={() => {
                downloadMarkdown(doc.title, doc.content);
                toast("已导出 Markdown", "success");
              }}
              className="rounded-lg bg-brand-600 p-1.5 text-white transition hover:bg-brand-700"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {/* AI 操作条 */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Wand2 className="h-3.5 w-3.5 text-brand-500" />
          {AI_OPS.map((op) => (
            <button
              key={op.id}
              disabled={docBusy}
              onClick={() => void aiDoc(op.id)}
              className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] text-brand-700 transition hover:bg-brand-100 disabled:opacity-40"
            >
              AI {op.label}
            </button>
          ))}
        </div>
      </div>

      {/* 编辑/预览 */}
      <div className="flex min-h-0 flex-1">
        {(mode === "edit" || mode === "split") && (
          <textarea
            value={doc.content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="用 Markdown 写文档，或在左侧对话里让 AI 生成…"
            className={cn(
              "min-h-0 flex-1 resize-none border-stone-100 p-5 font-mono text-[13px] leading-7 outline-none",
              mode === "split" ? "border-r" : ""
            )}
          />
        )}
        {(mode === "preview" || mode === "split") && (
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <article className="prose-doc text-sm leading-7 text-stone-700">
              <Markdown content={doc.content || "*暂无内容*"} />
            </article>
          </div>
        )}
      </div>
    </div>
  );
}
