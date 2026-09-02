import type { ImageAdapter, ImageProviderId, ImageResult } from "./types";
import type { ProviderOverrides } from "../types";
import { IMAGE_MODELS, getImageModel } from "./models";
import { demoImageAdapter } from "./demo-image";
import { createOpenAIImageAdapter } from "./openai-image";
import { createDashScopeImageAdapter } from "./dashscope-image";
import { createFalFluxAdapter } from "./fal-flux";

const DEFAULTS: Partial<Record<ImageProviderId, string>> = {
  openai: "https://api.openai.com/v1",
  dashscope: "https://dashscope.aliyuncs.com",
};
const ENV_KEY: Partial<Record<ImageProviderId, string | undefined>> = {
  openai: process.env.OPENAI_API_KEY,
  dashscope: process.env.DASHSCOPE_API_KEY,
  fal: process.env.FAL_KEY,
};

function buildImageAdapters(overrides?: ProviderOverrides): Record<ImageProviderId, ImageAdapter> {
  const keyOf = (id: "openai" | "dashscope") => overrides?.[id]?.apiKey || ENV_KEY[id];
  const urlOf = (id: "openai" | "dashscope") => overrides?.[id]?.baseUrl || DEFAULTS[id];
  return {
    demo: demoImageAdapter,
    openai: createOpenAIImageAdapter(keyOf("openai"), urlOf("openai")),
    dashscope: createDashScopeImageAdapter(keyOf("dashscope"), urlOf("dashscope")),
    fal: createFalFluxAdapter(falKeyOf(overrides) || ENV_KEY.fal),
  };
}

let cache: Record<ImageProviderId, ImageAdapter> | null = null;
function getAdapters(): Record<ImageProviderId, ImageAdapter> {
  if (!cache) cache = buildImageAdapters();
  return cache;
}

export function getImageProviderStatus(): Record<ImageProviderId, boolean> {
  const a = getAdapters();
  return Object.fromEntries(
    Object.entries(a).map(([id, adapter]) => [id, adapter.isConfigured()])
  ) as Record<ImageProviderId, boolean>;
}

/** 前台 BYOK 可能带图像专用供应商（fal），聊天 ProviderId 并不包含，故安全收窄读取 */
function falKeyOf(overrides?: ProviderOverrides): string | undefined {
  return (overrides as { fal?: { apiKey?: string } } | undefined)?.fal?.apiKey;
}

/** 自动选模型：图生图 → flux-dev / 万相 i2i；文生图 → DALL·E 3 / Seedream / 万相 / demo */
function resolveAutoModel(prompt: string, imageUrl?: string, overrides?: ProviderOverrides): string {
  const ov = overrides ?? {};
  if (imageUrl) {
    if (falKeyOf(ov) || process.env.FAL_KEY) return "fal-ai/flux/dev";
    if (ov.dashscope?.apiKey || process.env.DASHSCOPE_API_KEY) return "wan2.5-i2i-preview";
    return "demo-image";
  }
  if (ov.openai?.apiKey || process.env.OPENAI_API_KEY) return "dall-e-3";
  if (ov.dashscope?.apiKey || process.env.DASHSCOPE_API_KEY) return "wanx2.5-t2i";
  if (process.env.FAL_KEY) return "fal-ai/flux/schnell";
  return "demo-image";
}

/** 统一入口：按模型 id 路由到对应图像供应商 */
export async function generateImage(
  modelId: string,
  prompt: string,
  opts: {
    size: string;
    imageUrl?: string;
    signal?: AbortSignal;
    overrides?: ProviderOverrides;
  }
): Promise<ImageResult & { credits: number }> {
  const id = modelId === "auto" ? resolveAutoModel(prompt, opts.imageUrl, opts.overrides) : modelId;
  const model = getImageModel(id);
  const adapters = opts.overrides ? buildImageAdapters(opts.overrides) : getAdapters();
  const adapter = adapters[model.provider];
  if (!adapter.isConfigured()) {
    throw new Error(`绘图模型「${model.label}」未配置密钥，请在模型设置中配置或使用演示绘图`);
  }
  const result = await adapter.generate(prompt, {
    size: opts.size,
    imageUrl: opts.imageUrl,
    model: model.id,
    signal: opts.signal,
  });
  return { ...result, credits: model.creditsPerImage };
}

/** 自动模式下当前可用的图像供应商（供前端提示） */
export async function getAvailableImageProviders(overrides?: ProviderOverrides): Promise<Record<ImageProviderId, boolean>> {
  try {
    const withFal = (overrides as { fal?: { apiKey?: string } } | undefined)?.fal?.apiKey ? { fal: true } : {};
    return Object.assign(getImageProviderStatus(), withFal) as Record<ImageProviderId, boolean>;
  } catch {
    return { demo: true, openai: false, dashscope: false, fal: false };
  }
}

export { IMAGE_MODELS, getImageModel };
export type { ImageResult };
