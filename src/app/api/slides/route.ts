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
import { parseSlideDeck, parseSingleSlide } from "@/lib/slides/parse";
import { applyOutlineToSample, buildSampleDeck } from "@/lib/slides/sample";
import type { Slide, SlideDeck, SlideOutline } from "@/lib/slides/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** AI 单页重写的系统提示词（输出单页 JSON） */
const REWRITE_SYSTEM = `你是演示文稿设计助手。请把用户提供的单页 PPT 数据改写得更专业、信息密度更高。

严格要求：
1. 只输出一个 JSON 对象，不要输出 markdown 代码块、不要任何解释。
2. 结构与该页原结构一致（保留 layout），仅改写文字内容；若原版式不适合可换成更合适的 layout（content/twoCol/stats/timeline/compare/process/quote/team）。
3. 要点每条不超过 22 个汉字，3~5 条；stats 的 value 简短有力。
4. imagePrompt 用英文短语描述配图（主体+风格+色调）；不需要配图可省略。
5. 不要改变主题与页码信息。`;

/**
 * PPT 生成接口 —— SSE。
 * 请求: { topic, model, theme?, context?, outline? } 或 { mode:"rewrite", slide }
 * 事件: {type:"status",message} → {type:"deck",deck} / {type:"slide",slide} | {type:"error",message}
 * outline 为「大纲先行」用户确认后的目录，生成时严格遵循章节顺序与标题。
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
    mode?: "rewrite";
    slide?: Slide;
    outline?: SlideOutline | null;
  };
  const topic = (body.topic ?? "").trim();
  const context = (body.context ?? "").trim();
  const modelId = body.model ?? "demo";
  const theme = themeOrDefault(body.theme);
  const overrides = body.overrides;
  const outline: SlideOutline | null =
    body.outline && Array.isArray(body.outline.sections) && body.outline.sections.length > 0
      ? body.outline
      : null;
  const rewriteMode = body.mode === "rewrite" && body.slide;

  if (!topic && !rewriteMode) {
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
        // ── AI 单页重写模式 ──
        if (rewriteMode && body.slide) {
          if (!providerReady || modelId === "demo") {
            send({ type: "status", message: "演示模式未配置真实模型，保留原页" });
            send({ type: "slide", slide: body.slide });
            controller.close();
            return;
          }
          send({ type: "status", message: "AI 正在改写本页…" });
          let raw = "";
          await streamChatCompletion(
            modelId,
            [
              { role: "system", content: REWRITE_SYSTEM },
              {
                role: "user",
                content: `请改写以下 PPT 页面（JSON），并在内容上做提升：\n${JSON.stringify(body.slide, null, 2)}`,
              },
            ],
            { onToken: (delta) => { raw += delta; } },
            overrides,
            providerId
          );
          const slide = parseSingleSlide(raw);
          send({ type: "slide", slide });
          controller.close();
          return;
        }

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
          if (outline) deck = applyOutlineToSample(deck, outline);
        } else {
          // 真实模型路径
          const { system, user } = buildSlidesPrompt(topic, context, outline);
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
