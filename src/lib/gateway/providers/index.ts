import type { ProviderAdapter, ProviderId, ProviderOverrides } from "../types";
import { createOpenAICompatibleProvider } from "./openai-compatible";
import { createAnthropicProvider } from "./anthropic";
import { demoProvider } from "./demo";

const DEFAULTS: Record<Exclude<ProviderId, "demo">, string> = {
  openai: "https://api.openai.com/v1",
  deepseek: "https://api.deepseek.com/v1",
  dashscope: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  anthropic: "https://api.anthropic.com",
};

/** 单个密钥环境变量（兜底） */
const ENV_KEY: Record<Exclude<ProviderId, "demo">, string | undefined> = {
  openai: process.env.OPENAI_API_KEY,
  deepseek: process.env.DEEPSEEK_API_KEY,
  dashscope: process.env.DASHSCOPE_API_KEY,
  anthropic: process.env.ANTHROPIC_API_KEY,
};

/** 多密钥环境变量：`XXX_API_KEYS=a,b,c`（逗号分隔，空格容忍）；为空时回退单 key */
const ENV_KEYS: Record<Exclude<ProviderId, "demo">, string | undefined> = {
  openai: process.env.OPENAI_API_KEYS,
  deepseek: process.env.DEEPSEEK_API_KEYS,
  dashscope: process.env.DASHSCOPE_API_KEYS,
  anthropic: process.env.ANTHROPIC_API_KEYS,
};

/** 解析供应商密钥列表：前台 BYOK 单 key 优先 → 多 key env → 单 key env */
function keyListOf(id: Exclude<ProviderId, "demo">, overrides?: ProviderOverrides): string[] {
  const byok = overrides?.[id]?.apiKey?.trim();
  if (byok) return [byok];
  const multi = ENV_KEYS[id]
    ?.split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  if (multi && multi.length > 0) return multi;
  const single = ENV_KEY[id]?.trim();
  return single ? [single] : [];
}

let cache: Record<ProviderId, ProviderAdapter> | null = null;

/** 按覆盖配置（来自前台设置）构建供应商集合；环境变量作为兜底 */
export function buildProviders(overrides?: ProviderOverrides): Record<ProviderId, ProviderAdapter> {
  const urlOf = (id: Exclude<ProviderId, "demo">) => overrides?.[id]?.baseUrl || DEFAULTS[id];

  return {
    demo: demoProvider,
    openai: createOpenAICompatibleProvider({
      id: "openai",
      baseUrl: urlOf("openai"),
      apiKeys: keyListOf("openai", overrides),
    }),
    deepseek: createOpenAICompatibleProvider({
      id: "deepseek",
      baseUrl: urlOf("deepseek"),
      apiKeys: keyListOf("deepseek", overrides),
    }),
    dashscope: createOpenAICompatibleProvider({
      id: "dashscope",
      baseUrl: urlOf("dashscope"),
      apiKeys: keyListOf("dashscope", overrides),
    }),
    anthropic: createAnthropicProvider(keyListOf("anthropic", overrides), urlOf("anthropic")),
  };
}

/** 默认供应商（仅环境变量），带缓存 */
export function getProviders(): Record<ProviderId, ProviderAdapter> {
  if (!cache) cache = buildProviders();
  return cache;
}

/** 读取服务端环境变量中某供应商的密钥（不泄露内容，仅供路由内部兜底使用） */
export function getEnvApiKey(id: Exclude<ProviderId, "demo">): string | undefined {
  return keyListOf(id)[0];
}

/** 供前端展示：服务端环境变量配置状态（不泄露密钥） */
export function getProviderConfigStatus(): Record<ProviderId, boolean> {
  const p = getProviders();
  return Object.fromEntries(
    Object.entries(p).map(([id, adapter]) => [id, adapter.isConfigured()])
  ) as Record<ProviderId, boolean>;
}
