"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Coins, CreditCard, Gauge, Receipt, TrendingUp, Wallet, Zap } from "lucide-react";
import { ShellSidebar } from "@/components/mockup/ShellSidebar";
import { useI18n } from "@/lib/i18n";
import { toast } from "@/lib/store/toast";
import { Toaster } from "@/components/Toaster";

type LedgerRow = { id: string; delta: number; reason: string; ref: string | null; createdAt: number };
type StatsPoint = { date: string; calls: number; errors: number; inputTokens: number; outputTokens: number; costUsd: number; credits: number };
type Stats = {
  today: StatsPoint;
  week: StatsPoint[];
  totals: StatsPoint;
  byModel: { modelId: string; providerId: string; calls: number; costUsd: number; credits: number }[];
  latest: { modelId: string; providerId: string; status: string; costUsd: number; createdAt: number }[];
};

const PACKS = [
  { id: "small", credits: 100, bonus: 0, price: 6, labelKey: "小包" },
  { id: "medium", credits: 1000, bonus: 120, price: 56, labelKey: "畅享包" },
  { id: "large", credits: 5000, bonus: 800, price: 266, labelKey: "大包" },
] as const;

function fmtDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fmtMoney(usd: number): string {
  return usd < 0.01 ? "$0.00" : `$${usd.toFixed(2)}`;
}

/** 流水 reason 是入库中文，充值类为「充值：{包名}」动态串，按前缀拆分翻译 */
function fmtReason(reason: string, tt: (s: string) => string): string {
  const m = /^充值：(.+)$/.exec(reason);
  if (m) return `${tt("充值")}：${tt(m[1])}`;
  return tt(reason);
}

