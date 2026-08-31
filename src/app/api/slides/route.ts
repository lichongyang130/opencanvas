import {
  buildProviders,
  getProviders,
  resolveModel,
  streamChatCompletion,
  type ChatMessage,
  type ProviderId,
  type ProviderOverrides,
} from "@/lib/gateway";
import { buildSlidesPrompt, themeOrDefault } from "@/lib/slides/prompt";
import { parseSlideDeck } from "@/lib/slides/parse";
import { buildSampleDeck } from "@/lib/slides/sample";
import type { SlideDeck } from "@/lib/slides/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * PPT 生成接口 —— SSE。
 * 请求: { topic: string, model: string, theme?: ThemeId }
 * 事件: {type:"status",message} → {type:"deck",deck} | {type:"error",message}
 * 演示模型/未配置密钥时返回内置示例 PPT，保证零配置可体验。
 */
export async function POST(req: Request) {
  const body = (await req.json()) as {
    topic?: string;
    model?: string;
    provider?: ProviderId | null;
    theme?: string;
    overrides?: ProviderOverrides;
    context?: string;
  };
  const topic = (body.topic ?? "").trim();
  const context = (body.context ?? "").trim();
  const modelId = body.model ?? "demo";
  const theme = themeOrDefault(body.theme);
  const overrides = body.overrides;

  if (!topic) {
    return new Response(JSON.stringify({ error: "topic 不能为空" }), { status: 400 });
  }

  const { providerId } = resolveModel(modelId, body.provider ?? null);
  const providers = overrides ? buildProviders(overrides) : getProviders();
  const providerReady = modelId === "demo" ? false : providers[providerId].isConfigured();

  const encoder = new TextEncoder();
  const sse = (payload: unknown) => encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => controller.enqueue(sse(payload));
      try {
        let deck: SlideDeck;

        if (!providerReady || modelId === "demo") {
          // 演示路径：模拟生成进度；基于研究报告时标题体现来源
          const steps = [
            "正在规划幻灯片结构…",
            "正在撰写各页内容…",
            "正在排版与配图…",
          ];
          for (const s of steps) {
            send({ type: "status", message: s });
            await sleep(450);
          }
          deck = buildSampleDeck(context ? `${topic}·研究汇报` : topic, theme);
        } else {
          // 真实模型路径
          const { system, user } = buildSlidesPrompt(topic, context);
          const messages: ChatMessage[] = [
            { role: "system", content: system },
            { role: "user", content: user },
          ];

          let raw = "";
          let lastProgress = 0;
          send({ type: "status", message: "AI 正在生成幻灯片大纲与内容…" });

          const usage = await streamChatCompletion(
            modelId,
            messages,
            {
              onToken: (delta) => {
                raw += delta;
                // 每累积约 400 字符推送一次进度
                const pages = Math.min(12, 2 + Math.floor(raw.length / 400));
                if (raw.length - lastProgress > 400) {
                  lastProgress = raw.length;
                  send({ type: "status", message: `正在撰写第 ${pages} 页内容…` });
                }
              },
            },
            overrides,
            providerId
          );

          send({ type: "status", message: "正在解析与排版…" });
          deck = parseSlideDeck(raw, topic);
          send({ type: "usage", credits: usage.credits });
        }

        deck.theme = theme;
        send({ type: "deck", deck });
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "幻灯片生成失败",
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
