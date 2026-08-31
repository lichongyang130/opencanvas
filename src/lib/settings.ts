"use client";

import type { ProviderId, ProviderOverrides } from "@/lib/gateway";

const STORAGE_KEY = "opencanvas.provider.settings.v1";
const MODELS_KEY = "opencanvas.dynamic.models.v1";

export interface DynamicModel {
  id: string;
  provider: ProviderId;
}

/** 读取各供应商动态获取的模型列表 */
export function loadDynamicModels(): Partial<Record<ProviderId, string[]>> {
  try {
    const raw = localStorage.getItem(MODELS_KEY);
    return raw ? (JSON.parse(raw) as Partial<Record<ProviderId, string[]>>) : {};
  } catch {
    return {};
  }
}

export function saveDynamicModels(m: Partial<Record<ProviderId, string[]>>): void {
  localStorage.setItem(MODELS_KEY, JSON.stringify(m));
  window.dispatchEvent(new CustomEvent("opencanvas:settings-changed"));
}

export interface ProviderSetting {
  apiKey: string;
  baseUrl: string;
}
export type ProviderSettings = Partial<Record<ProviderId, ProviderSetting>>;

export const TAVILY_KEY = "tavily";

/** 联网搜索（深度研究用）密钥 */
export function loadTavilyKey(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw) as Record<string, ProviderSetting>;
    return parsed[TAVILY_KEY]?.apiKey?.trim() ?? "";
  } catch {
    return "";
  }
}

export const PROVIDER_META: {
  id: ProviderId;
  label: string;
  region: string;
  defaultBaseUrl: string;
  models: string;
  note: string;
}[] = [
  {
    id: "openai",
    label: "OpenAI（GPT / DALL·E）",
    region: "海外",
    defaultBaseUrl: "https://api.openai.com/v1",
    models: "GPT 对话 + DALL·E 3 绘图",
    note: "国内可用中转服务，把 Base URL 换成中转地址",
  },
  {
    id: "anthropic",
    label: "Anthropic（Claude）",
    region: "海外",
    defaultBaseUrl: "https://api.anthropic.com",
    models: "Claude 对话",
    note: "Base URL 只填根地址，无需 /v1",
  },
  {
    id: "deepseek",
    label: "DeepSeek（深度求索）",
    region: "国内",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    models: "DeepSeek 对话（高性价比）",
    note: "国内直连，无需中转",
  },
  {
    id: "dashscope",
    label: "阿里云百炼（通义千问 / 万相）",
    region: "国内",
    defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    models: "Qwen 对话 + 通义万相绘图",
    note: "用 OpenAI 兼容模式 Base URL",
  },
];

export function loadSettings(): ProviderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ProviderSetting>;
    const out: ProviderSettings = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v && typeof v === "object") {
        out[k as ProviderId] = {
          apiKey: typeof v.apiKey === "string" ? v.apiKey.trim() : "",
          baseUrl: typeof v.baseUrl === "string" ? v.baseUrl.trim() : "",
        };
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function saveSettings(s: ProviderSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("opencanvas:settings-changed"));
}

/** 转成请求体里的 overrides（只含有 key 的供应商） */
export function toOverrides(s: ProviderSettings): ProviderOverrides {
  const out: ProviderOverrides = {};
  for (const [id, v] of Object.entries(s)) {
    if (v?.apiKey) {
      out[id as ProviderId] = { apiKey: v.apiKey, baseUrl: v.baseUrl || undefined };
    }
  }
  return out;
}

export function getOverrides(): ProviderOverrides {
  return toOverrides(loadSettings());
}

/** 本地已配置密钥的供应商集合 */
export function localConfiguredProviders(): Record<string, boolean> {
  const s = loadSettings();
  const out: Record<string, boolean> = {};
  for (const [id, v] of Object.entries(s)) if (v?.apiKey) out[id] = true;
  out.demo = true;
  return out;
}
