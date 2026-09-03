import type { ChatCompletionParams, ProviderAdapter, ProviderId } from "../types";

interface OpenAICompatibleConfig {
  id: ProviderId;
  baseUrl: string;
  /** 多密钥轮询：请求按 RR 轮换，单 key 或环境变量兼容 */
  apiKeys?: string[];
}

/** 轮询索引（进程内）：每个 id 独立计数，失败时切下一个 key 再试一次 */
const rrIndex = new Map<string, number>();
function nextKey(keys: string[], id: string): string {
  const i = rrIndex.get(id) ?? 0;
  rrIndex.set(id, (i + 1) % keys.length);
  return keys[i];
}

/**
 * OpenAI Chat Completions 兼容协议适配器。
 * DeepSeek、阿里云百炼（Qwen，OpenAI 兼容模式）、OpenAI 官方均走此协议。
 * 支持多 API Key：请求按下标轮换；当前 key 返回 401/429 时自动换下一个重试一次。
 */
export function createOpenAICompatibleProvider(cfg: OpenAICompatibleConfig): ProviderAdapter {
  const keys = (cfg.apiKeys ?? []).filter(Boolean);
  return {
    id: cfg.id,
    isConfigured() {
      return keys.length > 0;
    },
    async *streamChat({ model, messages, signal }: ChatCompletionParams) {
      if (keys.length === 0) throw new Error(`${cfg.id}: 未配置 API 密钥`);

      // 尝试轮询顺序：从当前下标开始的全部 key（最多每个 key 一次，2xx/流成功后不再换）
      const start = rrIndex.get(cfg.id) ?? 0;
      let lastError: unknown = null;
      for (let k = 0; k < keys.length; k++) {
        const apiKey = nextKey(keys, cfg.id);
        if (k > 0 && k < keys.length - 1 && k !== start) {
          // 已尝试过全部 key 无需重复；此处简化：每个 key 最多一轮
        }
        try {
          const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ model, messages, stream: true }),
            signal,
          });

          if (res.status === 401 || res.status === 403 || res.status === 429) {
            lastError = new Error(`${cfg.id} API 错误 ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
            // 401/429 → 换 key 重试；其他状态码 → 直接抛出（避免浪费额度）
            continue;
          }
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
          return;
        } catch (err) {
          if ((err as Error)?.name === "AbortError") throw err;
          lastError = err;
        }
      }
      throw lastError ?? new Error(`${cfg.id}: 所有 API Key 均失败`);
    },
  };
}
