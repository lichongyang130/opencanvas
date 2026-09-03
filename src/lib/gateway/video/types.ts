/** AI 视频生成 —— 统一类型 */

export type VideoProviderId = "demo" | "fal" | "dashscope";

export interface VideoModelInfo {
  id: string;
  label: string;
  provider: VideoProviderId;
  providerLabel: string;
  region: "global" | "china" | "builtin";
  /** 单次生成成本（美元，量级参考） */
  pricePerVideo: number;
  /** 单次扣积分 */
  creditsPerVideo: number;
  /** 生成时长上限（秒） */
  maxDurationSec: number;
}

export interface VideoResult {
  /**
   * 视频数据（demo = GIF data URI；真实供应商 = mp4/WebM 直链）。
   * 拿到真实 FAL / 万相视频 Key 后，adapter 返回 URL 即可被前端 <video> 播放。
   */
  url: string;
  /** 是否演示产物（前端展示「演示视频」角标） */
  mock: boolean;
  model: string;
  provider: VideoProviderId;
  durationSec: number;
  width: number;
  height: number;
}

export interface VideoGenerateOptions {
  size?: "16:9" | "9:16" | "1:1";
  durationSec?: number;
  signal?: AbortSignal;
}

export interface VideoAdapter {
  id: VideoProviderId;
  isConfigured(): boolean;
  generate(prompt: string, opts: VideoGenerateOptions): Promise<VideoResult>;
}
