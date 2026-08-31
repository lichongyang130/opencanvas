/** 图像生成 —— 统一类型 */

export type ImageProviderId = "demo" | "openai" | "dashscope";

export interface ImageModelInfo {
  id: string;
  label: string;
  provider: ImageProviderId;
  providerLabel: string;
  region: "global" | "china" | "builtin";
  /** 单张成本（美元，量级参考） */
  pricePerImage: number;
  /** 单张扣积分 */
  creditsPerImage: number;
}

export interface ImageResult {
  url: string; // data: URI 或 http(s) URL
  model: string;
  revisedPrompt?: string;
}

export interface ImageAdapter {
  id: ImageProviderId;
  isConfigured(): boolean;
  generate(prompt: string, opts: { size: string; signal?: AbortSignal }): Promise<ImageResult>;
}
