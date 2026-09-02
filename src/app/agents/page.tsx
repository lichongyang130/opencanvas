"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/lib/store/chat";
import { PERSONAS } from "@/lib/personas";
import {
  Check,
  Copy,
  MessageCircle,
  Pencil,
  Play,
  Plus,
  Search,
  Share2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import CreditsBadge from "@/components/CreditsBadge";
import { ShellSidebar } from "@/components/mockup/ShellSidebar";
import { toast } from "@/lib/store/toast";
import { Toaster } from "@/components/Toaster";

type AgentCat = "工作" | "创作" | "开发" | "效率" | "自定义";

const AGENT_CATS: AgentCat[] = ["工作", "创作", "开发", "效率", "自定义"];
const TABS = ["全部智能体", ...AGENT_CATS];

const CAT_STYLE: Record<AgentCat, { text: string; bg: string; dot: string }> = {
  工作: { text: "text-orange-600", bg: "bg-orange-50", dot: "bg-orange-500" },
  创作: { text: "text-sky-600", bg: "bg-sky-50", dot: "bg-sky-500" },
  开发: { text: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  效率: { text: "text-violet-600", bg: "bg-violet-50", dot: "bg-violet-500" },
  自定义: { text: "text-rose-600", bg: "bg-rose-50", dot: "bg-rose-500" },
};

const EMOJIS = ["🤖", "🧠", "📊", "✍️", "🎨", "💼", "📚", "💻", "🔍", "📈", "🎯", "🌐", "🧑‍💻", "📷", "🧮", "🎓"];

interface AgentEx {
  id: string;
  name: string;
  desc: string;
  category: string;
  emoji: string;
  system: string;
  starter: string;
  builtin: boolean;
  shared: boolean;
  shareCode: string | null;
  /** 真实使用次数：绑定该智能体的会话数 */
  uses: number;
  updatedAt: number;
}

/** 官方角色的分类映射（personas.ts 的分组 → 页面分类） */
function groupToCat(group: string): AgentCat {
  if (group === "营销" || group === "写作") return "创作";
  if (group === "职场") return "工作";
  if (group === "技术") return "开发";
  return "效率";
}

function fmtTime(ts: number): string {
  if (!ts) return "—";
  const d = Date.now() - ts;
  if (d < 60_000) return "刚刚";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)} 分钟前`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)} 小时前`;
  if (d < 172_800_000) return "昨天";
  const date = new Date(ts);
  return `${date.getMonth() + 1}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function AgentsPage() {
  const router = useRouter();
  const { startAgent } = useChatStore();

  const [custom, setCustom] = useState<AgentEx[]>([]);
  const [personaUses, setPersonaUses] = useState<Record<string, number>>({});
  const [tab, setTab] = useState(TABS[0]);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ kind: "create" } | { kind: "edit"; agent: AgentEx } | null>(null);
  const [shareTarget, setShareTarget] = useState<AgentEx | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadAgents = useCallback(async () => {
    try {
      const data = (await fetch("/api/agents").then((r) => r.json())) as {
        agents?: Array<Record<string, unknown>>;
        personaUses?: Record<string, number>;
      };
      const c: AgentEx[] = (data.agents ?? []).map((a) => ({
        id: a.id as string,
        name: a.name as string,
        desc: (a.desc as string) ?? "",
        category: (a.category as string) ?? "自定义",
        emoji: (a.emoji as string) ?? "🤖",
        system: (a.system as string) ?? "",
        starter: (a.starter as string) ?? "",
        builtin: false,
        shared: Boolean(a.shared),
        shareCode: (a.shareCode as string | null) ?? null,
        uses: data.personaUses?.[`custom:${a.id}`] ?? 0,
        updatedAt: (a.updatedAt as number) ?? 0,
      }));
      setCustom(c);
      setPersonaUses(data.personaUses ?? {});
    } catch {
      /* 数据库不可用时仅展示官方角色 */
    }
  }, []);

  useEffect(() => {
    void loadAgents();
  }, [loadAgents]);

  /** 官方智能体：来自 personas.ts，system prompt 真实生效 */
  const builtins = useMemo<AgentEx[]>(
    () =>
      PERSONAS.filter((p) => p.id !== "none").map((p) => ({
        id: p.id,
        name: p.name,
        desc: p.desc,
        category: groupToCat(p.group),
        emoji: p.emoji,
        system: p.system,
        starter: p.starter ?? "",
        builtin: true,
        shared: false,
        shareCode: null,
        uses: personaUses[p.id] ?? 0,
        updatedAt: 0,
      })),
    [personaUses]
  );

  const all = useMemo(() => [...custom, ...builtins], [custom, builtins]);

  const filtered = useMemo(() => {
    let list = all;
    if (tab === "自定义") list = list.filter((a) => !a.builtin);
    else if (tab !== "全部智能体") list = list.filter((a) => a.category === tab);
    const kw = q.trim().toLowerCase();
    if (kw) list = list.filter((a) => a.name.toLowerCase().includes(kw) || a.desc.toLowerCase().includes(kw));
    return list;
  }, [all, tab, q]);

  const selected = useMemo(
    () => all.find((a) => a.id === selectedId) ?? all[0] ?? null,
    [all, selectedId]
  );

  const start = async (a: AgentEx) => {
    await startAgent({
      id: a.id,
      name: a.name,
      emoji: a.emoji,
      system: a.system,
      starter: a.starter,
      builtin: a.builtin,
    });
    router.push("/chat");
    // 新会话绑定了该智能体，使用次数下次加载时自动 +1
    void loadAgents();
  };

  const openShare = async (a: AgentEx) => {
    if (a.builtin) {
      toast("内置智能体由官方维护，暂不支持分享", "info");
      return;
    }
    if (a.shared && a.shareCode) {
      setShareTarget(a);
      return;
    }
    try {
      const r = (await fetch(`/api/agents/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "share" }),
      }).then((res) => res.json())) as { shareCode?: string };
      if (r.shareCode) {
        await loadAgents();
        setShareTarget({ ...a, shared: true, shareCode: r.shareCode });
      }
    } catch {
      toast("分享失败，请重试", "error");
    }
  };

  const confirmDelete = async (a: AgentEx) => {
    if (deleting !== a.id) {
      setDeleting(a.id);
      setTimeout(() => setDeleting((d) => (d === a.id ? null : d)), 3000);
      return;
    }
    try {
      await fetch(`/api/agents/${a.id}`, { method: "DELETE" });
      toast(`已删除「${a.name}」`, "success");
      setDeleting(null);
      await loadAgents();
    } catch {
      toast("删除失败，请重试", "error");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--oc-bg)] text-stone-800">
      <ShellSidebar active="agents" />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* 顶栏 */}
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--oc-border-soft)] bg-[var(--oc-bg)] px-6 py-4">
          <div>
            <h1 className="text-[18px] font-semibold text-stone-900">智能体</h1>
            <p className="mt-0.5 text-[12.5px] text-stone-400">创建、管理和使用你的 AI 智能体团队</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <CreditsBadge />
            <button
              onClick={() => setModal({ kind: "create" })}
              className="ml-2 flex items-center gap-1.5 rounded-xl border border-[var(--oc-brand-border-soft)] bg-white px-4 py-2 text-[13px] font-medium text-[var(--oc-brand)] transition hover:bg-[var(--oc-brand-hover)]"
            >
              <Plus className="h-4 w-4" /> 创建智能体
            </button>
          </div>
        </header>

        {/* 内容 */}
        <div className="flex min-h-0 flex-1 overflow-hidden px-6 pb-6 pt-5">
          {/* 主区域 */}
          <div className="min-w-0 flex-1 overflow-y-auto pr-4">
            {/* 我的智能体 */}
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-stone-800">
                我的智能体
                <span className="ml-2 text-[12px] font-normal text-stone-400">{custom.length} 个</span>
              </h2>
              <button
                onClick={() => setModal({ kind: "create" })}
                className="flex items-center gap-1 text-[12.5px] text-[var(--oc-brand)] transition hover:text-[#a34c2c]"
              >
                <Plus className="h-3.5 w-3.5" /> 新建
              </button>
            </div>

            {custom.length === 0 ? (
              <button
                onClick={() => setModal({ kind: "create" })}
                className="mt-3 flex w-full flex-col items-center rounded-2xl border border-dashed border-[var(--oc-border-strong)] bg-white/60 px-4 py-8 text-center transition hover:border-[var(--oc-brand-border)] hover:bg-white"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--oc-brand-tint)] text-[var(--oc-brand)]">
                  <Sparkles className="h-5 w-5" />
                </span>
                <p className="mt-3 text-[13.5px] font-medium text-stone-600">还没有自己的智能体</p>
                <p className="mt-1 text-xs text-stone-400">定义角色、系统提示词与开场白，创建你的第一个智能体</p>
                <span className="mt-3 rounded-lg bg-gradient-to-r from-orange-400 to-red-500 px-4 py-1.5 text-[12.5px] font-medium text-white shadow-sm">
                  创建智能体
                </span>
              </button>
            ) : (
              <div className="mt-3 grid grid-cols-5 gap-3">
                {custom.map((a) => {
                  const s = CAT_STYLE[a.category as AgentCat] ?? CAT_STYLE.自定义;
                  return (
                    <div
                      key={a.id}
                      className="relative rounded-2xl border border-[var(--oc-border)] bg-white p-4 text-left shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:shadow-md"
                    >
                      <button
                        onClick={() => void openShare(a)}
                        title={a.shared ? "已分享" : "分享"}
                        className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-stone-100 ${a.shared ? "text-[var(--oc-brand)]" : "text-stone-300 hover:text-stone-500"}`}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => void start(a)} className="w-full text-left">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-stone-100 bg-[var(--oc-hover)] text-[30px]">
                          {a.emoji}
                        </div>
                        <p className="mt-3 text-center text-[14px] font-semibold text-stone-800">{a.name}</p>
                        <div className="mt-1 flex justify-center">
                          <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${s.bg} ${s.text}`}>{a.category}</span>
                        </div>
                        <p className="mt-2 text-center text-xs leading-5 text-stone-400">{a.desc || "点击开始对话"}</p>
                        <p className="mt-2 text-center text-[10.5px] text-stone-300">{a.uses} 次使用</p>
                      </button>
                      <span className={`absolute left-3 top-3 h-2 w-2 rounded-full ${s.dot}`} />
                    </div>
                  );
                })}
                <button
                  onClick={() => setModal({ kind: "create" })}
                  className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--oc-border-strong)] p-4 text-stone-400 transition hover:border-[var(--oc-brand-border)] hover:text-[var(--oc-brand)]"
                >
                  <Plus className="h-6 w-6" />
                  <span className="mt-1.5 text-[12px] font-medium">创建智能体</span>
                </button>
              </div>
            )}

            {/* 官方智能体 */}
            <div className="mt-6 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-stone-800">
                官方智能体
                <span className="ml-2 text-[12px] font-normal text-stone-400">{builtins.length} 个角色，系统提示词真实生效</span>
              </h2>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-3">
              {builtins.map((a) => {
                const s = CAT_STYLE[a.category as AgentCat] ?? CAT_STYLE.效率;
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    className="relative rounded-2xl border border-[var(--oc-border)] bg-white p-4 text-left shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:shadow-md"
                  >
                    <span className={`absolute right-3 top-3 h-2 w-2 rounded-full ${s.dot}`} />
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-stone-100 bg-[var(--oc-hover)] text-[30px]">
                      {a.emoji}
                    </div>
                    <p className="mt-3 text-center text-[14px] font-semibold text-stone-800">{a.name}</p>
                    <div className="mt-1 flex justify-center">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${s.bg} ${s.text}`}>{a.category}</span>
                    </div>
                    <p className="mt-2 text-center text-xs leading-5 text-stone-400">{a.desc}</p>
                    <p className="mt-2 text-center text-[10.5px] text-stone-300">{a.uses > 0 ? `${a.uses} 次使用` : "官方角色"}</p>
                  </button>
                );
              })}
            </div>

            {/* 列表区 */}
            <div className="mt-6 rounded-2xl border border-[var(--oc-border)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              {/* 标签栏 */}
              <div className="flex flex-wrap items-center gap-1 border-b border-[var(--oc-border-soft)] px-4 pt-3">
                {TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={
                      tab === t
                        ? "relative px-3 pb-3 pt-1 text-[13px] font-medium text-[var(--oc-brand)]"
                        : "px-3 pb-3 pt-1 text-[13px] text-stone-500 transition hover:text-stone-800"
                    }
                  >
                    {t}
                    {tab === t && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[var(--oc-brand-bright)]" />}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2 pb-2">
                  <div className="flex items-center gap-2 rounded-lg border border-[var(--oc-border)] bg-white px-3 py-1.5 text-stone-400">
                    <Search className="h-4 w-4" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="搜索智能体"
                      className="w-36 bg-transparent text-[12.5px] text-stone-700 outline-none placeholder:text-stone-400"
                    />
                  </div>
                </div>
              </div>

              {/* 表头 */}
              <div className="flex items-center px-5 py-2.5 text-[12px] text-stone-400">
                <span className="w-[42%]">名称</span>
                <span className="w-[14%]">分类</span>
                <span className="w-[13%]">使用次数</span>
                <span className="w-[16%]">更新时间</span>
                <span className="flex-1 text-right">操作</span>
              </div>

              {/* 行 */}
              {filtered.length === 0 && (
                <div className="flex flex-col items-center border-t border-[var(--oc-border-faint)] py-10 text-stone-400">
                  <Sparkles className="h-6 w-6 text-stone-300" />
                  <p className="mt-2 text-[13px]">没有匹配的智能体</p>
                  <button onClick={() => setModal({ kind: "create" })} className="mt-2 text-[12.5px] text-[var(--oc-brand)] hover:underline">
                    创建一个？
                  </button>
                </div>
              )}
              {filtered.map((a) => {
                const s = CAT_STYLE[a.category as AgentCat] ?? CAT_STYLE.自定义;
                return (
                  <div
                    key={a.id}
                    className="flex items-center border-t border-[var(--oc-border-faint)] px-5 py-3.5 transition hover:bg-[var(--oc-hover)]"
                  >
                    <button onClick={() => setSelectedId(a.id)} className="flex w-[42%] items-center gap-3 pr-2 text-left">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-stone-100 bg-[var(--oc-hover)] text-[20px]">
                        {a.emoji}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[13.5px] font-semibold text-stone-800">{a.name}</span>
                          {a.builtin && (
                            <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-400">官方</span>
                          )}
                          {!a.builtin && a.shared && (
                            <span className="rounded bg-[var(--oc-brand-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--oc-brand)]">已分享</span>
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-stone-400">{a.desc}</span>
                        <span className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium ${s.bg} ${s.text}`}>
                          {a.category}
                        </span>
                      </span>
                    </button>
                    <span className="w-[13%] text-[13px] text-stone-600">{a.uses}</span>
                    <span className="w-[16%] text-[13px] text-stone-500">{a.builtin ? "—" : fmtTime(a.updatedAt)}</span>
                    <span className="flex flex-1 items-center justify-end gap-1">
                      <button
                        onClick={() => void start(a)}
                        title={`与 ${a.name} 开始对话`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      {!a.builtin && (
                        <>
                          <button
                            onClick={() => setModal({ kind: "edit", agent: a })}
                            title="编辑"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => void openShare(a)}
                            title={a.shared ? "已分享" : "分享"}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-stone-100 hover:text-stone-600 ${a.shared ? "text-[var(--oc-brand)]" : "text-stone-400"}`}
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => void confirmDelete(a)}
                            title={deleting === a.id ? "再次点击确认删除" : "删除"}
                            className={`flex h-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-500 ${deleting === a.id ? "w-auto gap-1 bg-red-50 px-2 text-[11px] font-medium text-red-500" : "w-8"}`}
                          >
                            {deleting === a.id ? (
                              <>
                                <Trash2 className="h-4 w-4" /> 确认
                              </>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右侧详情面板 */}
          <aside className="hidden w-[340px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[var(--oc-border)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] xl:flex">
            {!selected ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-stone-400">
                <Sparkles className="h-6 w-6 text-stone-200" />
                <p className="mt-2 text-[13px]">点击列表中的智能体查看详情</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 pt-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${(CAT_STYLE[selected.category as AgentCat] ?? CAT_STYLE.自定义).bg} ${(CAT_STYLE[selected.category as AgentCat] ?? CAT_STYLE.自定义).text}`}
                  >
                    {selected.category}
                  </span>
                  <span className="text-[11px] text-stone-400">{selected.builtin ? "官方" : "自定义"}</span>
                </div>

                <div className="flex items-start gap-3 px-5 pt-2">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-stone-100 bg-[var(--oc-hover)] text-[30px]">
                    {selected.emoji}
                  </div>
                  <div className="min-w-0 pt-1">
                    <p className="text-[16px] font-semibold text-stone-800">{selected.name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 可使用
                    </p>
                    <p className="mt-1 text-[12px] text-stone-400">
                      {selected.builtin ? "内置角色 · 官方维护" : `v1.0 · ${fmtTime(selected.updatedAt)} 更新`}
                    </p>
                  </div>
                </div>

                <p className="mt-3 px-5 text-[12.5px] leading-6 text-stone-500">{selected.desc || "暂无描述"}</p>

                {/* 统计 */}
                <div className="mx-5 mt-4 grid grid-cols-3 divide-x divide-[var(--oc-border-soft)] rounded-xl border border-[var(--oc-border-soft)] py-3 text-center">
                  <div>
                    <p className="text-[18px] font-bold text-stone-800">{selected.uses}</p>
                    <p className="mt-0.5 text-[11px] text-stone-400">使用次数</p>
                  </div>
                  <div>
                    <p className="text-[18px] font-bold text-stone-800">{selected.system ? "已配置" : "—"}</p>
                    <p className="mt-0.5 text-[11px] text-stone-400">系统提示词</p>
                  </div>
                  <div>
                    <p className="text-[18px] font-bold text-stone-800">{selected.starter ? "1" : "—"}</p>
                    <p className="mt-0.5 text-[11px] text-stone-400">开场白</p>
                  </div>
                </div>

                {/* 系统提示词 */}
                <div className="mt-5 px-5">
                  <p className="text-[13.5px] font-semibold text-stone-800">系统提示词</p>
                  <div className="mt-2 max-h-36 overflow-y-auto rounded-xl border border-[var(--oc-border-soft)] bg-[var(--oc-hover)] px-3 py-2.5 text-[12px] leading-5 text-stone-500">
                    {selected.system || "未设置系统提示词"}
                  </div>
                </div>

                {/* 开场白 */}
                {selected.starter && (
                  <div className="mt-4 px-5">
                    <p className="text-[13.5px] font-semibold text-stone-800">开场白</p>
                    <button
                      onClick={() => void start(selected)}
                      className="mt-2 flex w-full items-center gap-2.5 rounded-xl border border-[var(--oc-border-soft)] px-3 py-2.5 text-left text-[12.5px] text-stone-600 transition hover:border-[var(--oc-brand-border)] hover:bg-[var(--oc-hover)]"
                    >
                      <MessageCircle className="h-4 w-4 shrink-0 text-[var(--oc-brand)]" />
                      {selected.starter}
                    </button>
                  </div>
                )}

                <div className="mt-auto flex items-center gap-2 border-t border-[var(--oc-border-soft)] p-4">
                  <button
                    onClick={() => void openShare(selected)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--oc-border)] bg-white py-2.5 text-[13px] font-medium text-stone-600 transition hover:border-[var(--oc-brand-border)]"
                  >
                    <Share2 className="h-4 w-4" />
                    {selected.builtin ? "不可分享" : selected.shared ? "查看分享" : "分享智能体"}
                  </button>
                  <button
                    onClick={() => void start(selected)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 py-2.5 text-[13px] font-medium text-white shadow-sm transition hover:brightness-105"
                  >
                    <MessageCircle className="h-4 w-4" /> 开始对话
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      </main>

      {modal && (
        <AgentModal
          edit={modal.kind === "edit" ? modal.agent : undefined}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            void loadAgents();
          }}
        />
      )}
      {shareTarget && (
        <ShareModal
          agent={shareTarget}
          onClose={() => {
            setShareTarget(null);
            void loadAgents();
          }}
        />
      )}
      <Toaster />
    </div>
  );
}

