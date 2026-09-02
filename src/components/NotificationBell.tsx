"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  Bot,
  CheckCheck,
  FileText,
  Info,
  LayoutTemplate,
  Sparkles,
  X,
} from "lucide-react";

interface NotiItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: number;
}

const TYPE_META: Record<string, { icon: typeof Info; tint: string; label: string }> = {
  doc: { icon: FileText, tint: "bg-sky-50 text-sky-600", label: "文档" },
  template: { icon: LayoutTemplate, tint: "bg-orange-50 text-orange-600", label: "模板" },
  agent: { icon: Bot, tint: "bg-violet-50 text-violet-600", label: "智能体" },
  kb: { icon: BookOpen, tint: "bg-emerald-50 text-emerald-600", label: "知识库" },
  info: { icon: Info, tint: "bg-stone-100 text-stone-500", label: "通知" },
};

function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  if (d < 60_000) return "刚刚";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)} 分钟前`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)} 小时前`;
  if (d < 172_800_000) return "昨天";
  const date = new Date(ts);
  return `${date.getMonth() + 1}-${String(date.getDate()).padStart(2, "0")}`;
}

/** 顶栏通知铃铛：真实通知列表 / 未读角标 / 点击跳转 / 全部已读
 *  面板经 React Portal 挂到 body + fixed + 最高层级，保证永远显示在最外层。 */
export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotiItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = (await fetch("/api/notifications").then((r) => r.json())) as {
        notifications?: NotiItem[];
        unread?: number;
      };
      setItems(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      /* 忽略网络错误 */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // 打开时计算面板位置（相对视口 fixed），滚动/缩放时保持跟随按钮
  useEffect(() => {
    if (!open) return;
    const calc = () => {
      const rect = btnRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({
        top: Math.max(8, rect.bottom + 8),
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };
    calc();
    window.addEventListener("resize", calc);
    window.addEventListener("scroll", calc, true);
    return () => {
      window.removeEventListener("resize", calc);
      window.removeEventListener("scroll", calc, true);
    };
  }, [open]);

  // 点击面板/按钮外部关闭
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markRead = async (ids?: string[]) => {
    const next = items.filter((n) => !n.read).map((n) => n.id);
    const target = ids ?? next;
    if (target.length === 0) return;
    setItems((s) => s.map((n) => (target.includes(n.id) ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - target.length));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: target }),
      });
    } catch {
      /* 忽略 */
    }
  };

  const openItem = (n: NotiItem) => {
    if (!n.read) void markRead([n.id]);
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const unreadItems = items.filter((n) => !n.read);
  const readItems = items.filter((n) => n.read);

  return (
    <>
      <div className="relative" ref={btnRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white hover:text-stone-700"
          title="通知"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--oc-accent)] px-1 text-[9px] font-bold text-white shadow-sm">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </div>

      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: pos.top, right: pos.right }}
            className="oc-pop-in fixed z-[9999] w-[370px] overflow-hidden rounded-2xl border border-[var(--oc-border)] bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)]"
          >
            {/* ===== 头部 ===== */}
            <div className="relative overflow-hidden border-b border-[var(--oc-border-soft)] bg-gradient-to-r from-[var(--oc-brand-tint)] via-white to-white px-4 py-3.5">
              <span className="pointer-events-none absolute -left-6 -top-8 h-20 w-20 rounded-full bg-[#f08a4b]/10 blur-lg" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-sm shadow-orange-200">
                    <Bell className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[13.5px] font-semibold text-stone-800">通知</p>
                    <p className="text-[10.5px] text-stone-400">
                      {unread > 0 ? `${unread} 条未读` : "全部已读"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => void markRead()}
                    disabled={unread === 0}
                    className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-stone-400 transition hover:bg-[var(--oc-hover)] hover:text-[var(--oc-brand)] disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> 全部已读
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-300 transition hover:bg-[var(--oc-hover)] hover:text-stone-500"
                    title="关闭"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* ===== 列表 ===== */}
            <div className="max-h-[440px] overflow-y-auto">
              {items.length === 0 && (
                <div className="flex flex-col items-center px-6 py-12">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-50 to-rose-50">
                    <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-400/10 to-red-500/10 blur-md" />
                    <Bell className="relative h-6 w-6 text-[#f08a4b]" />
                  </div>
                  <p className="mt-3 text-[13px] font-medium text-stone-500">暂无通知</p>
                  <p className="mt-1 text-[11.5px] text-stone-300">上传文档、创建智能体、提交模板后这里会实时提醒</p>
                </div>
              )}

              {unreadItems.length > 0 && (
                <div>
                  {unreadItems.map((n, idx) => {
                    const meta = TYPE_META[n.type] ?? TYPE_META.info;
                    return (
                      <NotiRow
                        key={n.id}
                        n={n}
                        meta={meta}
                        unread
                        delay={idx * 35}
                        onClick={() => openItem(n)}
                      />
                    );
                  })}
                </div>
              )}

              {unreadItems.length > 0 && readItems.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-2">
                  <span className="h-px flex-1 bg-[var(--oc-border-faint)]" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-stone-300">更早</span>
                  <span className="h-px flex-1 bg-[var(--oc-border-faint)]" />
                </div>
              )}

              {readItems.length > 0 && (
                <div>
                  {readItems.map((n) => {
                    const meta = TYPE_META[n.type] ?? TYPE_META.info;
                    return <NotiRow key={n.id} n={n} meta={meta} onClick={() => openItem(n)} />;
                  })}
                </div>
              )}
            </div>

            {/* ===== 底部 ===== */}
            <div className="flex items-center justify-between border-t border-[var(--oc-border-faint)] bg-[var(--oc-panel-muted)] px-4 py-2.5">
              <p className="flex items-center gap-1.5 text-[10.5px] text-stone-400">
                <Sparkles className="h-3 w-3 text-[#f08a4b]" />
                上传文档 / 创建智能体 / 提交模板 / 新建知识库时自动提醒
              </p>
              <span className="rounded-full bg-[var(--oc-brand-tint)] px-2 py-0.5 text-[10px] font-medium text-[var(--oc-brand)]">
                {items.length} 条
              </span>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

