import { resolveModel, getProviders, type ProviderOverrides } from "@/lib/gateway";
import { runResearch } from "@/lib/research/engine";
import { checkText } from "@/lib/moderation";
import { logGatewayUsage } from "@/lib/db/repo";
import { getUserFromRequest } from "@/lib/auth";

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
    depth?: "basic" | "advanced";
    maxResults?: number;
  };
  const topic = (body.topic ?? "").trim();
  if (!topic) {
    return new Response(JSON.stringify({ error: "topic 不能为空" }), { status: 400 });
  }
  const mod = checkText(topic);
  if (!mod.ok) {
    return new Response(JSON.stringify({ error: mod.reason }), { status: 400 });
  }
  const depth = body.depth === "basic" ? "basic" : "advanced";
  const maxResults = body.maxResults === 5 || body.maxResults === 8 ? body.maxResults : 6;

  const modelId = body.model ?? "demo";
  const { providerId } = resolveModel(modelId, null);
  const providers = body.overrides
    ? (await import("@/lib/gateway")).buildProviders(body.overrides)
    : getProviders();
  const providerReady = modelId !== "demo" && providers[providerId].isConfigured();
  const useModel = providerReady ? modelId : "demo";

  const uid = getUserFromRequest(req)?.id ?? null;
  const encoder = new TextEncoder();
  const sse = (p: unknown) => encoder.encode(`data: ${JSON.stringify(p)}\n\n`);

  const stream = new ReadableStream({
    async start(controller) {
      const send = (p: unknown) => controller.enqueue(sse(p));
      const started = Date.now();
      try {
        const report = await runResearch(topic, {
          model: useModel,
          overrides: body.overrides,
          tavilyKey: body.tavilyKey,
          depth,
          maxResults,
          onProgress: (message) => send({ type: "status", message }),
        });
        // demo 模式免费但计入网关看板（真实模式已由 streamChatCompletion 按模型记账）
        if (report.demo) {
          logGatewayUsage({
            userId: uid,
            modelId: "research-demo",
            providerId: "research",
            status: "success",
            inputTokens: Math.max(1, Math.ceil(topic.length / 3.5)),
            costUsd: 0,
            credits: 0,
            latencyMs: Date.now() - started,
          });
        }
        send({ type: "report", report });
      } catch (err) {
        // 真实模式失败已由网关层按模型记账，这里只补 demo 错误记录
        if (useModel === "demo") {
          logGatewayUsage({
            userId: uid,
            modelId: "research-demo",
            providerId: "research",
            status: "error",
            inputTokens: Math.max(1, Math.ceil(topic.length / 3.5)),
            error: err instanceof Error ? err.message.slice(0, 200) : "研究失败",
            latencyMs: Date.now() - started,
          });
        }
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
