"use client";
/** 图像生成 —— 统一类型 */

export type ImageProviderId = "demo" | "openai" | "dashscope" | "fal";

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
  /** 是否支持图生图（imageUrl 输入） */
  imageToImage?: boolean;
}

export interface ImageResult {
  url: string; // data: URI 或 http(s) URL
  model: string;
  revisedPrompt?: string;
}

export interface ImageGenerateOptions {
  size: string;
  /** 图生图：参考图 URL / data URI */
  imageUrl?: string;
  /** 实际使用的模型 id（adapter 内部按模型走不同接口） */
  model?: string;
  /** 万相 imageedit 功能：description_edit / stylization_all / expand / doodle 等 */
  functionName?: string;
  /** 扩图方向比例（万相 expand 用） */
  scales?: { top?: number; bottom?: number; left?: number; right?: number };
  signal?: AbortSignal;
}

export interface ImageAdapter {
  id: ImageProviderId;
  isConfigured(): boolean;
  generate(prompt: string, opts: ImageGenerateOptions): Promise<ImageResult>;
}
