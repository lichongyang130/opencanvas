"use client";

import type { ProviderId, ProviderOverrides } from "@/lib/gateway";
import type { WorkspaceMode } from "@/lib/store/chat";

const STORAGE_KEY = "opencanvas.provider.settings.v1";
const MODELS_KEY = "opencanvas.dynamic.models.v1";
const PREFS_KEY = "opencanvas.ui.prefs.v1";

/* ────────────────────────── 界面偏好（本地） ────────────────────────── */

export type CanvasWidth = "narrow" | "standard" | "wide";
export type SendKey = "enter" | "ctrlEnter";
export type ResearchDepth = "basic" | "advanced";
export type HistoryLimit = 20 | 50 | 100;
export type ResearchMaxResults = 5 | 6 | 8;
export type ThemeMode = "system" | "light" | "dark";

export interface UIPrefs {
  /** 进入工作台时默认展开右侧产物画布 */
  artifactOpen: boolean;
  /** AI 产出新内容时自动展开右侧画布 */
  autoOpenArtifact: boolean;
  /** 新建任务的默认模式 */
  defaultMode: WorkspaceMode;
  /** 新建任务的默认模型 id（无效时回退到当前模型） */
  defaultModel: string;
  /** 右侧产物画布宽度 */
  canvasWidth: CanvasWidth;
  /** 历史列表显示条数 */
  historyLimit: HistoryLimit;
  /** 发送消息按键 */
  sendKey: SendKey;
  /** 深度研究搜索深度 */
  researchDepth: ResearchDepth;
  /** 每次搜索返回来源数 */
  researchMaxResults: ResearchMaxResults;
  /** 外观主题 */
  theme: ThemeMode;
}

const DEFAULT_PREFS: UIPrefs = {
  artifactOpen: true,
  autoOpenArtifact: true,
  defaultMode: "chat",
  defaultModel: "demo",
  canvasWidth: "standard",
  historyLimit: 50,
  sendKey: "enter",
  researchDepth: "advanced",
  researchMaxResults: 6,
  theme: "system",
};

const MODE_IDS: WorkspaceMode[] = ["chat", "research", "slides", "image", "video", "docs"];

export function loadPrefs(): UIPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const p = JSON.parse(raw) as Partial<UIPrefs>;
    return {
      artifactOpen: typeof p.artifactOpen === "boolean" ? p.artifactOpen : DEFAULT_PREFS.artifactOpen,
      autoOpenArtifact: typeof p.autoOpenArtifact === "boolean" ? p.autoOpenArtifact : DEFAULT_PREFS.autoOpenArtifact,
      defaultMode: MODE_IDS.includes(p.defaultMode as WorkspaceMode)
        ? (p.defaultMode as WorkspaceMode)
        : DEFAULT_PREFS.defaultMode,
      defaultModel: typeof p.defaultModel === "string" && p.defaultModel ? p.defaultModel : DEFAULT_PREFS.defaultModel,
      canvasWidth: (["narrow", "standard", "wide"] as CanvasWidth[]).includes(p.canvasWidth as CanvasWidth)
        ? (p.canvasWidth as CanvasWidth)
        : DEFAULT_PREFS.canvasWidth,
      historyLimit: ([20, 50, 100] as number[]).includes(p.historyLimit as number)
        ? (p.historyLimit as HistoryLimit)
        : DEFAULT_PREFS.historyLimit,
      sendKey: (["enter", "ctrlEnter"] as SendKey[]).includes(p.sendKey as SendKey)
        ? (p.sendKey as SendKey)
        : DEFAULT_PREFS.sendKey,
      researchDepth: (["basic", "advanced"] as ResearchDepth[]).includes(p.researchDepth as ResearchDepth)
        ? (p.researchDepth as ResearchDepth)
        : DEFAULT_PREFS.researchDepth,
      researchMaxResults: ([5, 6, 8] as number[]).includes(p.researchMaxResults as number)
        ? (p.researchMaxResults as ResearchMaxResults)
        : DEFAULT_PREFS.researchMaxResults,
      theme: (["system", "light", "dark"] as ThemeMode[]).includes(p.theme as ThemeMode)
        ? (p.theme as ThemeMode)
        : DEFAULT_PREFS.theme,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(patch: Partial<UIPrefs>): UIPrefs {
  const next = { ...loadPrefs(), ...patch };
  localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("opencanvas:settings-changed"));
  return next;
}