/* ---------------- 通知行 ---------------- */

function NotiRow({
  n,
  meta,
  unread,
  delay,
  onClick,
}: {
  n: NotiItem;
  meta: { icon: typeof Info; tint: string; label: string };
  unread?: boolean;
  delay?: number;
  onClick: () => void;
}) {
  const Icon = meta.icon;
  return (
    <button
      onClick={onClick}
      className={`oc-fade-slide group relative flex w-full items-start gap-3 px-4 py-3 text-left transition ${
        unread ? "bg-[var(--oc-bg)] hover:bg-[var(--oc-hover)]" : "opacity-75 hover:opacity-100 hover:bg-[var(--oc-hover)]"
      }`}
      style={delay !== undefined ? { animationDelay: `${delay}ms` } : undefined}
    >
      {/* 未读左侧强调条 */}
      {unread && (
        <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-orange-400 to-red-500" />
      )}

      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.tint}`}>
        <Icon className="h-4 w-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className={`truncate text-[12.5px] font-semibold ${unread ? "text-stone-800" : "text-stone-600"}`}>
              {n.title}
            </span>
            {unread && <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--oc-accent)]" />}
          </span>
          <span className="shrink-0 text-[10px] text-stone-300">{timeAgo(n.createdAt)}</span>
        </span>
        {n.body && (
          <span className="mt-0.5 block truncate text-[11.5px] text-stone-400 transition group-hover:text-stone-500">
            {n.body}
          </span>
        )}
        <span className="mt-1 flex items-center gap-1.5">
          <span className="rounded bg-[var(--oc-brand-tint)] px-1.5 py-0.5 text-[9.5px] font-medium text-[var(--oc-brand)]">
            {meta.label}
          </span>
          <span className="text-[9.5px] text-stone-300">点击查看</span>
        </span>
      </span>
    </button>
  );
}
