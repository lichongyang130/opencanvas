import type { ProviderOverrides } from "../types";
import { demoVideoAdapter } from "./demo-video";
import type { VideoAdapter, VideoModelInfo, VideoProviderId, VideoResult } from "./types";

/**
 * AI 视频网关：demo（零密钥演示）→ 真实供应商（FAL / 万相视频，配置 Key 后启用）。
 *
 * 真实供应商接入点（当前仅列出模型信息与适配器骨架，需要 Key 后实现）：
 *  - FAL（全球）：fal.run 的 kling / minimax / veo 等，POST /api/videos 拿 request_id，轮询 queue 结果
 *  - DashScope 万相（国内）：wanx2.1-t2v-turbo（异步任务，POST /api/v1/services/aigc/video-generation/video-synthesis）
 *  完成 adapter 后注册到 ADAPTERS 即可（generateVideo 自动按模型选择）。
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

const ADAPTERS: Partial<Record<VideoProviderId, VideoAdapter>> = {
  demo: demoVideoAdapter,
  // fal / dashscope：实现后在此注册
};

export function getVideoModel(id: string): VideoModelInfo {
  return VIDEO_MODELS.find((m) => m.id === id) ?? VIDEO_MODELS[0];
}

export function getVideoProviderStatus(): Record<VideoProviderId, boolean> {
  return {
    demo: true,
    fal: false, // 待 FAL_KEY
    dashscope: false, // 待 DASHSCOPE_API_KEY（万相视频任务）
  };
}

/** 生成视频：demo 恒可用；真实模型需完成供应商 adapter（当前仅 demo） */
export async function generateVideo(
  prompt: string,
  modelId?: string,
  _overrides?: ProviderOverrides
): Promise<VideoResult> {
  const model = getVideoModel(modelId ?? "demo-video");
  const adapter = ADAPTERS[model.provider] ?? ADAPTERS.demo;
  if (!adapter || !adapter.isConfigured()) {
    throw new Error(
      model.provider === "demo"
        ? "演示视频初始化失败"
        : `「${model.label}」需要真实供应商 Key，当前版本提供演示视频（demo-video）`
    );
  }
  return adapter.generate(prompt, { durationSec: Math.min(4, model.maxDurationSec) });
}
