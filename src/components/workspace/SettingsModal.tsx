"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Cpu,
  Database,
  Download,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  loadSettings,
  saveSettings,
  PROVIDER_META,
  TAVILY_KEY,
  loadDynamicModels,
  saveDynamicModels,
  type ProviderSettings,
} from "@/lib/settings";
import { toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";
import type { ProviderId } from "@/lib/gateway";

type TestState = Record<string, "idle" | "testing" | "ok" | "fail">;
type TabId = "models" | "network" | "data";

const TABS: Array<{ id: TabId; label: string; desc: string; icon: React.ReactNode }> = [
  { id: "models", label: "模型设置", desc: "配置模型 API / 中转", icon: <Cpu className="h-4 w-4" /> },
  { id: "network", label: "联网搜索", desc: "深度研究联网来源", icon: <Globe className="h-4 w-4" /> },
  { id: "data", label: "数据备份", desc: "导出会话与消息", icon: <Database className="h-4 w-4" /> },
];

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [settings, setSettings] = useState<ProviderSettings>({});
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [test, setTest] = useState<TestState>({});
  const [tab, setTab] = useState<TabId>("models");

  useEffect(() => {
    if (open) {
      setSettings(loadSettings());
      setSaved(false);
      setTest({});
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const update = (id: string, field: "apiKey" | "baseUrl", value: string) => {
    setSettings((s) => ({
      ...s,
      [id]: {
        apiKey: (s[id as ProviderId]?.apiKey) ?? "",
        baseUrl: (s[id as ProviderId]?.baseUrl) ?? "",
        [field]: value,
      },
    }));
  };
  const tavily = settings[TAVILY_KEY as ProviderId]?.apiKey ?? "";

  const testConnection = async (id: ProviderId) => {
    const cur = settings[id];
    if (!cur?.apiKey) {
      toast("请先填写 API Key", "error");
      return;
    }
    setTest((t) => ({ ...t, [id]: "testing" }));
    try {
      const res = await fetch("/api/models/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: id,
          overrides: { [id]: { apiKey: cur.apiKey, baseUrl: cur.baseUrl || undefined } },
        }),
      });
      const data = (await res.json()) as { models?: string[]; error?: string };
      if (!res.ok || !data.models) throw new Error(data.error ?? "连接失败");

      // 测试通过即保存该供应商模型列表
      const dyn = loadDynamicModels();
      dyn[id] = data.models;
      saveDynamicModels(dyn);

      setTest((t) => ({ ...t, [id]: "ok" }));
      toast(`连接成功，获取到 ${data.models.length} 个模型`, "success");
    } catch (e) {
      setTest((t) => ({ ...t, [id]: "fail" }));
      toast(`连接失败：${e instanceof Error ? e.message : ""}`, "error");
    }
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    toast("模型设置已保存", "success");
    setTimeout(onClose, 500);
  };

  const keyInput = (id: string, value: string, placeholder: string) => (
    <div className="relative mb-3">
      <input
        type={showKey[id] ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        onChange={(e) => update(id, "apiKey", e.target.value)}
        className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-800 shadow-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
      />
      <button
        type="button"
        onClick={() => setShowKey((s) => ({ ...s, [id]: !s[id] }))}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 transition hover:text-stone-600"
        title={showKey[id] ? "隐藏" : "显示"}
      >
        {showKey[id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );

  const StatusPill = ({
    text,
    kind,
    icon,
  }: {
    text: string;
    kind: "ok" | "info" | "fail";
    icon?: React.ReactNode;
  }) => (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        kind === "ok" && "bg-emerald-50 text-emerald-600",
        kind === "info" && "bg-stone-100 text-stone-500",
        kind === "fail" && "bg-red-50 text-red-600"
      )}
    >
      {icon}
      {text}
    </span>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-900/45 p-4 backdrop-blur-sm md:items-center"
      onClick={onClose}
    >
      <div
        className="my-6 flex w-full max-w-4xl overflow-hidden rounded-3xl border border-stone-200/80 bg-[#fdfaf6] shadow-2xl shadow-stone-900/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 左侧分类导航 */}
        <aside className="hidden w-56 shrink-0 border-r border-stone-100 bg-white p-3 md:flex md:flex-col">
          <div className="mb-4 flex items-center gap-2.5 px-2 pb-3 pt-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <div className="text-[14px] font-semibold text-stone-800">设置中心</div>
              <div className="text-[11px] text-stone-400">OpenCanvas</div>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition",
                  tab === t.id
                    ? "bg-orange-50 text-orange-700"
                    : "text-stone-600 hover:bg-stone-50 hover:text-stone-800"
                )}
              >
                <span className={cn("mt-0.5", tab === t.id ? "text-orange-500" : "text-stone-400")}>{t.icon}</span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium">{t.label}</span>
                  <span className={cn("block text-[11px]", tab === t.id ? "text-orange-400" : "text-stone-400")}>
                    {t.desc}
                  </span>
                </span>
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-xl border border-stone-200/80 bg-stone-50 p-3">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-stone-600">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              密钥仅存本机
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-stone-400">
              保存在浏览器 localStorage，服务器不存储。
            </p>
          </div>
        </aside>

        {/* 右侧内容 */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* 头部 */}
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white/80 px-6 py-4 backdrop-blur">
            <div>
              <h2 className="text-[15px] font-semibold text-stone-800">
                {TABS.find((t) => t.id === tab)?.label}
              </h2>
              <p className="mt-0.5 text-xs text-stone-400">{TABS.find((t) => t.id === tab)?.desc}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            {/* 安全提示 */}
            {tab === "models" && (
              <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 text-sm text-orange-800">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                <p>
                  密钥只保存在<b>你自己的浏览器</b>中，随请求发给本应用后端转发。点「测试连接」可验证密钥并自动拉取可用模型；演示模型始终免费。
                </p>
              </div>
            )}

            {tab === "models" && (
              <div className="space-y-4">
                {PROVIDER_META.map((p) => {
                  const cur = settings[p.id] ?? { apiKey: "", baseUrl: "" };
                  const configured = Boolean(cur.apiKey);
                  const st = test[p.id] ?? "idle";
                  return (
                    <div key={p.id} className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-sm">
                            <KeyRound className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[14px] font-semibold text-stone-800">{p.label}</span>
                              <StatusPill text={p.region} kind="info" />
                              {configured && <StatusPill text="已填写" kind="ok" icon={<Check className="h-3 w-3" />} />}
                              {st === "ok" && <StatusPill text="连接正常" kind="ok" icon={<Check className="h-3 w-3" />} />}
                              {st === "fail" && <StatusPill text="连接失败" kind="fail" />}
                            </div>
                            <div className="mt-0.5 text-xs text-stone-400">{p.models} · {p.note}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => void testConnection(p.id)}
                          disabled={st === "testing" || !configured}
                          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:border-orange-300 hover:text-orange-600 disabled:opacity-40"
                        >
                          {st === "testing" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          测试连接
                        </button>
                      </div>
                      <label className="mb-1 block text-xs font-medium text-stone-500">API Key</label>
                      {keyInput(p.id, cur.apiKey, "sk-...")}
                      <label className="mb-1 block text-xs font-medium text-stone-500">
                        Base URL（可选，默认官方地址；中转填中转地址）
                      </label>
                      <input
                        type="text"
                        value={cur.baseUrl}
                        placeholder={p.defaultBaseUrl}
                        onChange={(e) => update(p.id, "baseUrl", e.target.value)}
                        className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-800 shadow-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "network" && (
              <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
                <div className="mb-1 flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-sm">
                    <Search className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14px] font-semibold text-stone-800">Tavily 联网搜索</span>
                      <StatusPill text="联网用" kind="info" />
                      {tavily && <StatusPill text="已填写" kind="ok" icon={<Check className="h-3 w-3" />} />}
                    </div>
                    <div className="mt-0.5 text-xs text-stone-400">用于深度研究等需要实时联网的场景</div>
                  </div>
                </div>
                <div className="mt-3 mb-1 text-xs text-stone-400">填入后深度研究真实联网；不填用示例来源。获取：tavily.com</div>
                {keyInput(TAVILY_KEY, tavily, "tvly-...")}
              </div>
            )}

            {tab === "data" && (
              <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
                <div className="mb-1 flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm">
                    <Database className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-[14px] font-semibold text-stone-800">数据备份</div>
                    <div className="mt-0.5 text-xs text-stone-400">导出全部会话、消息、PPT 与报告为 JSON 文件</div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-stone-50 p-3.5">
                  <p className="text-xs text-stone-500">备份文件保存在本机，不会上传到服务器。</p>
                  <button
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = "/api/export";
                      a.download = "opencanvas-backup.json";
                      a.click();
                      toast("正在导出备份…", "info");
                    }}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-600 transition hover:border-orange-300 hover:text-orange-600"
                  >
                    <Download className="h-3.5 w-3.5" /> 导出数据
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* 底部操作 */}
          <footer className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-stone-100 bg-white/80 px-6 py-4 backdrop-blur">
            <button
              onClick={onClose}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 transition hover:bg-stone-50"
            >
              取消（Esc）
            </button>
            <button
              onClick={handleSave}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2 text-sm font-medium text-white shadow-md shadow-orange-200 transition hover:brightness-105"
            >
              {saved ? "✓ 已保存" : "保存设置"}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
