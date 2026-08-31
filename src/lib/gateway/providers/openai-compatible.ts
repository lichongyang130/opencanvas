import type { ChatCompletionParams, ProviderAdapter, ProviderId } from "../types";

interface OpenAICompatibleConfig {
  id: ProviderId;
  baseUrl: string;
  apiKey?: string;
}

/**
 * OpenAI Chat Completions 兼容协议适配器。
 * DeepSeek、阿里云百炼（Qwen，OpenAI 兼容模式）、OpenAI 官方均走此协议。
 */
export function createOpenAICompatibleProvider(cfg: OpenAICompatibleConfig): ProviderAdapter {
  return {
    id: cfg.id,
    isConfigured() {
      return Boolean(cfg.apiKey);
    },
    async *streamChat({ model, messages, signal }: ChatCompletionParams) {
      if (!cfg.apiKey) throw new Error(`${cfg.id}: 未配置 API 密钥`);

      const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({ model, messages, stream: true }),
        signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(`${cfg.id} API 错误 ${res.status}: ${text.slice(0, 300)}`);
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
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") return;
          try {
            const json = JSON.parse(data) as {
              choices?: { delta?: { content?: string } }[];
            };
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
            // 忽略不完整的分片
          }
        }
      }
    },
  };
}