export default function BillingPage() {
  const { tt } = useI18n();
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [cr, sr] = await Promise.all([
        fetch("/api/credits?limit=200").then((r) => r.json()),
        fetch("/api/gateway/stats?scope=me").then((r) => r.json()),
      ]);
      setBalance(cr.balance ?? 0);
      setLedger(cr.ledger ?? []);
      setStats(sr.stats ?? null);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const buy = async (packId: string) => {
    setBusy(packId);
    try {
      const r = (await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      }).then((res) => res.json())) as { ok?: boolean; error?: string; total?: number; balance?: number };
      if (!r.ok) throw new Error(r.error ?? tt("购买失败"));
      toast(tt("已到账 {n} 积分", { n: r.total ?? 0 }), "success");
      await refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : tt("购买失败"), "error");
    } finally {
      setBusy(null);
    }
  };

  const weekMax = Math.max(1, ...(stats?.week.map((w) => w.credits) ?? [1]));

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--oc-bg)] text-stone-800">
      <ShellSidebar active="billing" />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--oc-border-soft)] bg-[var(--oc-bg)] px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/membership")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--oc-border)] bg-white text-stone-500 transition hover:bg-[var(--oc-hover)]"
              aria-label={tt("返回会员中心")}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-[18px] font-semibold text-stone-900">{tt("用量与账单")}</h1>
              <p className="mt-0.5 text-[12.5px] text-stone-400">{tt("积分余额、充值套餐与模型调用消耗明细")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-[var(--oc-border)] bg-white px-3 py-1.5 text-[12.5px] text-stone-600">
              <Wallet className="h-3.5 w-3.5 text-amber-500" />
              {tt("余额")}：<b className="tabular-nums">{balance ?? "—"}</b> {tt("积分")}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 pb-8 pt-5">
          <div className="mx-auto w-full max-w-[1180px] space-y-5">
            {/* 充值包 */}
            <section className="rounded-2xl border border-[var(--oc-border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Zap className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-[15px] font-semibold text-stone-800">{tt("积分充值")}</h2>
                  <p className="text-[11.5px] text-stone-400">{tt("演示环境：点击即模拟支付成功并到账，正式支付通道将在上线时接入")}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {PACKS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => void buy(p.id)}
                    disabled={busy !== null}
                    className="group relative flex flex-col items-center rounded-2xl border border-[var(--oc-border)] bg-gradient-to-b from-white to-[var(--oc-panel-muted)] p-4 text-center shadow-sm transition hover:border-[var(--oc-brand-border)] hover:shadow-md disabled:opacity-60"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                      <Coins className="h-4 w-4" />
                    </span>
                    <span className="mt-2 text-[15px] font-bold text-stone-800">{p.credits.toLocaleString()}</span>
                    <span className="text-[11px] text-stone-400">{tt(p.labelKey)}</span>
                    {p.bonus > 0 && (
                      <span className="mt-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-600">
                        {tt("赠 {n} 积分", { n: p.bonus })}
                      </span>
                    )}
                    <span className="mt-2 text-[13px] font-semibold text-[var(--oc-brand)]">¥{p.price}</span>
                    <span className="mt-1 text-[10.5px] text-stone-300">
                      {busy === p.id ? tt("处理中…") : tt("立即购买")}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* 用量概览 */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { icon: Gauge, tint: "bg-sky-50 text-sky-600", label: tt("今日调用"), value: String(stats?.today.calls ?? 0), sub: tt("近 7 天 {n} 次", { n: stats?.totals.calls ?? 0 }) },
                { icon: Zap, tint: "bg-amber-50 text-amber-600", label: tt("消耗积分"), value: String(stats?.today.credits ?? 0), sub: tt("近 7 天 {n} 积分", { n: stats?.totals.credits ?? 0 }) },
                { icon: TrendingUp, tint: "bg-emerald-50 text-emerald-600", label: tt("内部成本"), value: fmtMoney(stats?.today.costUsd ?? 0), sub: tt("近 7 天 {n}", { n: fmtMoney(stats?.totals.costUsd ?? 0) }) },
                { icon: Receipt, tint: "bg-rose-50 text-rose-600", label: tt("失败调用"), value: String(stats?.today.errors ?? 0), sub: tt("近 7 天 {n} 次", { n: stats?.totals.errors ?? 0 }) },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl border border-[var(--oc-border)] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.tint}`}>
                    <c.icon className="h-4 w-4" />
                  </span>
                  <p className="mt-2 text-[12px] text-stone-400">{c.label}</p>
                  <p className="text-[20px] font-bold tabular-nums text-stone-800">{c.value}</p>
                  <p className="text-[10.5px] text-stone-300">{c.sub}</p>
                </div>
              ))}
            </div>

            {/* 近 7 天趋势 + 按模型 */}
            <div className="grid gap-3 lg:grid-cols-2">
              <section className="rounded-2xl border border-[var(--oc-border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                <h2 className="text-[14px] font-semibold text-stone-800">{tt("近 7 天消耗")}</h2>
                <div className="mt-3 flex h-32 items-end gap-2">
                  {stats?.week.map((w) => (
                    <div key={w.date} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] tabular-nums text-stone-400">{w.credits}</span>
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-[var(--oc-brand)] to-[var(--oc-brand-bright)] transition-all"
                        style={{ height: `${Math.max(4, (w.credits / weekMax) * 100)}%` }}
                      />
                      <span className="text-[10px] text-stone-300">{w.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
                {stats?.week.length === 0 && (
                  <p className="mt-4 text-center text-xs text-stone-300">{tt("暂无用量数据")}</p>
                )}
              </section>

              <section className="rounded-2xl border border-[var(--oc-border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                <h2 className="text-[14px] font-semibold text-stone-800">{tt("按模型消耗")}</h2>
                <div className="mt-3 space-y-2">
                  {(stats?.byModel ?? []).length === 0 && (
                    <p className="py-4 text-center text-xs text-stone-300">{tt("暂无用量数据")}</p>
                  )}
                  {(stats?.byModel ?? []).map((m) => (
                    <div key={`${m.providerId}:${m.modelId}`} className="flex items-center gap-2 text-[12.5px]">
                      <span className="w-40 truncate font-medium text-stone-700">{m.modelId}</span>
                      <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-400">{m.providerId}</span>
                      <span className="flex-1" />
                      <span className="tabular-nums text-stone-500">{m.calls} {tt("次")}</span>
                      <span className="w-16 text-right tabular-nums text-stone-400">{fmtMoney(m.costUsd)}</span>
                      <span className="w-14 text-right tabular-nums font-medium text-stone-700">{m.credits} {tt("积分")}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* 积分流水 */}
            <section className="rounded-2xl border border-[var(--oc-border)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between border-b border-[var(--oc-border-soft)] px-5 py-3.5">
                <h2 className="text-[14px] font-semibold text-stone-800">{tt("积分流水")}</h2>
                <span className="text-[11px] text-stone-400">{tt("共 {n} 条", { n: ledger.length })}</span>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {loading && <p className="px-5 py-6 text-center text-xs text-stone-300">{tt("加载中…")}</p>}
                {!loading && ledger.length === 0 && (
                  <p className="px-5 py-6 text-center text-xs text-stone-300">{tt("暂无积分流水")}</p>
                )}
                {ledger.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 border-b border-[var(--oc-border-faint)] px-5 py-3 text-[12.5px]">
                    <span className={`min-w-[44px] text-center text-[13px] font-bold tabular-nums ${l.delta >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                      {l.delta >= 0 ? `+${l.delta}` : l.delta}
                    </span>
                    <span className="flex-1 truncate text-stone-600">{fmtReason(l.reason, tt)}</span>
                    <span className="hidden text-[11px] text-stone-300 sm:block">{l.ref ?? "—"}</span>
                    <span className="shrink-0 text-[11px] tabular-nums text-stone-400">{fmtDate(l.createdAt)}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 最近调用（只读辅助展示，无需内嵌全部网关日志） */}
            <section className="rounded-2xl border border-[var(--oc-border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <h2 className="text-[14px] font-semibold text-stone-800">{tt("最近调用")}</h2>
              <div className="mt-3 space-y-1.5">
                {(stats?.latest ?? []).length === 0 && (
                  <p className="py-3 text-center text-xs text-stone-300">{tt("暂无调用记录")}</p>
                )}
                {(stats?.latest ?? []).map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-[12.5px]">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${c.status === "success" ? "bg-emerald-500" : "bg-rose-500"}`} />
                    <span className="w-48 truncate font-medium text-stone-700">{c.modelId}</span>
                    <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-400">{c.providerId}</span>
                    <span className={`text-[11px] ${c.status === "success" ? "text-emerald-600" : "text-rose-500"}`}>
                      {c.status === "success" ? tt("成功") : tt("失败")}
                    </span>
                    <span className="flex-1" />
                    <span className="tabular-nums text-stone-400">{fmtMoney(c.costUsd)}</span>
                    <span className="tabular-nums text-stone-300">{fmtDate(c.createdAt)}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
