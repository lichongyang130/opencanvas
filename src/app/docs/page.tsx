"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  File,
  FileText,
  FolderPlus,
  Grid3X3,
  Layers,
  Loader2,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Share2,
  SlidersHorizontal,
  Star,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import CreditsBadge from "@/components/CreditsBadge";
import { ShellSidebar } from "@/components/mockup/ShellSidebar";
import { useI18n } from "@/lib/i18n";
import { toast } from "@/lib/store/toast";
import { Toaster } from "@/components/Toaster";

type DocType = "word" | "pdf" | "excel" | "ppt" | "markdown" | "text" | "other";

interface DocRow {
  id: string;
  name: string;
  type: DocType;
  size: number;
  ext: string;
  tags: string[];
  favorite: boolean;
  deleted: boolean;
  createdAt: number;
  updatedAt: number;
}

const DOC_STYLE: Record<DocType, { bg: string; text: string; letter: string }> = {
  word: { bg: "bg-sky-50 text-sky-600", text: "text-sky-600", letter: "W" },
  pdf: { bg: "bg-red-50 text-red-500", text: "text-red-500", letter: "PDF" },
  excel: { bg: "bg-emerald-50 text-emerald-600", text: "text-emerald-600", letter: "X" },
  ppt: { bg: "bg-orange-50 text-orange-500", text: "text-orange-500", letter: "P" },
  markdown: { bg: "bg-violet-50 text-violet-600", text: "text-violet-600", letter: "MD" },
  text: { bg: "bg-stone-100 text-stone-600", text: "text-stone-600", letter: "T" },
  other: { bg: "bg-stone-100 text-stone-500", text: "text-stone-500", letter: "F" },
};

const TABS = ["全部文档", "收藏夹", "回收站"];

const PAGE_SIZE = 10;

