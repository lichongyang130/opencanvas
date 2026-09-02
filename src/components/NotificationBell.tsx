"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Bell, BookOpen, Bot, CheckCheck, FileText, Info, LayoutTemplate } from "lucide-react";

interface NotiItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: number;
}

const TYPE_ICON: Record<string, { icon: typeof Info; tint: string }> = {
  doc: { icon: FileText, tint: "bg-sky-50 text-sky-600" },
  template: { icon: LayoutTemplate, tint: "bg-orange-50 text-orange-600" },
  agent: { icon: Bot, tint: "bg-violet-50 text-violet-600" },
  kb: { icon: BookOpen, tint: "bg-emerald-50 text-emerald-600" },
  info: { icon: Info, tint: "bg-stone-100 text-stone-500" },
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
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--oc-accent)] px-1 text-[9px] font-bold text-white">
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
            className="fixed z-[9999] w-[360px] overflow-hidden rounded-2xl border border-[var(--oc-border)] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--oc-border-soft)] px-4 py-3">
              <p className="text-[13.5px] font-semibold text-stone-800">通知</p>
              <button
                onClick={() => void markRead()}
                disabled={unread === 0}
                className="flex items-center gap-1 text-[11.5px] text-stone-400 transition hover:text-[var(--oc-brand)] disabled:opacity-40"
              >
                <CheckCheck className="h-3.5 w-3.5" /> 全部已读
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {items.length === 0 && (
                <div className="flex flex-col items-center px-6 py-10 text-stone-400">
                  <Bell className="h-6 w-6 text-stone-200" />
                  <p className="mt-2 text-[12.5px]">暂无通知</p>
                  <p className="mt-1 text-[11px] text-stone-300">上传文档、创建智能体、提交模板后这里会实时提醒</p>
                </div>
              )}
              {items.map((n) => {
                const meta = TYPE_ICON[n.type] ?? TYPE_ICON.info;
                return (
                  <button
                    key={n.id}
                    onClick={() => openItem(n)}
                    className={`flex w-full items-start gap-3 border-b border-[var(--oc-border-faint)] px-4 py-3 text-left transition hover:bg-[var(--oc-hover)] ${n.read ? "opacity-70" : "bg-[var(--oc-bg)]"}`}
                  >
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.tint}`}>
                      <meta.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[12.5px] font-medium text-stone-700">{n.title}</span>
                        {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--oc-accent)]" />}
                      </span>
                      {n.body && <span className="mt-0.5 block truncate text-[11.5px] text-stone-400">{n.body}</span>}
                      <span className="mt-0.5 block text-[10.5px] text-stone-300">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
