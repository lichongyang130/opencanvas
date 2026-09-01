import {
  streamChatCompletion,
  type ChatMessage,
  type ProviderId,
  type ProviderOverrides,
} from "@/lib/gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 对话接口 —— SSE 流式输出。
 * 请求: { model, messages, overrides?, provider? }
 * 响应: text/event-stream
 *   data: {"type":"token","delta":"..."}      逐块文本
 *   data: {"type":"usage","credits":n,...}    结束时的用量/计费
 *   data: {"type":"error","message":"..."}    错误
 */
export async function POST(req: Request) {
  const body = (await req.json()) as {
    model?: string;
    messages?: ChatMessage[];
    overrides?: ProviderOverrides;
    provider?: ProviderId | null;
  };
  const model = body.model ?? "demo";
  const messages = body.messages ?? [];
  const overrides = body.overrides;

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages 不能为空" }), { status: 400 });
  }

  const encoder = new TextEncoder();
  const sse = (payload: unknown) => encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await streamChatCompletion(
          model,
          messages,
          {
            onToken: (delta) => controller.enqueue(sse({ type: "token", delta })),
            // 客户端断开/停止时同步中断上游模型流，避免白烧 token
            signal: req.signal,
          },
          overrides,
          body.provider ?? null
        );
        controller.enqueue(
          sse({ type: "usage", credits: result.credits, costUsd: result.costUsd })
        );
      } catch (err) {
        controller.enqueue(
          sse({ type: "error", message: err instanceof Error ? err.message : "未知错误" })
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
