import {
  buildProviders,
  getProviders,
  resolveModel,
  streamChatCompletion,
  type ChatMessage,
  type ProviderId,
  type ProviderOverrides,
} from "@/lib/gateway";
import { buildOutlinePrompt } from "@/lib/slides/prompt";
import { parseSlideOutline } from "@/lib/slides/parse";
import { buildSampleOutline } from "@/lib/slides/sample";
import type { SlideOutline } from "@/lib/slides/types";
import { getUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * PPT 大纲生成接口 —— SSE。
 * 请求: { topic, model?, provider?, overrides?, context? }
 * 事件: {type:"status",message} → {type:"outline",outline} | {type:"error",message}
 * 演示模型/未配置密钥时返回内置示例大纲，保证零配置可体验。
 */
export async function POST(req: Request) {
  const body = (await req.json()) as {
    topic?: string;
    model?: string;
    provider?: ProviderId | null;
    overrides?: ProviderOverrides;
    context?: string;
  };
  const topic = (body.topic ?? "").trim();
  const context = (body.context ?? "").trim();
  if (!topic) {
    return new Response(JSON.stringify({ error: "topic 不能为空" }), { status: 400 });
  }

  const modelId = body.model ?? "demo";
  const overrides = body.overrides;
  const authUser = getUserFromRequest(req);
  const gatewayCtx = {
    userId: authUser?.id ?? null,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
  };
  const { providerId } = resolveModel(modelId, body.provider ?? null);
  const providers = overrides ? buildProviders(overrides) : getProviders();
  const providerReady = modelId === "demo" ? false : providers[providerId].isConfigured();

  const encoder = new TextEncoder();
  const sse = (payload: unknown) => encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => controller.enqueue(sse(payload));
      try {
        let outline: SlideOutline;
        if (!providerReady || modelId === "demo") {
          send({ type: "status", message: "正在规划大纲（演示）…" });
          await sleep(500);
          outline = buildSampleOutline(topic);
        } else {
          const { system, user } = buildOutlinePrompt(topic, context);
          const messages: ChatMessage[] = [
            { role: "system", content: system },
            { role: "user", content: user },
          ];
          send({ type: "status", message: "AI 正在规划章节结构…" });
          let raw = "";
          await streamChatCompletion(
            modelId,
            messages,
            { onToken: (delta) => { raw += delta; } },
            overrides,
            providerId,
            gatewayCtx
          );
          send({ type: "status", message: "正在整理大纲…" });
          outline = parseSlideOutline(raw, topic);
        }
        send({ type: "outline", outline });
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "大纲生成失败",
        });
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
