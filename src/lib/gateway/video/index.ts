import type { ProviderOverrides } from "../types";
import { demoVideoAdapter } from "./demo-video";
import { createFalVideoAdapter } from "./fal-video";
import { createDashScopeVideoAdapter } from "./dashscope-video";
import type { VideoAdapter, VideoModelInfo, VideoProviderId, VideoResult } from "./types";

/**
 * AI 视频网关：demo（零密钥演示）→ FAL（Kling）→ 万相（wanx2.1-t2v-turbo）。
 *
 * 真实供应商启用条件（配置对应环境变量后自动生效，无需改代码）：
 *  - FAL_KEY：Kling 1.6 Pro 文生视频（fal-ai/kling-video/v1.6/pro/text-to-video，queue 轮询）
 *  - DASHSCOPE_API_KEY：通义万相 wanx2.1-t2v-turbo（异步任务轮询）
 * 生成的 MP4 直链由前端 <video> 播放，并按模型标价扣除积分（见 /api/video）。
 */

export const VIDEO_MODELS: VideoModelInfo[] = [
  {
    id: "demo-video",
    label: "演示视频（本机动画）",
    provider: "demo",
    providerLabel: "内置",
    region: "builtin",
    pricePerVideo: 0,
    creditsPerVideo: 0,
    maxDurationSec: 4,
  },
  {
    id: "fal-ai/kling-video/v1.6/pro/text-to-video",
    label: "Kling 1.6 Pro",
    provider: "fal",
    providerLabel: "FAL",
    region: "global",
    pricePerVideo: 0.18,
    creditsPerVideo: 18,
    maxDurationSec: 10,
  },
  {
    id: "wanx2.1-t2v-turbo",
    label: "通义万相 2.1 Turbo",
    provider: "dashscope",
    providerLabel: "阿里云百炼",
    region: "china",
    pricePerVideo: 0.15,
    creditsPerVideo: 15,
    maxDurationSec: 5,
  },
];

const ENV_KEY: Record<"fal" | "dashscope", string | undefined> = {
  fal: process.env.FAL_KEY,
  dashscope: process.env.DASHSCOPE_API_KEY,
};

function keyOf(id: "fal" | "dashscope", overrides?: ProviderOverrides): string | undefined {
  const ov = (overrides as { fal?: { apiKey?: string }; dashscope?: { apiKey?: string } } | undefined);
  return ov?.[id]?.apiKey || ENV_KEY[id];
}

function buildAdapters(overrides?: ProviderOverrides): Record<VideoProviderId, VideoAdapter> {
  return {
    demo: demoVideoAdapter,
    fal: createFalVideoAdapter(keyOf("fal", overrides)),
    dashscope: createDashScopeVideoAdapter(
      keyOf("dashscope", overrides),
      (overrides as { dashscope?: { baseUrl?: string } } | undefined)?.dashscope?.baseUrl
    ),
  };
}

/** 默认按 env 构建（BYOK 覆盖在 generateVideo 内按调用构建） */
let cache: Record<VideoProviderId, VideoAdapter> | null = null;
function getAdapters(): Record<VideoProviderId, VideoAdapter> {
  if (!cache) cache = buildAdapters();
  return cache;
}

export function getVideoModel(id: string): VideoModelInfo {
  return VIDEO_MODELS.find((m) => m.id === id) ?? VIDEO_MODELS[0];
}

export function getVideoProviderStatus(): Record<VideoProviderId, boolean> {
  const a = getAdapters();
  return {
    demo: true,
    fal: a.fal.isConfigured(),
    dashscope: a.dashscope.isConfigured(),
  };
}

/** 生成视频：demo 恒可用；真实模型需 FAL_KEY / DASHSCOPE_API_KEY（自动启用） */
export async function generateVideo(
  prompt: string,
  modelId?: string,
  opts?: {
    size?: "16:9" | "9:16" | "1:1";
    durationSec?: number;
    overrides?: ProviderOverrides;
  }
): Promise<VideoResult> {
  const model = getVideoModel(modelId ?? "demo-video");
  const overrides = opts?.overrides;
  const adapters = overrides ? buildAdapters(overrides) : getAdapters();
  const adapter = adapters[model.provider];
  if (!adapter || !adapter.isConfigured()) {
    throw new Error(
      model.provider === "demo"
        ? "演示视频初始化失败"
        : `「${model.label}」未配置密钥：请设置 ${model.provider === "fal" ? "FAL_KEY" : "DASHSCOPE_API_KEY"} 后使用（演示视频 demo-video 始终可用）`
    );
  }
  return adapter.generate(prompt, {
    model: model.id,
    durationSec: Math.min(opts?.durationSec ?? model.maxDurationSec, 10),
    size: opts?.size ?? "16:9",
  });
}