/* ---------------- 创建 / 编辑弹窗 ---------------- */

function AgentModal({
  edit,
  onClose,
  onSaved,
}: {
  edit?: AgentEx;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(edit?.name ?? "");
  const [desc, setDesc] = useState(edit?.desc ?? "");
  const [category, setCategory] = useState<AgentCat>(
    edit && edit.category in CAT_STYLE ? (edit.category as AgentCat) : "自定义"
  );
  const [emoji, setEmoji] = useState(edit?.emoji ?? "🤖");
  const [system, setSystem] = useState(edit?.system ?? "");
  const [starter, setStarter] = useState(edit?.starter ?? "");
  const [saving, setSaving] = useState(false);

  /** 从官方角色一键填充（仅创建时） */
  const applyPreset = (p: (typeof PERSONAS)[number]) => {
    if (!name.trim()) setName(p.name);
    setDesc(p.desc);
    setSystem(p.system);
    if (p.starter) setStarter(p.starter);
    setEmoji(p.emoji);
    setCategory(groupToCat(p.group));
    toast(`已载入「${p.name}」配置，可在此基础上修改`, "success");
  };

  const submit = async () => {
    if (!name.trim()) {
      toast("请填写智能体名称", "error");
      return;
    }
    setSaving(true);
    try {
      const body = JSON.stringify({
        name: name.trim(),
        desc: desc.trim(),
        category,
        emoji,
        system: system.trim(),
        starter: starter.trim(),
      });
      const res = await fetch(edit ? `/api/agents/${edit.id}` : "/api/agents", {
        method: edit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const data = (await res.json()) as { error?: string; agent?: { id: string } };
      if (!res.ok || !data.agent) {
        toast(data.error ?? "保存失败", "error");
        setSaving(false);
        return;
      }
      toast(
        edit ? `已更新「${name.trim()}」` : `已创建智能体「${name.trim()}」，点击列表卡片即可对话`,
        "success"
      );
      onSaved();
    } catch {
      toast("网络错误，保存失败", "error");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--oc-border-soft)] px-5 py-4">
          <div>
            <p className="text-[15px] font-semibold text-stone-800">{edit ? "编辑智能体" : "创建智能体"}</p>
            <p className="mt-0.5 text-[12px] text-stone-400">
              {edit
                ? "修改后新对话立即生效，历史对话保留原提示词"
                : "系统提示词会在每次对话时注入，决定 AI 的角色行为"}
            </p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {/* 官方角色预设（仅创建） */}
          {!edit && (
            <div>
              <p className="text-[12.5px] font-medium text-stone-600">从官方角色开始（可选）</p>
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                {PERSONAS.filter((p) => p.id !== "none")
                  .slice(0, 8)
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(p)}
                      title={p.desc}
                      className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] text-stone-500 transition hover:border-[var(--oc-brand-border)] hover:bg-[var(--oc-brand-tint)] hover:text-[var(--oc-brand)] ${
                        system === p.system ? "border-[var(--oc-brand-border)] bg-[var(--oc-brand-tint)] text-[var(--oc-brand)]" : "border-[var(--oc-border)]"
                      }`}
                    >
                      <span>{p.emoji}</span> {p.name}
                    </button>
                  ))}
              </div>
              <p className="mt-1 text-[10.5px] text-stone-400">一键填入角色描述、系统提示词与开场白，再按需修改</p>
            </div>
          )}

          {/* 头像 */}
          <div>
            <p className="text-[12.5px] font-medium text-stone-600">头像表情</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-[18px] transition ${emoji === e ? "border-[var(--oc-brand-border)] bg-[var(--oc-brand-tint)]" : "border-[var(--oc-border)] hover:bg-[var(--oc-hover)]"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[12.5px] font-medium text-stone-600">
              名称 <span className="text-red-400">*</span>
            </p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="如：小红书爆款文案官"
              className="mt-1.5 w-full rounded-xl border border-[var(--oc-border)] px-3 py-2 text-[13px] text-stone-800 outline-none transition focus:border-[var(--oc-brand-border)]"
            />
          </div>

          <div>
            <p className="text-[12.5px] font-medium text-stone-600">描述</p>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              maxLength={200}
              placeholder="一句话说明这个智能体擅长什么"
              className="mt-1.5 w-full rounded-xl border border-[var(--oc-border)] px-3 py-2 text-[13px] text-stone-800 outline-none transition focus:border-[var(--oc-brand-border)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[12.5px] font-medium text-stone-600">分类</p>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AgentCat)}
                className="mt-1.5 w-full rounded-xl border border-[var(--oc-border)] px-3 py-2 text-[13px] text-stone-800 outline-none focus:border-[var(--oc-brand-border)]"
              >
                {AGENT_CATS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[12.5px] font-medium text-stone-600">开场白（可选）</p>
              <input
                value={starter}
                onChange={(e) => setStarter(e.target.value)}
                maxLength={200}
                placeholder="进入对话时预填的问题"
                className="mt-1.5 w-full rounded-xl border border-[var(--oc-border)] px-3 py-2 text-[13px] text-stone-800 outline-none transition focus:border-[var(--oc-brand-border)]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-[12.5px] font-medium text-stone-600">系统提示词</p>
              <span className="text-[11px] text-stone-300">{system.length} / 8000</span>
            </div>
            <textarea
              value={system}
              onChange={(e) => setSystem(e.target.value)}
              maxLength={8000}
              rows={6}
              placeholder={"例：你是资深小红书运营，擅长种草文案……\n要求：标题有悬念、正文有情绪、结尾有行动号召。"}
              className="mt-1.5 w-full resize-none rounded-xl border border-[var(--oc-border)] px-3 py-2 text-[12.5px] leading-5 text-stone-800 outline-none transition focus:border-[var(--oc-brand-border)]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[var(--oc-border-soft)] px-5 py-4">
          <p className="text-[11px] text-stone-400">共有 {EMOJIS.length} 个表情可选，提示词支持 8000 字</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-xl border border-[var(--oc-border)] px-4 py-2 text-[13px] text-stone-500 transition hover:bg-[var(--oc-hover)]">
              取消
            </button>
            <button
              onClick={() => void submit()}
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-orange-400 to-red-500 px-5 py-2 text-[13px] font-medium text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
            >
              {saving ? "保存中…" : edit ? "保存修改" : "创建智能体"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 分享弹窗 ---------------- */

function ShareModal({ agent, onClose }: { agent: AgentEx; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const link = agent.shareCode ? `${typeof window !== "undefined" ? window.location.origin : ""}/s/${agent.shareCode}` : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast("分享链接已复制", "success");
    } catch {
      toast("复制失败，请手动复制", "error");
    }
  };

  const unshare = async () => {
    if (!confirm("取消分享后，该链接将失效，确定吗？")) return;
    try {
      await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unshare" }),
      });
      toast("已取消分享", "success");
      onClose();
    } catch {
      toast("取消失败，请重试", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--oc-brand-tint)] text-[20px]">{agent.emoji}</span>
            <div>
              <p className="text-[15px] font-semibold text-stone-800">{agent.name}</p>
              <p className="mt-0.5 text-[12px] text-stone-400">分享智能体</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-[12.5px] leading-5 text-stone-500">
          任何打开此链接的人都可以在 OpenCanvas 中使用该智能体（包含系统提示词与开场白）。
        </p>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--oc-border)] bg-[var(--oc-hover)] px-3 py-2.5">
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-stone-600">{link}</span>
          <button
            onClick={() => void copy()}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-gradient-to-r from-orange-400 to-red-500 px-3 py-1.5 text-[12px] font-medium text-white transition hover:brightness-105"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "已复制" : "复制链接"}
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--oc-border)] py-2.5 text-[12.5px] font-medium text-stone-600 transition hover:border-[var(--oc-brand-border)]"
          >
            <Play className="h-4 w-4" /> 预览分享页
          </a>
          <button
            onClick={() => void unshare()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-100 py-2.5 text-[12.5px] font-medium text-red-500 transition hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" /> 取消分享
          </button>
        </div>
      </div>
    </div>
  );
}
