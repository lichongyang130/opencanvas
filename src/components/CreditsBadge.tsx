"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Coins, Gift, History, Sparkles, Upload, Share2 } from "lucide-react";
import { toast } from "@/lib/store/toast";

/** 到账弹跳动效 */
function Bump({ children }: { children: React.ReactNode }) {
  const [bump, setBump] = useState(false);
  useEffect(() => {
    setBump(true);
    const t = setTimeout(() => setBump(false), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <span className={`inline-block transition-transform ${bump ? "scale-125" : "scale-100"}`}>{children}</span>
  );
}

interface LedgerRow {
  id: string;
  delta: number;
  reason: string;
  ref: string | null;
  createdAt: number;
}

interface Tasks {
  checkin: { title: string; reward: number; done: boolean };
  upload: { title: string; reward: number; done: boolean };
  share: { title: string; reward: number; done: boolean };
}

function fmtTime(ts: number): string {
  const d = Date.now() - ts;
  if (d < 60_000) return "刚刚";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)} 分钟前`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)} 小时前`;
  if (d < 172_800_000) return "昨天";
  const date = new Date(ts);
  return `${date.getMonth() + 1}-${String(date.getDate()).padStart(2, "0")}`;
}

const TASK_ICON = { checkin: Gift, upload: Upload, share: Share2 } as const;

/** 顶栏积分徽章：真实余额（AI 调用扣减、任务奖励入账）
 *  面板经 React Portal 挂到 body + fixed + 最高层级，保证永远显示在最外层。 */
export default function CreditsBadge() {
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [tasks, setTasks] = useState<Tasks | null>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = (await fetch("/api/credits").then((r) => r.json())) as {
        balance?: number;
        ledger?: LedgerRow[];
        tasks?: Tasks;
      };
      setBalance(data.balance ?? 0);
      setLedger(data.ledger ?? []);
      setTasks(data.tasks ?? null);
    } catch {
      /* 忽略 */
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

  const checkin = async () => {
    try {
      const r = (await fetch("/api/credits/checkin", { method: "POST" }).then((res) => res.json())) as {
        ok?: boolean;
        error?: string;
      };
      if (!r.ok) {
        toast(r.error ?? "签到失败", "error");
        return;
      }
      toast("签到成功 +10 积分", "success");
      await load();
    } catch {
      toast("签到失败，请重试", "error");
    }
  };

  return (
    <>
      <div className="relative" ref={btnRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          title="积分中心"
          className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-stone-500 transition hover:bg-white hover:text-stone-700"
        >
          <Coins className="h-[17px] w-[17px] text-amber-500" />
          <Bump key={balance ?? "none"}>
            <span className="text-[12.5px] font-semibold tabular-nums text-amber-600">{balance ?? "—"}</span>
          </Bump>
        </button>
      </div>

      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: pos.top, right: pos.right }}
            className="fixed z-[9999] w-[340px] overflow-hidden rounded-2xl border border-[var(--oc-border)] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--oc-border-soft)] bg-gradient-to-r from-amber-50/70 to-transparent px-4 py-3">
              <div>
                <p className="text-[13.5px] font-semibold text-stone-800">积分中心</p>
                <p className="mt-0.5 text-[11px] text-stone-400">AI 调用按真实用量扣减，任务赚取积分</p>
              </div>
              <span className="flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-[14px] font-bold text-amber-600 shadow-sm">
                <Coins className="h-4 w-4" /> {balance ?? "—"}
              </span>
            </div>

            {tasks && (
              <div className="border-b border-[var(--oc-border-soft)] px-4 py-3">
                <p className="text-[12px] font-medium text-stone-500">今日任务</p>
                <div className="mt-2 space-y-1.5">
                  {(["checkin", "upload", "share"] as const).map((key) => {
                    const t = tasks[key];
                    const Icon = TASK_ICON[key];
                    return (
                      <div key={key} className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1 text-[12.5px] text-stone-600">{t.title}</span>
                        <span className="text-[11px] text-stone-400">+{t.reward}</span>
                        {key === "checkin" ? (
                          <button
                            onClick={() => void checkin()}
                            disabled={t.done}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                              t.done
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-gradient-to-r from-orange-400 to-red-500 text-white hover:brightness-105"
                            }`}
                          >
                            {t.done ? "已签到" : "签到"}
                          </button>
                        ) : (
                          <span className={`rounded-lg px-2.5 py-1 text-[11px] font-medium ${t.done ? "bg-emerald-50 text-emerald-600" : "bg-stone-100 text-stone-400"}`}>
                            {t.done ? "已完成" : "未完成"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="px-4 py-3">
              <p className="flex items-center gap-1.5 text-[12px] font-medium text-stone-500">
                <History className="h-3.5 w-3.5" /> 最近流水
              </p>
              <div className="mt-2 max-h-56 space-y-0.5 overflow-y-auto">
                {ledger.length === 0 && (
                  <p className="py-4 text-center text-[11.5px] text-stone-300">还没有积分记录</p>
                )}
                {ledger.slice(0, 12).map((l) => (
                  <div key={l.id} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5">
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-stone-600">{l.reason}</span>
                    <span
                      className={`text-[12px] font-semibold tabular-nums ${l.delta >= 0 ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {l.delta >= 0 ? `+${l.delta}` : l.delta}
                    </span>
                    <span className="w-14 text-right text-[10.5px] text-stone-300">{fmtTime(l.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 border-t border-[var(--oc-border-soft)] bg-[var(--oc-hover)] px-4 py-2.5 text-[11px] text-stone-400">
              <Sparkles className="h-3 w-3" />
              上传文档 +5 · 创建智能体/模板/知识库 +3 · 分享智能体 +3（按次计算）
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
