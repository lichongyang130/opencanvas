"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Coins,
  Gift,
  History,
  Sparkles,
  Upload,
  Share2,
  X,
} from "lucide-react";
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
const TASK_TINT = {
  checkin: "bg-amber-100/80 text-amber-600",
  upload: "bg-sky-100/80 text-sky-600",
  share: "bg-violet-100/80 text-violet-600",
} as const;

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
            className="oc-pop-in fixed z-[9999] w-[350px] overflow-hidden rounded-2xl border border-[var(--oc-border)] bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)]"
          >
            {/* ===== 头部：品牌渐变 + 余额 Hero ===== */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#c05f3c] via-[#d96a3b] to-[#f08a4b] px-5 pb-5 pt-4">
              {/* 装饰光斑 */}
              <span className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/15 blur-md" />
              <span className="pointer-events-none absolute right-16 -bottom-12 h-24 w-24 rounded-full bg-orange-300/25 blur-lg" />
              <span className="pointer-events-none absolute left-24 top-2 h-10 w-10 rounded-full bg-white/10 blur-sm" />

              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[13.5px] font-semibold text-white">积分中心</p>
                  <p className="mt-0.5 text-[11px] text-orange-50/85">AI 调用按真实用量扣减，任务赚取积分</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/15 hover:text-white"
                  title="关闭"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-medium tracking-wide text-orange-50/80">可用积分</p>
                  <p className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="text-[30px] font-bold leading-none text-white">
                      {balance === null ? "—" : balance.toLocaleString("zh-CN")}
                    </span>
                    <span className="text-[11px] text-orange-50/75">分</span>
                  </p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[10.5px] font-medium text-white backdrop-blur-sm">
                  <Sparkles className="h-3 w-3" /> 每 1 元 ≈ 2 积分
                </span>
              </div>
            </div>

            {/* ===== 今日任务 ===== */}
            <div className="px-4 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-[11.5px] font-semibold uppercase tracking-wide text-stone-400">今日任务</p>
                {tasks && (
                  <span className="text-[10.5px] text-stone-300">
                    {(["checkin", "upload", "share"] as const).filter((k) => tasks[k].done).length}/3 完成
                  </span>
                )}
              </div>
              <div className="mt-2 space-y-1.5">
                {tasks &&
                  (["checkin", "upload", "share"] as const).map((key, idx) => {
                    const t = tasks[key];
                    const Icon = TASK_ICON[key];
                    return (
                      <div
                        key={key}
                        className={`oc-fade-slide flex items-center gap-2.5 rounded-xl border px-2.5 py-2 transition ${
                          t.done
                            ? "border-emerald-100 bg-emerald-50/50"
                            : "border-[var(--oc-border-soft)] bg-[var(--oc-panel-muted)]"
                        }`}
                        style={{ animationDelay: `${idx * 40}ms` }}
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TASK_TINT[key]}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12.5px] font-medium text-stone-700">{t.title}</span>
                          <span className="block text-[10.5px] text-stone-400">+{t.reward} 积分</span>
                        </span>
                        {key === "checkin" ? (
                          <button
                            onClick={() => void checkin()}
                            disabled={t.done}
                            className={`flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition ${
                              t.done
                                ? "cursor-default bg-emerald-500/10 text-emerald-600"
                                : "oc-pulse-ring bg-gradient-to-r from-orange-400 to-red-500 text-white hover:brightness-105"
                            }`}
                          >
                            {t.done ? (
                              <>
                                <Check className="h-3 w-3" /> 已签到
                              </>
                            ) : (
                              "签到"
                            )}
                          </button>
                        ) : (
                          <span
                            className={`flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] ${
                              t.done ? "bg-emerald-500/10 font-medium text-emerald-600" : "bg-stone-100 text-stone-400"
                            }`}
                          >
                            {t.done ? (
                              <>
                                <Check className="h-3 w-3" /> 已完成
                              </>
                            ) : (
                              "未完成"
                            )}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* ===== 最近流水 ===== */}
            <div className="px-4 pt-4">
              <p className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-stone-400">
                <History className="h-3.5 w-3.5" /> 最近流水
              </p>
              <div className="mt-2 max-h-52 space-y-0.5 overflow-y-auto pb-1">
                {ledger.length === 0 && (
                  <div className="flex flex-col items-center py-6 text-stone-300">
                    <Coins className="h-5 w-5" />
                    <p className="mt-1.5 text-[11.5px]">还没有积分记录</p>
                  </div>
                )}
                {ledger.slice(0, 12).map((l) => {
                  const positive = l.delta >= 0;
                  return (
                    <div
                      key={l.id}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-[var(--oc-hover)]"
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                          positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                        }`}
                      >
                        {positive ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-stone-600">{l.reason}</span>
                      <span
                        className={`text-[12.5px] font-bold tabular-nums ${positive ? "text-emerald-600" : "text-red-500"}`}
                      >
                        {positive ? `+${l.delta}` : l.delta}
                      </span>
                      <span className="w-12 shrink-0 text-right text-[10px] text-stone-300">{fmtTime(l.createdAt)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ===== 底部规则 ===== */}
            <div className="mt-1 flex items-start gap-2 border-t border-[var(--oc-border-faint)] bg-[var(--oc-panel-muted)] px-4 py-3">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[#f08a4b]" />
              <p className="text-[10.5px] leading-4 text-stone-400">
                上传文档 <span className="font-semibold text-[#c05f3c]">+5</span> · 创建智能体/模板/知识库
                <span className="font-semibold text-[#c05f3c]"> +3</span> · 分享智能体
                <span className="font-semibold text-[#c05f3c]"> +3</span> · 每日签到
                <span className="font-semibold text-[#c05f3c]"> +10</span>
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