/** 清除所有本地配置（密钥、动态模型、界面偏好） */
export function clearLocalConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(MODELS_KEY);
  localStorage.removeItem(PREFS_KEY);
  window.dispatchEvent(new CustomEvent("opencanvas:settings-changed"));
}

export interface DynamicModel {
  id: string;
  provider: ProviderId;
}

/** 读取各供应商动态获取的模型列表 */
export function loadDynamicModels(): Partial<Record<SettingsProviderId, string[]>> {
  try {
    const raw = localStorage.getItem(MODELS_KEY);
    return raw ? (JSON.parse(raw) as Partial<Record<SettingsProviderId, string[]>>) : {};
  } catch {
    return {};
  }
}

export function saveDynamicModels(m: Partial<Record<SettingsProviderId, string[]>>): void {
  localStorage.setItem(MODELS_KEY, JSON.stringify(m));
  window.dispatchEvent(new CustomEvent("opencanvas:settings-changed"));
}

export interface ProviderSetting {
  apiKey: string;
  baseUrl: string;
}

/** 设置页可配置的供应商 = 聊天供应商 + 图像专用（fal.ai） */
export type SettingsProviderId = ProviderId | "fal";

/** 图像请求携带的供应商覆盖（含 fal，供 /api/images 使用） */
export type ImageOverrides = ProviderOverrides & { fal?: { apiKey: string; baseUrl?: string } };

export type ProviderSettings = Partial<Record<SettingsProviderId, ProviderSetting>>;

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
  id: SettingsProviderId;
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
  {
    id: "fal",
    label: "fal.ai（FLUX.1 图像）",
    region: "海外",
    defaultBaseUrl: "https://fal.run",
    models: "FLUX Schnell / Dev 绘图 + 图生图",
    note: "仅图像生成；用控制台 API Key（Key 前缀会自动处理）",
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
        out[k as SettingsProviderId] = {
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

/** 转成请求体里的 overrides（只含有 key 的供应商；包含图像专用 fal） */
export function toOverrides(s: ProviderSettings): ImageOverrides {
  const out: ImageOverrides = {};
  for (const [id, v] of Object.entries(s)) {
    if (v?.apiKey) {
      if (id === "fal") {
        out.fal = { apiKey: v.apiKey, baseUrl: v.baseUrl || undefined };
      } else {
        out[id as ProviderId] = { apiKey: v.apiKey, baseUrl: v.baseUrl || undefined };
      }
    }
  }
  return out;
}

export function getOverrides(): ImageOverrides {
  return toOverrides(loadSettings());
}

/**
 * 服务端（.env / .env.local）配置状态，带内存缓存。
 * 用于前端判断「密钥只配在服务端」的场景 —— localStorage 里没有不代表没配。
 */
let serverStatusCache: Record<string, boolean> | null = null;
export async function serverProviderStatus(): Promise<Record<string, boolean>> {
  if (serverStatusCache) return serverStatusCache;
  try {
    const res = await fetch("/api/models");
    const data = (await res.json()) as { status?: Record<string, boolean> };
    serverStatusCache = data.status ?? {};
  } catch {
    serverStatusCache = {};
  }
  return serverStatusCache;
}

/** 本地已配置密钥的供应商集合 */
export function localConfiguredProviders(): Record<string, boolean> {
  const s = loadSettings();
  const out: Record<string, boolean> = {};
  for (const [id, v] of Object.entries(s)) if (v?.apiKey) out[id] = true;
  out.demo = true;
  return out;
}