function fmtSize(n: number): string {
  if (n === 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function fmtTime(t: number): string {
  const d = new Date(t);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString() === d.toDateString();
  if (sameDay) return `今天 ${d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
  if (yesterday) return `昨天 ${d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString("zh-CN");
}

function DocIcon({ type }: { type: DocType }) {
  const s = DOC_STYLE[type] ?? DOC_STYLE.other;
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold ${s.bg} ${s.text}`}>
      {type === "word" || type === "excel" || type === "markdown" || type === "text" ? (
        <FileText className="h-5 w-5" />
      ) : (
        <File className="h-5 w-5" />
      )}
    </span>
  );
}

export default function DocsPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [opening, setOpening] = useState<DocRow | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const includeDeleted = tab === 2 ? "&deleted=1" : "";
      const q = query.trim() ? `&q=${encodeURIComponent(query.trim())}` : "";
      const res = await fetch(`/api/documents?${includeDeleted.replace(/^&/, "")}${q}`);
      const data = (await res.json()) as { documents?: DocRow[] };
      setDocs((data.documents ?? []).map((d) => ({ ...d, size: Number(d.size) })));
    } catch {
      toast("加载文档失败", "error");
    } finally {
      setLoading(false);
    }
  }, [tab, query]);

  useEffect(() => {
    void load();
  }, [load, tab]);

  const rows = useMemo(() => {
    let list = docs;
    if (tab === 1) list = list.filter((d) => d.favorite && !d.deleted);
    if (tab === 0) list = list.filter((d) => !d.deleted);
    return list;
  }, [docs, tab]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageRows = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const totalSize = useMemo(() => docs.filter((d) => !d.deleted).reduce((n, d) => n + d.size, 0), [docs]);
  const realCount = docs.filter((d) => !d.deleted).length;
  const favCount = docs.filter((d) => !d.deleted && d.favorite).length;

  const stats = [
    { icon: FileText, label: "文档总数", value: String(realCount), unit: "个", tint: "bg-blue-50 text-blue-600" },
    { icon: Star, label: "收藏夹", value: String(favCount), unit: "个", tint: "bg-amber-50 text-amber-600" },
    { icon: Users, label: "已解析正文", value: String(docs.filter((d) => !d.deleted && d.type !== "other").length), unit: "个", tint: "bg-orange-50 text-orange-600" },
    { icon: Box, label: "存储占用", value: fmtSize(totalSize), unit: "本地", tint: "bg-violet-50 text-violet-600" },
  ];

  const toggleFav = async (id: string) => {
    const doc = docs.find((d) => d.id === id);
    if (!doc) return;
    const next = !doc.favorite;
    setDocs((s) => s.map((d) => (d.id === id ? { ...d, favorite: next } : d)));
    try {
      await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: next }),
      });
      toast(next ? "已收藏" : "已取消收藏", "success");
    } catch {
      toast("操作失败", "error");
    }
  };

  const toggleTrash = async (id: string) => {
    const doc = docs.find((d) => d.id === id);
    if (!doc) return;
    try {
      if (doc.deleted) {
        await fetch(`/api/documents/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restore: true }),
        });
        toast("已恢复文档", "success");
      } else {
        await fetch(`/api/documents/${id}`, { method: "DELETE" });
        toast("已移入回收站", "info");
      }
      await load();
    } catch {
      toast("操作失败", "error");
    }
  };

  const hardDelete = async (id: string) => {
    if (!window.confirm("彻底删除该文档？此操作不可恢复。")) return;
    try {
      await fetch(`/api/documents/${id}?hard=1`, { method: "DELETE" });
      toast("已彻底删除", "success");
      await load();
    } catch {
      toast("删除失败", "error");
    }
  };

  const uploadFiles = async (files: FileList | File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      for (const f of Array.from(files)) fd.append("files", f);
      const res = await fetch("/api/documents", { method: "POST", body: fd });
      const data = (await res.json()) as { documents?: DocRow[]; errors?: string[] };
      if (!res.ok) throw new Error(data.errors?.[0] ?? "上传失败");
      toast(`成功上传 ${data.documents?.length ?? 0} 个文档`, "success");
      for (const e of data.errors ?? []) toast(e, "info");
      setTab(0);
      await load();
    } catch (e) {
      toast(`上传失败：${e instanceof Error ? e.message : ""}`, "error");
    } finally {
      setUploading(false);
    }
  };

  const openDoc = async (doc: DocRow) => {
    setOpening(doc);
    setPreviewLoading(true);
    setPreview(null);
    try {
      const res = await fetch(`/api/documents/${doc.id}`);
      const data = (await res.json()) as { document?: { content?: string } };
      const content = data.document?.content ?? "";
      setPreview(content || (doc.type === "other" ? null : "（该文档暂无正文内容）"));
      if (!content && doc.type !== "other") toast("暂无可预览正文，可下载原文件", "info");
    } catch {
      setPreview("加载失败");
    } finally {
      setPreviewLoading(false);
    }
  };

  const downloadDoc = (id: string) => {
    const a = document.createElement("a");
    a.href = `/api/documents/${id}?mode=download`;
    a.download = "";
    a.click();
    toast("正在下载…", "info");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--oc-bg)] text-stone-800">
      <ShellSidebar active="docs" />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* 顶栏 */}
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--oc-border-soft)] bg-[var(--oc-bg)] px-6 py-4">
          <div>
            <h1 className="text-[18px] font-semibold text-stone-900">{t("pages.docs")}</h1>
            <p className="mt-0.5 text-[12.5px] text-stone-400">上传、预览与管理你的文档（支持 PDF / Word / Markdown / TXT）</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <CreditsBadge />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="ml-2 flex items-center gap-1.5 rounded-xl border border-[var(--oc-brand-border-soft)] bg-white px-4 py-2 text-[13px] font-medium text-[var(--oc-brand)] transition hover:bg-[var(--oc-brand-hover)] disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {uploading ? "上传中…" : "上传文档"}
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.md,.markdown,.txt,.csv,.json,.xlsx,.xls,.pptx,.ppt"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) void uploadFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        </header>

        {/* 内容 */}
        <div className="flex min-h-0 flex-1 overflow-hidden px-6 pb-6 pt-5">
          {/* 主区域 */}
          <div className="min-w-0 flex-1 overflow-y-auto pr-4">
            {/* 统计 */}
            <div className="grid grid-cols-4 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-[var(--oc-border)] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.tint}`}>
                    <s.icon className="h-[22px] w-[22px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-stone-400">{s.label}</p>
                    <p className="text-[20px] font-bold leading-tight text-stone-800">
                      {s.value} <span className="text-[12px] font-normal text-stone-400">{s.unit}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 列表区 */}
            <div
              className="mt-5 rounded-2xl border border-[var(--oc-border)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                void uploadFiles(e.dataTransfer.files);
              }}
            >
              {/* 标签栏 */}
              <div className={`flex flex-wrap items-center gap-1 border-b border-[var(--oc-border-soft)] px-4 pt-3 transition ${dragOver ? "bg-orange-50/60" : ""}`}>
                {TABS.map((t, i) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTab(i);
                      setPage(1);
                    }}
                    className={
                      i === tab
                        ? "relative px-3 pb-3 pt-1 text-[13px] font-medium text-[var(--oc-brand)]"
                        : "px-3 pb-3 pt-1 text-[13px] text-stone-500 transition hover:text-stone-800"
                    }
                  >
                    {t}
                    {i === tab && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[var(--oc-brand-bright)]" />}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2 pb-2">
                  <div className="flex items-center gap-2 rounded-lg border border-[var(--oc-border)] bg-white px-3 py-1.5 text-stone-400">
                    <Search className="h-4 w-4" />
                    <input
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(1);
                      }}
                      placeholder="搜索文档名称或正文…"
                      className="w-44 bg-transparent text-[12.5px] text-stone-700 outline-none placeholder:text-stone-400"
                    />
                  </div>
                  {dragOver && (
                    <span className="rounded-lg bg-orange-100 px-3 py-1.5 text-[12px] font-medium text-orange-600">
                      松开上传
                    </span>
                  )}
                </div>
              </div>

              {/* 表头 */}
              <div className="flex items-center px-5 py-2.5 text-[12px] text-stone-400">
                <span className="w-[46%]">文档名称</span>
                <span className="w-[18%]">类型</span>
                <span className="w-[14%]">更新时间</span>
                <span className="w-[10%]">大小</span>
                <span className="flex-1 text-right">操作</span>
              </div>

              {/* 行 */}
              {loading ? (
                <div className="flex flex-col items-center gap-2 py-14 text-stone-400">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                  <p className="text-sm">加载文档中…</p>
                </div>
              ) : pageRows.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-14 text-stone-400">
                  <Trash2 className="h-8 w-8 text-stone-300" />
                  <p className="text-sm">{tab === 2 ? "回收站是空的" : "暂无文档，点击右上角「上传文档」开始"}</p>
                </div>
              ) : (
                pageRows.map((r) => {
                  const s = DOC_STYLE[r.type] ?? DOC_STYLE.other;
                  return (
                    <div key={r.id} className="flex items-center border-t border-[var(--oc-border-faint)] px-5 py-3.5 transition hover:bg-[var(--oc-hover)]">
                      <div className="flex w-[46%] cursor-pointer items-center gap-3 pr-2" onClick={() => void openDoc(r)}>
                        <DocIcon type={r.type} />
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-medium text-stone-700">{r.name}</p>
                          <p className="mt-0.5 text-xs text-stone-400">
                            .{r.ext} · {r.type === "other" ? "仅登记（不支持解析）" : "支持正文预览"}
                          </p>
                        </div>
                      </div>
                      <div className="w-[18%] pr-2">
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${s.bg} ${s.text}`}>{s.letter}</span>
                      </div>
                      <span className="w-[14%] text-[12.5px] text-stone-500">{fmtTime(r.updatedAt)}</span>
                      <span className="w-[10%] text-[12.5px] text-stone-500">{fmtSize(r.size)}</span>
                      <div className="flex flex-1 items-center justify-end gap-1">
                        {r.deleted ? (
                          <>
                            <button
                              onClick={() => void toggleTrash(r.id)}
                              className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-stone-500 transition hover:bg-stone-100 hover:text-emerald-600"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> 恢复
                            </button>
                            <button
                              onClick={() => void hardDelete(r.id)}
                              className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-stone-500 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> 彻底删除
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => void toggleFav(r.id)}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-stone-100 ${r.favorite ? "text-amber-400" : "text-stone-400 hover:text-stone-600"}`}
                            >
                              <Star className={`h-4 w-4 ${r.favorite ? "fill-current" : ""}`} />
                            </button>
                            <button
                              onClick={() => downloadDoc(r.id)}
                              title="下载原文件"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => void openDoc(r)}
                              title="预览"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => void toggleTrash(r.id)}
                              title="移入回收站"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* 分页 */}
              {!loading && pageCount > 1 && (
                <div className="flex items-center justify-between border-t border-[var(--oc-border-soft)] px-5 py-3.5 text-[12.5px] text-stone-500">
                  <span>共 {rows.length} 个文档</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <button
                        disabled={current <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--oc-border)] bg-white text-stone-400 disabled:opacity-40"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      {Array.from({ length: Math.min(pageCount, 4) }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
                            p === current
                              ? "border-[var(--oc-brand-border-soft)] bg-[var(--oc-brand-soft)] text-[var(--oc-brand)]"
                              : "border-[var(--oc-border)] bg-white text-stone-500 transition hover:text-stone-700"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                      {pageCount > 4 && <span className="px-1 text-stone-300">…</span>}
                      {pageCount > 4 && (
                        <button
                          onClick={() => setPage(pageCount)}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--oc-border)] bg-white text-stone-500 transition hover:text-stone-700 ${
                            current === pageCount ? "border-[var(--oc-brand-border-soft)] bg-[var(--oc-brand-soft)] text-[var(--oc-brand)]" : ""
                          }`}
                        >
                          {pageCount}
                        </button>
                      )}
                      <button
                        disabled={current >= pageCount}
                        onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--oc-border)] bg-white text-stone-400 disabled:opacity-40"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右侧面板 */}
          <aside className="hidden w-[320px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[var(--oc-border)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] xl:flex">
            {/* 存储空间 */}
            <div className="border-b border-[var(--oc-border-soft)] p-5">
              <p className="text-[14px] font-semibold text-stone-800">存储空间</p>
              <div className="mt-4 flex items-center gap-5">
                <div className="relative h-28 w-28 shrink-0">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="var(--oc-border-soft)" strokeWidth="12" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke="var(--oc-brand-bright)" strokeWidth="12" strokeDasharray="326.7" strokeDashoffset={Math.max(0, 326.7 - (totalSize / (30 * 1024 * 1024 * 1024)) * 326.7)} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-[16px] font-bold text-stone-800">{fmtSize(totalSize)}</p>
                    <p className="text-[11px] text-stone-400">本地存储</p>
                  </div>
                </div>
                <div className="flex-1 space-y-2 text-[12px] text-stone-500">
                  <p className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-orange-400" />文档文件</span>
                    <span>{fmtSize(totalSize)}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-300" />文本正文</span>
                    <span>实时提取</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-stone-300" />上限</span>
                    <span>单文件 30MB</span>
                  </p>
                </div>
              </div>
            </div>

            {/* 快速操作 */}
            <div className="border-b border-[var(--oc-border-soft)] p-5">
              <p className="text-[14px] font-semibold text-stone-800">快速操作</p>
              <div className="mt-3 space-y-1">
                <button onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-[var(--oc-hover)]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Upload className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-stone-700">上传文档</span>
                    <span className="block text-[11px] text-stone-400">支持拖拽或选择文件上传</span>
                  </span>
                </button>
                <button onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-[var(--oc-hover)]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><FolderPlus className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-stone-700">批量上传</span>
                    <span className="block text-[11px] text-stone-400">一次选择多个文档</span>
                  </span>
                </button>
                <button onClick={() => void load()} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-[var(--oc-hover)]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600"><Layers className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-stone-700">刷新列表</span>
                    <span className="block text-[11px] text-stone-400">重新从数据库加载</span>
                  </span>
                </button>
              </div>
            </div>

            {/* 最近文档 */}
            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-[14px] font-semibold text-stone-800">最近文档</p>
              <div className="mt-3 space-y-1">
                {rows.slice(0, 6).map((d) => (
                  <button key={d.id} onClick={() => void openDoc(d)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-[var(--oc-hover)]">
                    <DocIcon type={d.type} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium text-stone-700">{d.name}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] text-stone-400"><Clock className="h-3 w-3" />{fmtTime(d.updatedAt)}</span>
                    </span>
                  </button>
                ))}
                {rows.length === 0 && <p className="px-2 py-1 text-xs text-stone-300">暂无文档</p>}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* 预览抽屉 */}
      {opening && (
        <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/40 backdrop-blur-sm" onClick={() => setOpening(null)}>
          <div
            className="flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex shrink-0 items-center justify-between border-b border-stone-100 px-5 py-3.5">
              <div className="min-w-0">
                <h3 className="truncate text-[15px] font-semibold text-stone-800">{opening.name}</h3>
                <p className="mt-0.5 text-xs text-stone-400">
                  {opening.type} · {fmtSize(opening.size)} · {fmtTime(opening.updatedAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => downloadDoc(opening.id)}
                  title="下载"
                  className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={() => void toggleFav(opening.id)}
                  title={opening.favorite ? "取消收藏" : "收藏"}
                  className={`rounded-lg p-2 transition hover:bg-stone-100 ${opening.favorite ? "text-amber-400" : "text-stone-400 hover:text-stone-700"}`}
                >
                  <Star className={`h-4 w-4 ${opening.favorite ? "fill-current" : ""}`} />
                </button>
                <button
                  onClick={() => setOpening(null)}
                  className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto bg-stone-50/60 p-6">
              {previewLoading ? (
                <div className="flex h-full items-center justify-center text-stone-400">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                </div>
              ) : (
                <pre className="whitespace-pre-wrap rounded-2xl border border-stone-200 bg-white p-5 font-mono text-[13px] leading-6 text-stone-700 shadow-sm">
                  {preview}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
}
