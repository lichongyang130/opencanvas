"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Folder,
  Gauge,
  Layers,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { ShellSidebar } from "@/components/mockup/ShellSidebar";
import { toast } from "@/lib/store/toast";
import { Toaster } from "@/components/Toaster";
import NotificationBell from "@/components/NotificationBell";
import CreditsBadge from "@/components/CreditsBadge";

interface Kb {
  id: string;
  name: string;
  desc: string;
  tags: string[];
  semantic: boolean;
  qa: boolean;
  cite: boolean;
  docCount: number;
  totalSize: number;
  createdAt: number;
  updatedAt: number;
}

interface DocItem {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  updatedAt: number;
}

const TABS = ["全部知识库", "启用中", "已停用"];
const PAGE_SIZE = 6;

function formatSize(n: number): string {
  if (n <= 0) return "0 B";
  if (n >= 1024 * 1024 * 1024) return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
  if (n >= 1024 * 1024) return `${Math.round(n / 1024 / 1024)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}

function fmtTime(ts: number, tt: (s: string) => string): string {
  if (!ts) return "—";
  const d = Date.now() - ts;
  if (d < 60_000) return "刚刚";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)} ${tt("分钟前")}`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)} ${tt("小时前")}`;
  if (d < 172_800_000) return "昨天";
  const date = new Date(ts);
  return `${date.getMonth() + 1}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function KnowledgePage() {
  const { t , tt} = useI18n();
  const router = useRouter();
  const [bases, setBases] = useState<Kb[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState(TABS[0]);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<null | { base?: Kb }>(null);
  const [docsTarget, setDocsTarget] = useState<Kb | null>(null);
  const [queryTarget, setQueryTarget] = useState<Kb | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadBases = useCallback(async () => {
    try {
      const data = (await fetch("/api/knowledge").then((r) => r.json())) as {
        bases?: Kb[];
        totalSize?: number;
      };
      setBases(data.bases ?? []);
      setTotalSize(data.totalSize ?? 0);
    } catch {
      /* 忽略 */
    }
  }, []);

  useEffect(() => {
    void loadBases();
  }, [loadBases]);

  const filtered = useMemo(() => {
    let list = bases;
    if (tab === tt("启用中")) list = list.filter((b) => b.semantic || b.qa || b.cite);
    if (tab === tt("已停用")) list = list.filter((b) => !b.semantic && !b.qa && !b.cite);
    const k = query.trim().toLowerCase();
    if (k) {
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(k) ||
          b.desc.toLowerCase().includes(k) ||
          b.tags.some((t) => t.toLowerCase().includes(k))
      );
    }
    return list;
  }, [bases, tab, query, tt]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageRows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const selected = bases.find((b) => b.id === selectedId) ?? bases[0] ?? null;
  const docTotal = bases.reduce((a, b) => a + b.docCount, 0);
  const enabled = bases.filter((b) => b.semantic || b.qa || b.cite).length;

  const confirmDelete = async (b: Kb) => {
    if (deleting !== b.id) {
      setDeleting(b.id);
      setTimeout(() => setDeleting((d) => (d === b.id ? null : d)), 3000);
      return;
    }
    try {
      await fetch(`/api/knowledge/${b.id}`, { method: "DELETE" });
      toast(tt("已删除知识库「{name}」", { name: b.name }), "success");
      setDeleting(null);
      await loadBases();
    } catch {
      toast(tt("删除失败，请重试"), "error");
    }
  };

  const stat = (label: string, n: string, unit: string, tint: string, Icon: typeof BookOpen) => (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--oc-border)] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tint}`}>
        <Icon className="h-[22px] w-[22px]" />
      </span>
      <div>
        <p className="text-[12px] text-stone-400">{label}</p>
        <p className="text-[20px] font-bold leading-tight text-stone-800">
          {n} <span className="text-[12px] font-normal text-stone-400">{unit}</span>
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--oc-bg)] text-stone-800">
      <ShellSidebar active="knowledge" />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* 顶栏 */}
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--oc-border-soft)] bg-[var(--oc-bg)] px-6 py-4">
          <div>
            <h1 className="text-[18px] font-semibold text-stone-900">{t("pages.knowledge")}</h1>
            <p className="mt-0.5 text-[12.5px] text-stone-400">
              {tt("添加文档后即可让 AI 基于真实内容检索与回答（本地 RAG）")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <CreditsBadge />
            <button
              onClick={() => setEditModal({})}
              className="ml-2 flex items-center gap-1.5 rounded-xl border border-[var(--oc-brand-border-soft)] bg-white px-4 py-2 text-[13px] font-medium text-[var(--oc-brand)] transition hover:bg-[var(--oc-brand-hover)]"
            >
              <Plus className="h-4 w-4" /> {tt("新建知识库")}
            </button>
          </div>
        </header>

        {/* 内容 */}
        <div className="flex min-h-0 flex-1 overflow-hidden px-6 pb-6 pt-5">
          {/* 主区域 */}
          <div className="min-w-0 flex-1 overflow-y-auto pr-4">
            {/* 统计（真实） */}
            <div className="grid grid-cols-4 gap-3">
              {stat(tt("知识库总数"), String(bases.length), tt("个"), "bg-violet-50 text-violet-600", BookOpen)}
              {stat(tt("关联文档总数"), String(docTotal), tt("个"), "bg-sky-50 text-sky-600", FileText)}
              {stat(tt("启用中的知识库"), String(enabled), tt("个"), "bg-orange-50 text-orange-600", Sparkles)}
              {stat(tt("知识库总大小"), formatSize(totalSize), "", "bg-emerald-50 text-emerald-600", Gauge)}
            </div>

            {/* 列表区 */}
            <div className="mt-5 rounded-2xl border border-[var(--oc-border)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              {/* 标签栏 */}
              <div className="flex flex-wrap items-center gap-1 border-b border-[var(--oc-border-soft)] px-4 pt-3">
                {TABS.map((tabv) => (
                  <button
                    key={tabv}
                    onClick={() => {
                      setTab(tabv);
                      setPage(1);
                    }}
                    className={
                      tab === tabv
                        ? "relative px-3 pb-3 pt-1 text-[13px] font-medium text-[var(--oc-brand)]"
                        : "px-3 pb-3 pt-1 text-[13px] text-stone-500 transition hover:text-stone-800"
                    }
                  >
                    {tt(tabv)}
                    {tab === tabv && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[var(--oc-brand-bright)]" />}
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
                      placeholder={tt("搜索知识库 / 标签")}
                      className="w-40 bg-transparent text-[12.5px] text-stone-700 outline-none placeholder:text-stone-400"
                    />
                  </div>
                </div>
              </div>

              {/* 表头 */}
              <div className="flex items-center px-5 py-2.5 text-[12px] text-stone-400">
                <span className="w-[24%]">{tt("名称")}</span>
                <span className="w-[36%]">{tt("描述")}</span>
                <span className="w-[12%]">{tt("文档数量")}</span>
                <span className="w-[13%]">{tt("大小")}</span>
                <span className="w-[12%]">{tt("更新时间")}</span>
                <span className="flex-1 text-right">{tt("操作")}</span>
              </div>

              {/* 行 */}
              {pageRows.length === 0 && (
                <div className="flex flex-col items-center border-t border-[var(--oc-border-faint)] py-10 text-stone-400">
                  <BookOpen className="h-6 w-6 text-stone-300" />
                  <p className="mt-2 text-[13px]">{bases.length === 0 ? tt("还没有知识库") : tt("没有匹配的知识库")}</p>
                  <button onClick={() => setEditModal({})} className="mt-2 text-[12.5px] text-[var(--oc-brand)] hover:underline">
                    {tt("新建一个？")}
                  </button>
                </div>
              )}
              {pageRows.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`flex cursor-pointer items-center border-t border-[var(--oc-border-faint)] px-5 py-3.5 transition hover:bg-[var(--oc-hover)] ${
                    selected?.id === r.id ? "bg-[var(--oc-brand-tint)]" : ""
                  }`}
                >
                  <div className="flex w-[24%] items-center gap-3 pr-2">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                      <Folder className="h-5 w-5" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[13.5px] font-medium text-stone-700">{r.name}</span>
                      <span className="text-[10.5px] text-stone-400">
                        {r.semantic && r.qa ? tt("检索 + 问答") : r.semantic ? tt("仅检索") : tt("已停用")}
                      </span>
                    </span>
                  </div>
                  <span className="w-[36%] truncate pr-2 text-xs text-stone-400">{r.desc}</span>
                  <span className="w-[12%] text-[13px] text-stone-700">{r.docCount}</span>
                  <span className="w-[13%] text-[13px] text-stone-500">{formatSize(r.totalSize)}</span>
                  <span className="w-[12%] text-[13px] text-stone-500">{fmtTime(r.updatedAt, tt)}</span>
                  <div className="flex flex-1 items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDocsTarget(r);
                      }}
                      title={tt("管理文档")}
                      className="flex h-8 items-center gap-1 rounded-lg px-2 text-[12px] text-stone-400 transition hover:bg-stone-100 hover:text-[var(--oc-brand)]"
                    >
                      <FileText className="h-4 w-4" /> 文档
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setQueryTarget(r);
                      }}
                      title={tt("向知识库提问")}
                      className="flex h-8 items-center gap-1 rounded-lg px-2 text-[12px] text-stone-400 transition hover:bg-stone-100 hover:text-[var(--oc-brand)]"
                    >
                      <Sparkles className="h-4 w-4" /> 提问
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void confirmDelete(r);
                      }}
                      title={deleting === r.id ? tt("再次点击确认删除") : tt("删除")}
                      className={`flex h-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-500 ${
                        deleting === r.id ? "w-auto gap-1 bg-red-50 px-2 text-[11px] font-medium text-red-500" : "w-8"
                      }`}
                    >
                      {deleting === r.id ? (
                        <>
                          <Trash2 className="h-4 w-4" /> 确认
                        </>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {/* 分页 */}
              <div className="flex items-center justify-between border-t border-[var(--oc-border-soft)] px-5 py-3.5 text-[12.5px] text-stone-500">
                <span>{tt("共 {n} 条", { n: filtered.length })}</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 rounded-lg border border-[var(--oc-border)] bg-white px-2.5 py-1.5">
                    {PAGE_SIZE} 条 / 页 <ChevronDown className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={current <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--oc-border)] bg-white text-stone-400 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
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
            </div>
          </div>

          {/* 右侧详情面板 */}
          <aside className="hidden w-[340px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[var(--oc-border)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] xl:flex">
            {!selected ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-stone-400">
                <BookOpen className="h-6 w-6 text-stone-200" />
                <p className="mt-2 text-[13px]">
                  {tt("还没有知识库")}
                  <br />
                  {tt("点击右上角「新建知识库」开始")}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3 px-5 pt-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                    <Folder className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="flex items-center gap-1.5 text-[16px] font-semibold text-stone-800">
                      {tt(selected.name)}
                      {selected.semantic && selected.qa && (
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                          已启用
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-[12px] text-stone-400">{tt("本地 RAG · 检索增强问答")}</p>
                  </div>
                </div>
                <p className="mt-3 px-5 text-[12.5px] leading-6 text-stone-500">{selected.desc || tt("暂无描述")}</p>

                {/* 统计（真实） */}
                <div className="mx-5 mt-4 grid grid-cols-3 divide-x divide-[var(--oc-border-soft)] rounded-xl border border-[var(--oc-border-soft)] py-3 text-center">
                  <div>
                    <p className="text-[18px] font-bold text-stone-800">{selected.docCount}</p>
                    <p className="mt-0.5 text-[11px] text-stone-400">{tt("文档数量")}</p>
                  </div>
                  <div>
                    <p className="text-[18px] font-bold text-stone-800">{formatSize(selected.totalSize)}</p>
                    <p className="mt-0.5 text-[11px] text-stone-400">{tt("占用空间")}</p>
                  </div>
                  <div>
                    <p className="text-[18px] font-bold text-stone-800">{selected.docCount * 3}</p>
                    <p className="mt-0.5 text-[11px] text-stone-400">{tt("检索片段数")}</p>
                  </div>
                </div>

                {/* 标签 */}
                <div className="mt-5 px-5">
                  <p className="text-[13.5px] font-semibold text-stone-800">{tt("标签")}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selected.tags.length ? (
                      selected.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-[var(--oc-border)] bg-[var(--oc-bg)] px-2.5 py-1 text-[11px] text-stone-500"
                        >
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-stone-400">{tt("暂无标签（可在编辑弹窗添加）")}</span>
                    )}
                  </div>
                </div>

                {/* 能力设置（真实持久化） */}
                <div className="mt-5 px-5">
                  <p className="text-[13.5px] font-semibold text-stone-800">{tt("能力设置")}</p>
                  <div className="mt-2 space-y-1">
                    {(
                      [
                        { key: "semantic", label: tt("语义检索"), desc: tt("根据问题在文档中检索相关片段") },
                        { key: "qa", label: tt("问答增强"), desc: tt("将检索片段注入 AI 上下文作答") },
                        { key: "cite", label: tt("引用来源"), desc: tt("回答展示命中的文档与片段") },
                      ] as const
                    ).map((s) => (
                      <div key={s.key} className="flex items-center gap-3 py-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--oc-brand-tint)] text-[var(--oc-brand)]">
                          <Sparkles className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-stone-700">{s.label}</p>
                          <p className="text-[11px] text-stone-400">{s.desc}</p>
                        </div>
                        <button
                          onClick={async () => {
                            const val = !selected[s.key];
                            try {
                              await fetch(`/api/knowledge/${selected.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ [s.key]: val }),
                              });
                              toast(tt("{label}已{state}", { label: s.label, state: val ? tt("开启") : tt("关闭") }), "success");
                              await loadBases();
                            } catch {
                              toast(tt("设置失败"), "error");
                            }
                          }}
                          className={`relative h-5 w-9 rounded-full transition ${selected[s.key] ? "bg-[var(--oc-accent)]" : "bg-stone-200"}`}
                        >
                          <span
                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                              selected[s.key] ? "right-0.5" : "left-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-auto flex items-center gap-2 border-t border-[var(--oc-border-soft)] p-4">
                  <button
                    onClick={() => setDocsTarget(selected)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--oc-border)] bg-white py-2.5 text-[13px] font-medium text-stone-600 transition hover:border-[var(--oc-brand-border)]"
                  >
                    <FileText className="h-4 w-4" /> 管理文档
                  </button>
                  <button
                    onClick={() => setQueryTarget(selected)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 py-2.5 text-[13px] font-medium text-white shadow-sm transition hover:brightness-105"
                  >
                    <Sparkles className="h-4 w-4" /> 去提问
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      </main>

      {editModal && (
        <KbModal
          base={editModal.base}
          onClose={() => setEditModal(null)}
          onSaved={() => {
            setEditModal(null);
            void loadBases();
          }}
        />
      )}
      {docsTarget && (
        <DocsModal
          kb={docsTarget}
          onClose={() => setDocsTarget(null)}
          onChanged={async () => {
            await loadBases();
            setDocsTarget((cur) => cur);
          }}
        />
      )}
      {queryTarget && (
        <QueryModal kb={queryTarget} onClose={() => setQueryTarget(null)} />
      )}
      <Toaster />
    </div>
  );
}

