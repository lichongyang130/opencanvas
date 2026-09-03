import { generateVideo } from "@/lib/gateway/video";
import { logGatewayUsage } from "@/lib/db/repo";
import { getUserFromRequest } from "@/lib/auth";
import { checkText } from "@/lib/moderation";
import type { ProviderOverrides } from "@/lib/gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * AI 视频生成：POST /api/video { prompt, model? }
 * demo 视频零密钥可用（GIF 动画 data URI）；真实模型（FAL/万相）接入后自动生效。
 * 用量落 gateway_usage（成本看板可见）；demo 视频 credits=0 免费。
 * 供应商/模型清单：GET /api/video/status
 */
export async function POST(req: Request) {
  const uid = getUserFromRequest(req)?.id ?? null;
  const body = (await req.json().catch(() => ({}))) as {
    prompt?: string;
    model?: string;
    overrides?: ProviderOverrides;
  };
  const prompt = (body.prompt ?? "").trim();
  if (!prompt) return Response.json({ error: "请输入视频描述" }, { status: 400 });
  if (prompt.length > 500) return Response.json({ error: "描述过长（最多 500 字）" }, { status: 400 });

  const mod = checkText(prompt);
  if (!mod.ok) return Response.json({ error: mod.reason }, { status: 400 });

  const started = Date.now();
  try {
    const result = await generateVideo(prompt, body.model, body.overrides);
    // 用量落库（demo 免费但计入看板；真实模型按 creditsPerVideo 扣费）
    logGatewayUsage({
      userId: uid ?? null,
      modelId: result.model,
      providerId: result.provider,
      status: "success",
      inputTokens: Math.max(1, Math.ceil(prompt.length / 3.5)),
      outputTokens: 0,
      costUsd: 0,
      credits: 0,
      latencyMs: Date.now() - started,
    });
    return Response.json({ ok: true, ...result });
  } catch (err) {
    logGatewayUsage({
      userId: uid ?? null,
      modelId: body.model ?? "demo-video",
      providerId: "demo",
      status: "error",
      inputTokens: Math.max(1, Math.ceil(prompt.length / 3.5)),
      error: err instanceof Error ? err.message.slice(0, 200) : "生成失败",
      latencyMs: Date.now() - started,
    });
    return Response.json(
      { error: err instanceof Error ? err.message : "视频生成失败" },
      { status: 500 }
    );
  }
}
