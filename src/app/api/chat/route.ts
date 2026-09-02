import {
  streamChatCompletion,
  type ChatMessage,
  type ProviderId,
  type ProviderOverrides,
} from "@/lib/gateway";
import { checkText, createOutputGuard } from "@/lib/moderation";

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

  // 输入内容审核（本地规则；命中直接拒绝）
  const userText = messages.map((m) => m.content).join("\n");
  const mod = checkText(userText);
  if (!mod.ok) {
    return Response.json({ error: mod.reason }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const sse = (payload: unknown) => encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
  const guard = createOutputGuard();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await streamChatCompletion(
          model,
          messages,
          {
            onToken: (delta) => {
              // 输出流式审核：命中即终止
              const hit = guard.feed(delta);
              if (hit) {
                controller.enqueue(sse({ type: "error", message: hit }));
                controller.close();
                throw new Error(`MODERATION:${hit}`);
              }
              controller.enqueue(sse({ type: "token", delta }));
            },
            // 客户端断开/停止时同步中断上游模型流，避免白烧 token
            signal: req.signal,
          },
          overrides,
          body.provider ?? null
        );
        controller.enqueue(
          sse({ type: "usage", credits: result.credits, costUsd: result.costUsd })
        );
        // 真实计费扣积分（demo 模型 costUsd=0，credits=0，自动跳过）
        if (result.credits > 0) {
          try {
            (await import("@/lib/db/repo")).repo.addCredits(-result.credits, "AI 对话");
          } catch {
            /* 数据库不可用时忽略 */
          }
        }
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
