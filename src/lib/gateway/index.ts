import { fallbackChain, resolveModel } from "./models";
import { calcUsageCost, estimateTokens } from "./credits";
import { buildProviders, getProviders, getProviderConfigStatus } from "./providers";
import { checkRateLimit, startRateLimitCleanup } from "./ratelimit";
import { logGatewayUsage } from "@/lib/db/repo";
import type { ChatMessage, GatewayContext, ProviderId, ProviderOverrides } from "./types";

export * from "./types";
export * from "./models";
export * from "./credits";
export { getProviders, getProviderConfigStatus, buildProviders, getEnvApiKey } from "./providers";
export { checkRateLimit, getRateLimitPerMin } from "./ratelimit";

export interface StreamHandlers {
  onToken: (delta: string) => void;
  /** 降级/切换供应商时提示（可选） */
  onStatus?: (message: string) => void;
  signal?: AbortSignal;
}

/** 网关是否启用跨供应商自动降级（env GATEWAY_FALLBACK=1 默认开，0 关） */
export function isFallbackEnabled(): boolean {
  return String(process.env.GATEWAY_FALLBACK ?? "1") !== "0";
}

startRateLimitCleanup();

/**
 * 网关统一入口：
 * 1. 限流（按用户/IP，GATEWAY_RATE_LIMIT 次/分钟，默认 60）
 * 2. 跨供应商降级：模型失败且未输出任何 token 时，沿 fallback 链换供应商重试
 * 3. 多 Key 轮询：供应商适配器内部处理（401/429 自动换 key）
 * 4. 真实用量落库（gateway_usage），供成本看板统计
 */
export async function streamChatCompletion(
  modelId: string,
  messages: ChatMessage[],
  handlers: StreamHandlers,
  overrides?: ProviderOverrides,
  providerHint?: ProviderId | null,
  ctx?: GatewayContext
): Promise<{ credits: number; costUsd: number; outputTokens: number }> {
  const identity = ctx?.userId || ctx?.ip || "anon";
  const rl = checkRateLimit(identity);
  if (!rl.ok) {
    throw Object.assign(new Error(`请求过于频繁，请 ${Math.ceil(rl.retryAfterMs / 1000)} 秒后再试`), {
      status: 429,
    });
  }

  const providers = overrides ? buildProviders(overrides) : getProviders();
  const used = resolveModel(modelId, providerHint);
  const chain = isFallbackEnabled() ? fallbackChain(used.model.id) : [used];

  const startAt = Date.now();
  const attempt = async (): Promise<{
    output: string;
    model: ReturnType<typeof resolveModel>["model"];
    providerId: ProviderId;
    usedFallback: boolean;
  }> => {
    let lastError: unknown = null;
    for (let i = 0; i < chain.length; i++) {
      const candidate = chain[i];
      const provider = providers[candidate.providerId];
      if (!provider) continue;
      if (!provider.isConfigured()) {
        // 未配置 → 直接走下一位，不做无意义请求（demo 恒可用）
        continue;
      }
      if (i > 0) {
        handlers.onStatus?.(
          `「${candidate.model.label}」的供应商不可用，已自动降级到「${candidate.model.label}」…`
        );
      }

      let output = "";
      let flushed = false;
      try {
        for await (const delta of provider.streamChat({
          model: candidate.model.id,
          messages,
          signal: handlers.signal,
        })) {
          output += delta;
          if (!flushed) {
            handlers.onToken(delta);
            flushed = true;
          } else {
            handlers.onToken(delta);
          }
        }
        return {
          output,
          model: candidate.model,
          providerId: candidate.providerId,
          usedFallback: i > 0,
        };
      } catch (err) {
        if ((err as Error)?.name === "AbortError" || handlers.signal?.aborted) throw err;
        lastError = err;
        if (flushed) throw err; // 已开始流式输出，无法安全降级
        handlers.onStatus?.(
          `${candidate.model.label} 调用失败（${err instanceof Error ? err.message : "上游错误"}）${
            i < chain.length - 1 ? "，正在切换备用供应商…" : ""
          }`
        );
      }
    }
    throw (
      lastError ??
      new Error("所有候选供应商均未配置密钥，请在模型设置中配置后重试（可切换演示模型）")
    );
  };

  const result = await attempt();
  const durationMs = Date.now() - startAt;
  const inputText = messages.map((m) => m.content).join("\n");
  const usage = calcUsageCost(
    estimateTokens(inputText),
    estimateTokens(result.output),
    result.model.inputPricePerMtok,
    result.model.outputPricePerMtok
  );

  // 用量落库（异步，不阻塞响应）
  try {
    logGatewayUsage({
      userId: ctx?.userId ?? null,
      sessionId: ctx?.sessionId ?? null,
      modelId: result.model.id,
      providerId: result.providerId,
      fallback: result.usedFallback,
      status: "success",
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      costUsd: usage.costUsd,
      credits: usage.credits,
      latencyMs: durationMs,
    });
  } catch {
    /* 日志失败不影响主流程 */
  }

  return { credits: usage.credits, costUsd: usage.costUsd, outputTokens: usage.outputTokens };
}
