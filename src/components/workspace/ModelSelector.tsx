"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, KeyRound, Loader2, RefreshCw, Sparkles, Zap } from "lucide-react";
import { MODELS, inferProvider } from "@/lib/gateway/models";
import type { ModelInfo, ProviderId as ProviderIdType } from "@/lib/gateway";
import {
  localConfiguredProviders,
  loadDynamicModels,
  saveDynamicModels,
  getOverrides,
} from "@/lib/settings";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/store/chat";
type ProviderId = ProviderIdType;

interface StatusMap {
  [provider: string]: boolean;
}

const REGION_LABEL: Record<string, string> = {
  global: "海外",
  china: "国内",
  builtin: "内置",
};

const PROVIDER_ORDER: ProviderId[] = ["openai", "anthropic", "deepseek", "dashscope"];
const PROVIDER_NAME: Record<string, string> = {
  openai: "OpenAI / GPT",
  anthropic: "Anthropic / Claude",
  deepseek: "DeepSeek",
  dashscope: "阿里百炼 / 通义",
  demo: "内置",
};
/** 按钮上显示的简短模型名 */
function shortLabel(label: string) {
  return label
    .replace("（免费）", "")
    .replace(" / GPT", "")
    .replace(" / Claude", "")
    .replace("Chat (V3)", "")
    .replace("(V3)", "")
    .trim();
}

