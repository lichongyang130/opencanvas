import type { ChatCompletionParams, ProviderAdapter } from "../types";

/**
 * Anthropic Messages API 适配器（Claude 系列，海外）。
 * 协议与 OpenAI 不同：system 消息需单独传字段，SSE 事件类型为 content_block_delta。
 * 支持自定义 baseUrl（用于兼容 Anthropic 协议的中转服务）。
 */
export function createAnthropicProvider(apiKey?: string, baseUrl?: string): ProviderAdapter {
  const root = (baseUrl || "https://api.anthropic.com").replace(/\/+$/, "");
  return {
    id: "anthropic",
    isConfigured() {
      return Boolean(apiKey);
    },
    async *streamChat({ model, messages, signal }: ChatCompletionParams) {
      if (!apiKey) throw new Error("anthropic: 未配置 API 密钥");

      const system = messages
        .filter((m) => m.role === "system")
        .map((m) => m.content)
        .join("\n");
      const turns = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));

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
    },
  };
}
