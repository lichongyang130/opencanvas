/**
 * 模型网关 —— 统一类型定义
 * 所有供应商（国内/海外）都适配为这一套接口。
 */

export type Region = "global" | "china" | "builtin";

export type ModelCapability = "text" | "image" | "video";

export type ProviderId =
  | "demo" // 内置免费演示（无需密钥）
  | "openai" // 海外
  | "anthropic" // 海外
  | "deepseek" // 国内
  | "dashscope"; // 国内（通义千问）

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ModelInfo {
  id: string; // 对外暴露的模型 id，如 "deepseek-chat"
  label: string; // 界面显示名
  provider: ProviderId;
  providerLabel: string;
  region: Region;
  capabilities: ModelCapability[];
  /** 降级模型 id（跨供应商降级链，如 gpt-4o-mini → deepseek-chat） */
  fallback?: string;
  /** 输入价格（美元 / 百万 token），用于成本核算 */
  inputPricePerMtok: number;
  /** 输出价格（美元 / 百万 token） */
  outputPricePerMtok: number;
  /** 1 积分 = INTEGRAL_CREDIT_USD 美元（见 credits.ts） */
}

export interface ChatCompletionParams {
  model: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
}

/** 前台传入的供应商配置（BYOK：浏览器本地保存的密钥 / 中转 Base URL） */
export interface ProviderOverride {
  apiKey?: string;
  baseUrl?: string;
}
export type ProviderOverrides = Partial<Record<ProviderId, ProviderOverride>>;

/**
 * 供应商适配器：返回一个 async generator，逐块产出文本增量。
 * 网关层负责 SSE 封装与计费。
 */
export interface ProviderAdapter {
  id: ProviderId;
  /** 是否已配置密钥（demo 永远可用） */
  isConfigured(): boolean;
  streamChat(params: ChatCompletionParams): AsyncGenerator<string, void, unknown>;
}

/** 模型降级链入参：网关在候选模型中找可用供应商（跨供应商降级） */
export interface GatewayContext {
  /** 登录用户 id（限流/日志归属） */
  userId?: string | null;
  /** 会话 id（日志关联） */
  sessionId?: string | null;
  /** 请求方 IP（未登录限流兜底） */
  ip?: string | null;
}
