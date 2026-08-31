import { resolveModel, getProviders, type ProviderOverrides } from "@/lib/gateway";
import { runResearch } from "@/lib/research/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 深度研究 —— SSE。
 * 请求: { topic, model, overrides?, tavilyKey? }
 * 事件: {type:"status",message} → {type:"report",report} | {type:"error",message}
 * 无 Tavily 密钥时返回结构完整的示例报告（来源标注「示例」）。
 */
export async function POST(req: Request) {
  const body = (await req.json()) as {
    topic?: string;
    model?: string;
    overrides?: ProviderOverrides;
    tavilyKey?: string;
  };
  const topic = (body.topic ?? "").trim();
  if (!topic) {
    return new Response(JSON.stringify({ error: "topic 不能为空" }), { status: 400 });
  }

  const modelId = body.model ?? "demo";
  const { providerId } = resolveModel(modelId, null);
  const providers = body.overrides
    ? (await import("@/lib/gateway")).buildProviders(body.overrides)
    : getProviders();
  const providerReady = modelId !== "demo" && providers[providerId].isConfigured();
  const useModel = providerReady ? modelId : "demo";

  const encoder = new TextEncoder();
  const sse = (p: unknown) => encoder.encode(`data: ${JSON.stringify(p)}\n\n`);

  const stream = new ReadableStream({
    async start(controller) {
      const send = (p: unknown) => controller.enqueue(sse(p));
      try {
        const report = await runResearch(topic, {
          model: useModel,
          overrides: body.overrides,
          tavilyKey: body.tavilyKey,
          onProgress: (message) => send({ type: "status", message }),
        });
        send({ type: "report", report });
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : "研究失败" });
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
