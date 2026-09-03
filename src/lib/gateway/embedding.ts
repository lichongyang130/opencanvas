import { logGatewayUsage } from "@/lib/db/repo";
import type { ProviderOverrides } from "./types";

/**
 * Embedding 向量接入（知识库语义检索用，server-only）。
 * 供应商优先级：DashScope（text-embedding-v3，国内）→ OpenAI（text-embedding-3-small，海外）。
 * 密钥来源：前台 BYOK overrides → 环境变量。未配置时抛错，由调用方降级到本地 TF-IDF。
 */

const DASH_EMBED_MODEL = "text-embedding-v3";
const OPENAI_EMBED_MODEL = "text-embedding-3-small";

const DASH_BASE = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const OPENAI_BASE = "https://api.openai.com/v1";

export interface EmbeddingResult {
  vectors: number[][];
  model: string;
  provider: "dashscope" | "openai";
  inputTokens: number;
}

type EmbProvider = EmbeddingResult["provider"] | null;

/** 找到可用的 embedding 供应商密钥（不泄露内容） */
export function resolveEmbedding(overrides?: ProviderOverrides): { provider: EmbProvider; model: string } {
  const dashKey =
    overrides?.dashscope?.apiKey?.trim() || process.env.DASHSCOPE_API_KEY?.trim() || "";
  if (dashKey) return { provider: "dashscope", model: DASH_EMBED_MODEL };
  const openaiKey = overrides?.openai?.apiKey?.trim() || process.env.OPENAI_API_KEY?.trim() || "";
  if (openaiKey) return { provider: "openai", model: OPENAI_EMBED_MODEL };
  return { provider: null, model: "" };
}

export function embeddingConfigured(overrides?: ProviderOverrides): boolean {
  return resolveEmbedding(overrides).provider !== null;
}

/** OpenAI 兼容 /embeddings 调用（DashScope compatible-mode 同协议） */
async function callEmbeddings(
  base: string,
  apiKey: string,
  model: string,
  texts: string[]
): Promise<number[][]> {
  const res = await fetch(`${base}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input: texts }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Embedding API 错误 ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    data?: { embedding: number[] }[];
    usage?: { prompt_tokens?: number; total_tokens?: number };
  };
  const vectors = (data.data ?? [])
    .sort((a, b) => a.embedding.length - b.embedding.length) // 保序兜底不排序
    .map((d) => d.embedding);
  if (vectors.length === 0) throw new Error("Embedding 返回为空");
  return vectors;
}

/**
 * 批量向量化：texts 空数组直接返回空；调用失败抛错（调用方降级）。
 * 记录 gateway_usage（modelId=embedding 模型，cost 按默认档，避免漏计）。
 */
export async function embedTexts(
  texts: string[],
  overrides?: ProviderOverrides,
  meta?: { userId?: string | null }
): Promise<EmbeddingResult> {
  if (texts.length === 0) return { vectors: [], model: "", provider: "dashscope", inputTokens: 0 };
  const { provider, model } = resolveEmbedding(overrides);
  if (!provider) throw new Error("未配置 Embedding 密钥（DASHSCOPE/OPENAI）");

  const apiKey =
    provider === "dashscope"
      ? overrides?.dashscope?.apiKey?.trim() || process.env.DASHSCOPE_API_KEY!.trim()
      : overrides?.openai?.apiKey?.trim() || process.env.OPENAI_API_KEY!.trim();
  const base = provider === "dashscope" ? DASH_BASE : OPENAI_BASE;

  const vectors = await callEmbeddings(base, apiKey, model, texts);
  const inputTokens = texts.reduce((n, t) => n + Math.ceil(t.length / 3.5), 0);

  try {
    logGatewayUsage({
      modelId: model,
      providerId: provider,
      status: "success",
      inputTokens,
      outputTokens: 0,
      costUsd: 0.0001 * inputTokens, // 量级参考价（$0.1/M token 级）
      credits: Math.max(1, Math.ceil((0.0001 * inputTokens * 2) / 0.02)),
      latencyMs: 0,
      userId: meta?.userId ?? null,
    });
  } catch {
    /* 日志失败不影响 */
  }

  return { vectors, model, provider, inputTokens };
}
