"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Search,
  ShieldCheck,
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
import type { ProviderId } from "@/lib/gateway";

type TestState = Record<string, "idle" | "testing" | "ok" | "fail">;

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [settings, setSettings] = useState<ProviderSettings>({});
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [test, setTest] = useState<TestState>({});

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
        className="w-full rounded-lg border border-stone-200 py-2 pl-3 pr-9 text-sm outline-none focus:border-brand-400"
      />
      <button
        type="button"
        onClick={() => setShowKey((s) => ({ ...s, [id]: !s[id] }))}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
        title={showKey[id] ? "隐藏" : "显示"}
      >
        {showKey[id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-stone-200 bg-white px-6 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <KeyRound className="h-5 w-5 text-brand-600" />
            模型设置（BYOK）
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-stone-400 hover:bg-stone-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              密钥只保存在<b>你自己的浏览器（localStorage）</b>中，随请求发给本应用后端转发，服务器不存储。
              点「测试连接」可验证密钥并自动拉取可用模型；演示模型始终免费。
            </p>
          </div>

          <div className="space-y-4">
            {PROVIDER_META.map((p) => {
              const cur = settings[p.id] ?? { apiKey: "", baseUrl: "" };
              const configured = Boolean(cur.apiKey);
              const st = test[p.id] ?? "idle";
              return (
                <div key={p.id} className="rounded-xl border border-stone-200 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 font-medium">
                        {p.label}
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                          {p.region}
                        </span>
                        {configured && (
                          <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600">
                            <Check className="h-3 w-3" /> 已填写
                          </span>
                        )}
                        {st === "ok" && (
                          <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600">
                            <Check className="h-3 w-3" /> 连接正常
                          </span>
                        )}
                        {st === "fail" && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">
                            连接失败
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-stone-400">{p.models} · {p.note}</div>
                    </div>
                    <button
                      onClick={() => void testConnection(p.id)}
                      disabled={st === "testing" || !configured}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs text-stone-600 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-40"
                    >
                      {st === "testing" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
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
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                  />
                </div>
              );
            })}
          </div>

          {/* 联网搜索 */}
          <div className="mt-4 rounded-xl border border-stone-200 p-4">
            <div className="mb-3 flex items-center gap-2 font-medium">
              <Search className="h-4 w-4 text-brand-600" />
              Tavily 联网搜索
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">深度研究用</span>
              {tavily && (
                <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600">
                  <Check className="h-3 w-3" /> 已填写
                </span>
              )}
            </div>
            <div className="mb-1 text-xs text-stone-400">
              填入后深度研究真实联网；不填用示例来源。获取：tavily.com
            </div>
            {keyInput(TAVILY_KEY, tavily, "tvly-...")}
          </div>

          {/* 数据备份 */}
          <div className="mt-4 flex items-center justify-between rounded-xl border border-stone-200 p-4">
            <div>
              <div className="text-sm font-medium">数据备份</div>
              <div className="mt-0.5 text-xs text-stone-400">
                导出全部会话、消息、PPT 与报告为 JSON 文件（保存在本机）
              </div>
            </div>
            <button
              onClick={() => {
                const a = document.createElement("a");
                a.href = "/api/export";
                a.download = "opencanvas-backup.json";
                a.click();
                toast("正在导出备份…", "info");
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-600 transition hover:border-brand-300 hover:text-brand-600"
            >
              <Download className="h-3.5 w-3.5" /> 导出数据
            </button>
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-stone-200 bg-white px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-stone-200 px-4 py-2 text-sm hover:bg-stone-50">
            取消（Esc）
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            {saved ? "✓ 已保存" : "保存设置"}
          </button>
        </div>
      </div>
    </div>
  );
}