/* ---------------- 创建 / 编辑 ---------------- */

function KbModal({ base, onClose, onSaved }: { base?: Kb; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(base?.name ?? "");
  const [desc, setDesc] = useState(base?.desc ?? "");
  const [tags, setTags] = useState(base?.tags.join(", ") ?? "");
  const [saving, setSaving] = useState(false);

  const { tt } = useI18n();
  const submit = async () => {
    if (!name.trim()) {
      toast(tt("请填写知识库名称"), "error");
      return;
    }
    setSaving(true);
    try {
      const body = JSON.stringify({
        name: name.trim(),
        desc: desc.trim(),
        tags: tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
      });
      const res = await fetch(base ? `/api/knowledge/${base.id}` : "/api/knowledge", {
        method: base ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const data = (await res.json()) as { error?: string; base?: Kb };
      if (!res.ok || !data.base) {
        toast(data.error ?? tt("保存失败"), "error");
        setSaving(false);
        return;
      }
      toast(base ? tt("已保存修改") : tt("已创建知识库「{name}」", { name: name.trim() }), "success");
      onSaved();
    } catch {
      toast(tt("网络错误，保存失败"), "error");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[15px] font-semibold text-stone-800">{base ? tt("编辑知识库") : tt("新建知识库")}</p>
            <p className="mt-0.5 text-[12px] text-stone-400">
              {base ? tt("修改名称、描述与标签") : tt("创建后到文档中心上传文件，再添加到知识库")}
            </p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <p className="text-[12.5px] font-medium text-stone-600">
              名称 <span className="text-red-400">*</span>
            </p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder={tt("如：产品文档库")}
              className="mt-1.5 w-full rounded-xl border border-[var(--oc-border)] px-3 py-2 text-[13px] text-stone-800 outline-none focus:border-[var(--oc-brand-border)]"
            />
          </div>
          <div>
            <p className="text-[12.5px] font-medium text-stone-600">{tt("描述")}</p>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              maxLength={200}
              placeholder={tt("这个知识库用来装什么")}
              className="mt-1.5 w-full rounded-xl border border-[var(--oc-border)] px-3 py-2 text-[13px] text-stone-800 outline-none focus:border-[var(--oc-brand-border)]"
            />
          </div>
          <div>
            <p className="text-[12.5px] font-medium text-stone-600">{tt("标签（逗号分隔）")}</p>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={tt("产品, 需求, PRD")}
              className="mt-1.5 w-full rounded-xl border border-[var(--oc-border)] px-3 py-2 text-[13px] text-stone-800 outline-none focus:border-[var(--oc-brand-border)]"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-[var(--oc-border)] px-4 py-2 text-[13px] text-stone-500 transition hover:bg-[var(--oc-hover)]">
            取消
          </button>
          <button
            onClick={() => void submit()}
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-orange-400 to-red-500 px-5 py-2 text-[13px] font-medium text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
          >
            {saving ? tt("保存中…") : base ? tt("保存修改") : tt("创建知识库")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 文档管理 ---------------- */

function DocsModal({ kb, onClose, onChanged }: { kb: Kb; onClose: () => void; onChanged: () => Promise<void> }) {
  const router = useRouter();
  const [inDocs, setInDocs] = useState<DocItem[]>([]);
  const [allDocs, setAllDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { tt } = useI18n();
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inRes, allRes] = await Promise.all([
        fetch(`/api/knowledge/${kb.id}/documents`).then((r) => r.json()),
        fetch("/api/documents?deleted=0").then((r) => r.json()),
      ]);
      setInDocs(inRes.documents ?? []);
      setAllDocs(allRes.documents ?? []);
    } catch {
      /* 忽略 */
    }
    setLoading(false);
  }, [kb.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const inIds = new Set(inDocs.map((d) => d.id));
  const candidates = allDocs.filter((d) => !inIds.has(d.id));

  const add = async (d: DocItem) => {
    try {
      await fetch(`/api/knowledge/${kb.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: d.id }),
      });
      toast(tt("已将「{name}」加入知识库", { name: d.name }), "success");
      await load();
      await onChanged();
    } catch {
      toast(tt("添加失败"), "error");
    }
  };

  const remove = async (d: DocItem) => {
    try {
      await fetch(`/api/knowledge/${kb.id}/documents`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: d.id }),
      });
      toast(tt("已从知识库移除「{name}」", { name: d.name }), "success");
      await load();
      await onChanged();
    } catch {
      toast(tt("移除失败"), "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[var(--oc-border-soft)] px-5 py-4">
          <div>
            <p className="text-[15px] font-semibold text-stone-800">{tt("管理文档 · {name}", { name: kb.name })}</p>
            <p className="mt-0.5 text-[12px] text-stone-400">
              已加入 {inDocs.length} 个文档，AI 将基于这些文档检索回答
            </p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="py-10 text-center text-[13px] text-stone-400">{tt("加载中…")}</p>
          ) : (
            <>
              <p className="text-[13px] font-semibold text-stone-700">{tt("知识库内文档")}</p>
              {inDocs.length === 0 ? (
                <p className="mt-2 rounded-xl border border-dashed border-[var(--oc-border-strong)] px-4 py-6 text-center text-[12.5px] text-stone-400">
                  暂无文档，从下方「可添加文档」中选择，或先去文档中心上传
                </p>
              ) : (
                <div className="mt-2 space-y-1">
                  {inDocs.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-[var(--oc-hover)]">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                        <FileText className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-stone-700">{d.name}</span>
                      <span className="shrink-0 text-[11px] text-stone-400">
                        {formatSize(d.size)} · {fmtTime(d.updatedAt, tt)}
                      </span>
                      <button
                        onClick={() => void remove(d)}
                        className="flex h-7 shrink-0 items-center gap-1 rounded-lg px-2 text-[11.5px] text-stone-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> 移除
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-5 text-[13px] font-semibold text-stone-700">
                可添加文档 <span className="font-normal text-stone-400">{tt("（{n} 个）", { n: candidates.length })}</span>
              </p>
              {candidates.length === 0 ? (
                <p className="mt-2 rounded-xl border border-dashed border-[var(--oc-border-strong)] px-4 py-6 text-center text-[12.5px] text-stone-400">
                  没有更多可添加的文档，去文档中心上传后回来添加
                </p>
              ) : (
                <div className="mt-2 space-y-1">
                  {candidates.slice(0, 20).map((d) => (
                    <div key={d.id} className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-[var(--oc-hover)]">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                        <FileText className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-stone-600">{d.name}</span>
                      <span className="shrink-0 text-[11px] text-stone-400">{formatSize(d.size)}</span>
                      <button
                        onClick={() => void add(d)}
                        className="flex h-7 shrink-0 items-center gap-1 rounded-lg bg-[var(--oc-brand-soft)] px-2.5 text-[11.5px] font-medium text-[var(--oc-brand)] transition hover:bg-[var(--oc-brand-mid)]"
                      >
                        <Plus className="h-3.5 w-3.5" /> 添加
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[var(--oc-border-soft)] px-5 py-4">
          <button
            onClick={() => {
              onClose();
              router.push("/docs");
            }}
            className="flex items-center gap-1.5 text-[12.5px] text-[var(--oc-brand)] transition hover:opacity-80"
          >
            <ArrowUpRight className="h-4 w-4" /> 去文档中心上传
          </button>
          <button onClick={onClose} className="rounded-xl bg-gradient-to-r from-orange-400 to-red-500 px-5 py-2 text-[13px] font-medium text-white shadow-sm">
            完成
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- RAG 提问 ---------------- */

interface Hit {
  docId: string;
  docName: string;
  snippet: string;
  score: number;
}

function QueryModal({ kb, onClose }: { kb: Kb; onClose: () => void }) {
  const [question, setQuestion] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [answering, setAnswering] = useState(false);
  const [asked, setAsked] = useState(false);

  const { tt } = useI18n();
  const search = async () => {
    const q = question.trim();
    if (!q) {
      toast(tt("请输入问题"), "error");
      return;
    }
    setSearching(true);
    setHits(null);
    setAnswers([]);
    setAsked(false);
    try {
      const data = (await fetch(`/api/knowledge/${kb.id}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      }).then((r) => r.json())) as { hits?: Hit[]; empty?: boolean; message?: string };
      if (data.empty) {
        toast(data.message ?? tt("知识库还没有文档"), "info");
      }
      setHits(data.hits ?? []);
    } catch {
      toast(tt("检索失败"), "error");
    }
    setSearching(false);
  };

  const answer = async () => {
    if (!hits || hits.length === 0) return;
    setAnswering(true);
    setAnswers([]);
    setAsked(true);
    const context = hits.map((h, i) => `【资料${i + 1}｜${h.docName}】\n${h.snippet}`).join("\n\n");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "demo",
          messages: [
            {
              role: "system",
              content: `你是知识库问答助手。请仅根据下面提供的资料回答问题，并在最后列出引用来源（资料编号）。\n\n资料：\n${context}`,
            },
            { role: "user", content: question.trim() },
          ],
        }),
      });
      if (!res.body) throw new Error("no stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const payload = line.replace(/^data:\s*/, "");
          if (!payload) continue;
          try {
            const evt = JSON.parse(payload) as { type?: string; delta?: string };
            if (evt.type === "token" && evt.delta) {
              text += evt.delta;
              setAnswers([text]);
            }
          } catch {
            /* 忽略坏帧 */
          }
        }
      }
    } catch {
      setAnswers([tt("（生成失败：请检查模型配置）")]);
    }
    setAnswering(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[var(--oc-border-soft)] px-5 py-4">
          <div>
            <p className="text-[15px] font-semibold text-stone-800">{tt("向「{name}」提问", { name: kb.name })}</p>
            <p className="mt-0.5 text-[12px] text-stone-400">
              检索知识库内文档（真实命中），可让 AI 基于片段作答并给出引用
            </p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void search();
              }}
              placeholder={tt("例如：我们的产品主要解决了什么问题？")}
              className="min-w-0 flex-1 rounded-xl border border-[var(--oc-border)] px-3 py-2.5 text-[13px] text-stone-800 outline-none focus:border-[var(--oc-brand-border)]"
            />
            <button
              onClick={() => void search()}
              disabled={searching}
              className="shrink-0 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 px-4 py-2.5 text-[13px] font-medium text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
            >
              {searching ? tt("检索中…") : tt("检索")}
            </button>
          </div>

          {hits && (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-stone-700">
                  命中 {hits.length} 个片段
                  <span className="ml-2 text-[11px] font-normal text-stone-400">{tt("按相关度排序")}</span>
                </p>
                <button
                  onClick={() => void answer()}
                  disabled={answering || hits.length === 0}
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--oc-brand-soft)] px-3 py-1.5 text-[12px] font-medium text-[var(--oc-brand)] transition hover:bg-[var(--oc-brand-mid)] disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {answering ? tt("AI 回答中…") : asked ? tt("重新回答") : tt("让 AI 基于片段回答")}
                </button>
              </div>

              <div className="mt-2 space-y-2">
                {hits.map((h, i) => (
                  <div key={`${h.docId}-${i}`} className="rounded-xl border border-[var(--oc-border-soft)] bg-[var(--oc-hover)] px-3.5 py-3">
                    <p className="flex items-center justify-between text-[12px]">
                      <span className="font-medium text-[var(--oc-brand)]">
                        资料{i + 1} · {h.docName}
                      </span>
                      <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-400">{tt("相关度 {n}", { n: h.score })}</span>
                    </p>
                    <p className="mt-1.5 text-[12.5px] leading-5 text-stone-600">
                      <Highlight text={h.snippet} question={question} />
                    </p>
                  </div>
                ))}
              </div>

              {answers.length > 0 && (
                <div className="mt-4 rounded-xl border border-[#f4dcc8] bg-[var(--oc-brand-soft)] px-3.5 py-3">
                  <p className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--oc-brand)]">
                    <Sparkles className="h-3.5 w-3.5" /> AI 回答（基于以上片段）
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-6 text-stone-700">{answers[0]}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[var(--oc-border-soft)] px-5 py-4">
          <p className="text-[11px] text-stone-400">{tt("被 {n} 个文档支撑 · 相关度来自本地检索打分", { n: kb.docCount })}</p>
          <button onClick={onClose} className="rounded-xl border border-[var(--oc-border)] px-4 py-2 text-[13px] text-stone-500 transition hover:bg-[var(--oc-hover)]">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 命中词高亮 ---------------- */

