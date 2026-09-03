import type { ChatCompletionParams, ProviderAdapter } from "../types";

/** 轮询索引（进程内） */
const rrIndex = { n: 0 };
function nextKey(keys: string[]): string {
  const i = rrIndex.n % keys.length;
  rrIndex.n += 1;
  return keys[i];
}

/**
 * Anthropic Messages API 适配器（Claude 系列，海外）。
 * 协议与 OpenAI 不同：system 消息需单独传字段，SSE 事件类型为 content_block_delta。
 * 支持自定义 baseUrl（用于兼容 Anthropic 协议的中转服务）与多 API Key 轮换。
 */
export function createAnthropicProvider(apiKeys?: string[], baseUrl?: string): ProviderAdapter {
  const root = (baseUrl || "https://api.anthropic.com").replace(/\/+$/, "");
  const keys = (apiKeys ?? []).filter(Boolean);
  return {
    id: "anthropic",
    isConfigured() {
      return keys.length > 0;
    },
    async *streamChat({ model, messages, signal }: ChatCompletionParams) {
      if (keys.length === 0) throw new Error("anthropic: 未配置 API 密钥");

      const system = messages
        .filter((m) => m.role === "system")
        .map((m) => m.content)
        .join("\n");
      const turns = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));

      let lastError: unknown = null;
      for (let k = 0; k < keys.length; k++) {
        const apiKey = nextKey(keys);
        try {
          const res = await fetch(`${root}/v1/messages`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model,
              max_tokens: 4096,
              system: system || undefined,
              messages: turns,
              stream: true,
            }),
            signal,
          });

          if (res.status === 401 || res.status === 403 || res.status === 429) {
            lastError = new Error(`anthropic API 错误 ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
            continue;
          }
          if (!res.ok || !res.body) {
            const text = await res.text().catch(() => "");
            throw new Error(`anthropic API 错误 ${res.status}: ${text.slice(0, 300)}`);
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              try {
                const json = JSON.parse(trimmed.slice(5).trim()) as {
                  type?: string;
                  delta?: { text?: string };
                };
                if (json.type === "content_block_delta" && json.delta?.text) {
                  yield json.delta.text;
                }
              } catch {
                // 忽略不完整分片
              }
            }
          }
          return;
        } catch (err) {
          if ((err as Error)?.name === "AbortError") throw err;
          lastError = err;
        }
      }
      throw lastError ?? new Error("anthropic: 所有 API Key 均失败");
    },
  };
}
