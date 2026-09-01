import { resolveModel } from "./models";
import { calcUsageCost, estimateTokens } from "./credits";
import { buildProviders, getProviders, getProviderConfigStatus } from "./providers";
import type { ChatMessage, ProviderId, ProviderOverrides } from "./types";

export * from "./types";
export * from "./models";
export * from "./credits";
export { getProviders, getProviderConfigStatus, buildProviders, getEnvApiKey } from "./providers";

export interface StreamHandlers {
  onToken: (delta: string) => void;
  signal?: AbortSignal;
}

/**
 * 网关统一入口：按 model id 路由到对应供应商，流式回调 token，
 * 结束后返回用量与应扣积分。overrides 为前台传入的 BYOK 配置。
 */
export async function streamChatCompletion(
  modelId: string,
  messages: ChatMessage[],
  handlers: StreamHandlers,
  overrides?: ProviderOverrides,
  providerHint?: ProviderId | null
): Promise<{ credits: number; costUsd: number; outputTokens: number }> {
  const { model, providerId } = resolveModel(modelId, providerHint);
  const providers = overrides ? buildProviders(overrides) : getProviders();
  const provider = providers[providerId];

  if (!provider.isConfigured()) {
    throw new Error(`模型「${model.label}」的供应商未配置密钥，请在模型设置中配置或切换演示模型`);
  }

  let output = "";
  for await (const delta of provider.streamChat({ model: model.id, messages, signal: handlers.signal })) {
    output += delta;
    handlers.onToken(delta);
  }

  const inputText = messages.map((m) => m.content).join("\n");
  const usage = calcUsageCost(
    estimateTokens(inputText),
    estimateTokens(output),
    model.inputPricePerMtok,
    model.outputPricePerMtok
  );

  return { credits: usage.credits, costUsd: usage.costUsd, outputTokens: usage.outputTokens };
}