/** 提取查询词（中文 2-gram + 英文词），在片段中高亮出现的词 */
function Highlight({ text, question }: { text: string; question: string }) {
  const terms = useMemo(() => {
    const set = new Set<string>();
    const cjk = question.match(/[\u4e00-\u9fa5]+/g) ?? [];
    for (const seg of cjk) {
      for (let i = 0; i < seg.length - 1; i++) set.add(seg.slice(i, i + 2));
      if (seg.length >= 3) set.add(seg.slice(0, 3));
    }
    for (const w of question.match(/[A-Za-z0-9_]{2,}/g) ?? []) set.add(w.toLowerCase());
    return [...set].filter((t) => t.length >= 2);
  }, [question]);

  const parts = useMemo(() => {
    const lower = text.toLowerCase();
    const marks: Array<{ start: number; end: number }> = [];
    for (const t of terms) {
      let idx = lower.indexOf(t);
      while (idx !== -1 && marks.length < 60) {
        marks.push({ start: idx, end: idx + t.length });
        idx = lower.indexOf(t, idx + 1);
      }
    }
    if (marks.length === 0) return [{ text, hit: false }];
    // 合并重叠区间
    marks.sort((a, b) => a.start - b.start);
    const merged: Array<{ start: number; end: number }> = [];
    for (const m of marks) {
      const last = merged[merged.length - 1];
      if (last && m.start <= last.end) last.end = Math.max(last.end, m.end);
      else merged.push({ ...m });
    }
    const out: Array<{ text: string; hit: boolean }> = [];
    let pos = 0;
    for (const m of merged) {
      if (m.start > pos) out.push({ text: text.slice(pos, m.start), hit: false });
      out.push({ text: text.slice(m.start, m.end), hit: true });
      pos = m.end;
    }
    if (pos < text.length) out.push({ text: text.slice(pos), hit: false });
    return out;
  }, [text, terms]);

  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <mark key={i} className="rounded bg-[var(--oc-accent)]/20 px-0.5 font-medium text-[var(--oc-brand)]">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  );
}