export function ModelSelector({ value, onChange }: { value: string; onChange: (id: string, provider?: string) => void }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<StatusMap | null>(null);
  const [local, setLocal] = useState<StatusMap>({ demo: true });
  const [dynamic, setDynamic] = useState<Partial<Record<ProviderId, string[]>>>({});
  const [fetching, setFetching] = useState<ProviderId | null>(null);
  const [fetchError, setFetchError] = useState<string>("");
  const setSettingsOpen = useChatStore((s) => s.setSettingsOpen);
  const ref = useRef<HTMLDivElement>(null);

  const reload = () => {
    setLocal(localConfiguredProviders());
    setDynamic(loadDynamicModels());
  };

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((d: { status: StatusMap }) => setStatus(d.status))
      .catch(() => setStatus({}));
    reload();
    const onChanged = () => reload();
    window.addEventListener("opencanvas:settings-changed", onChanged);
    return () => window.removeEventListener("opencanvas:settings-changed", onChanged);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // 可用 = 服务端 env 或 本地密钥
  const providerAvailable = (p: string) =>
    p === "demo" || Boolean(local[p]) || status === null || Boolean(status?.[p]);

  // 合并静态 + 动态模型，按供应商分组
  const groups = useMemo(() => {
    const map = new Map<ProviderId, { info: ModelInfo; dynamic: boolean }[]>();
    const push = (p: ProviderId, info: ModelInfo, dynamic: boolean) => {
      if (!map.has(p)) map.set(p, []);
      const arr = map.get(p)!;
      if (!arr.some((x) => x.info.id === info.id)) arr.push({ info, dynamic });
    };
    for (const m of MODELS) push(m.provider, m, false);
    for (const p of PROVIDER_ORDER) {
      for (const id of dynamic[p] ?? []) {
        if (MODELS.some((m) => m.id === id)) continue;
        push(p, {
          id,
          label: id,
          provider: p,
          providerLabel: PROVIDER_NAME[p],
          region: p === "deepseek" || p === "dashscope" ? "china" : "global",
          capabilities: ["text"],
          inputPricePerMtok: 0.5,
          outputPricePerMtok: 1.5,
        }, true);
      }
    }
    return PROVIDER_ORDER.map((p) => ({ provider: p, items: map.get(p) ?? [] }));
  }, [dynamic]);

  const currentModel =
    MODELS.find((m) => m.id === value) ?? { id: value, label: value, provider: inferProvider(value) ?? "demo" };

  const fetchModels = async (provider: ProviderId) => {
    setFetching(provider);
    setFetchError("");
    try {
      const res = await fetch("/api/models/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, overrides: getOverrides() }),
      });
      const data = (await res.json()) as { models?: string[]; error?: string };
      if (!res.ok || !data.models) throw new Error(data.error ?? "获取失败");
      const next = { ...loadDynamicModels(), [provider]: data.models };
      saveDynamicModels(next);
      setDynamic(next);
    } catch (e) {
      setFetchError(`${PROVIDER_NAME[provider]}：${e instanceof Error ? e.message : "获取失败"}`);
    } finally {
      setFetching(null);
    }
  };

  const short = shortLabel(currentModel.label);
  const online = providerAvailable(currentModel.provider);

  return (
    <div ref={ref} className="relative">
      {/* 深色科技风触发器（保持与「功能」按钮同高 h-[38px]） */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group relative flex h-[38px] items-center gap-2 overflow-hidden rounded-full border px-3.5 text-[13px] font-medium text-slate-100 transition-all duration-200",
          "border-white/10",
          "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_20px_rgba(249,115,22,0.16)]",
          open
            ? "border-orange-400/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_30px_rgba(249,115,22,0.4)]"
            : "hover:border-orange-300/40 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_24px_rgba(249,115,22,0.28)]"
        )}
      >
        {/* 顶部高光 */}
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/70 to-transparent" />
        <span className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 via-orange-500 to-red-500 shadow-[0_0_10px_rgba(249,115,22,0.9)]">
          <Sparkles className="h-2.5 w-2.5 text-white" />
        </span>
        <span className="truncate leading-none text-slate-50">{short}</span>
        <span
          className={cn(
            "relative h-1.5 w-1.5 shrink-0 rounded-full",
            online
              ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]"
              : "bg-white/20"
          )}
          title={online ? "可用" : "未配置"}
        />
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 group-hover:text-orange-300",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 max-h-[70vh] w-[380px] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/95 p-1.5 shadow-2xl shadow-black/50 ring-1 ring-black/40 backdrop-blur-2xl">
          <div className="flex items-center gap-2.5 border-b border-white/10 px-3 py-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.6)]">
              <Zap className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-white">智能模型</p>
              <p className="text-[11px] text-white/45">配置密钥后即可拉取和使用真实模型</p>
            </div>
          </div>

          {/* 演示模型 */}
          <GroupLabel>{PROVIDER_NAME.demo}</GroupLabel>
          <ModelRow
            label="演示模型（免费）"
            region="内置"
            active={value === "demo"}
            available
            onClick={() => {
              onChange("demo");
              setOpen(false);
            }}
          />

          {groups.map((g) => {
            const avail = providerAvailable(g.provider);
            return (
              <div key={g.provider}>
                <div className="flex items-center justify-between pl-3 pr-1 pt-3">
                  <GroupLabel>
                    <span className="flex items-center gap-1.5">
                      {PROVIDER_NAME[g.provider]}
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          avail ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" : "bg-white/20"
                        )}
                      />
                    </span>
                  </GroupLabel>
                  <button
                    onClick={() => void fetchModels(g.provider)}
                    disabled={!avail || fetching !== null}
                    title={avail ? "从供应商拉取最新模型列表" : "请先配置该供应商密钥"}
                    className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/55 transition hover:border-orange-400/50 hover:text-orange-300 disabled:opacity-40"
                  >
                    {fetching === g.provider ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    获取模型
                  </button>
                </div>
                {g.items.map(({ info, dynamic: isDynamic }) => (
                    <ModelRow
                      key={info.id}
                      label={info.label + (isDynamic ? " ·" : "")}
                      sub={isDynamic ? "动态获取" : undefined}
                      region={REGION_LABEL[info.region]}
                      active={value === info.id}
                      available={avail}
                      bold={isDynamic}
                      onClick={() => {
                        onChange(info.id, g.provider);
                        setOpen(false);
                      }}
                    />
                  ))}
              </div>
            );
          })}

          {fetchError && (
            <div className="mx-3 mt-2 rounded-lg bg-red-500/15 px-2.5 py-1.5 text-xs text-red-300">
              {fetchError}
            </div>
          )}

          <button
            onClick={() => {
              setOpen(false);
              setSettingsOpen(true);
            }}
            className="sticky bottom-0 mt-2 flex w-full items-center gap-2 rounded-xl border-t border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-orange-300 transition hover:bg-white/10"
          >
            <KeyRound className="h-4 w-4" />
            配置模型 API Key…
          </button>
        </div>
      )}
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-3 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">{children}</div>;
}

function ModelRow({
  label,
  sub,
  region,
  active,
  available,
  bold,
  onClick,
}: {
  label: string;
  sub?: string;
  region: string;
  active: boolean;
  available: boolean;
  bold?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={!available}
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left transition",
        active ? "bg-orange-500/15" : "hover:bg-white/10",
        !available && "cursor-not-allowed opacity-40"
      )}
    >
      {active && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-gradient-to-b from-orange-300 to-red-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />}
      <div className="min-w-0">
        <div className={cn("truncate text-[13.5px]", bold && "font-medium text-orange-300", active ? "text-white" : "text-slate-200")}>
          {label}
        </div>
        <div className="mt-0.5 text-[11px] text-white/45">
          <span
            className={cn(
              "mr-1.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium",
              active ? "bg-orange-500/30 text-orange-200" : "bg-white/10 text-white/55"
            )}
          >
            {region}
          </span>
          {[sub, !available ? "未配置密钥" : null].filter(Boolean).join(" · ")}
        </div>
      </div>
      {active && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.7)]">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}
    </button>
  );
}
