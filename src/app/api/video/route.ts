import { generateVideo, getVideoModel } from "@/lib/gateway/video";
import { logGatewayUsage } from "@/lib/db/repo";
import { repo } from "@/lib/db/repo";
import { getUserFromRequest } from "@/lib/auth";
import { checkText } from "@/lib/moderation";
import type { ProviderOverrides } from "@/lib/gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * AI 视频生成：POST /api/video { prompt, model?, size?, durationSec?, overrides? }
 * - demo 视频零密钥可用（GIF data URI，免费）
 * - 真实模型（FAL_Kling / 万相）：需对应环境变量；调用前预检积分，成功后按模型标价扣费
 * 用量落 gateway_usage（成本看板可见）；供应商/模型清单：GET /api/video/status
 */
export async function POST(req: Request) {
  const uid = getUserFromRequest(req)?.id ?? null;
  const body = (await req.json().catch(() => ({}))) as {
    prompt?: string;
    model?: string;
    size?: "16:9" | "9:16" | "1:1";
    durationSec?: number;
    overrides?: ProviderOverrides;
  };
  const prompt = (body.prompt ?? "").trim();
  if (!prompt) return Response.json({ error: "请输入视频描述" }, { status: 400 });
  if (prompt.length > 500) return Response.json({ error: "描述过长（最多 500 字）" }, { status: 400 });

  const mod = checkText(prompt);
  if (!mod.ok) return Response.json({ error: mod.reason }, { status: 400 });

  const model = getVideoModel(body.model ?? "demo-video");
  const credits = model.creditsPerVideo;
  const isPaid = model.provider !== "demo" && credits > 0;

  // 真实模型：调用前积分预检（失败不扣费）
  if (isPaid) {
    const balance = repo.creditBalance(uid);
    if (balance < credits) {
      return Response.json(
        { error: `积分不足（当前 ${balance} / 需要 ${credits}），请先充值`, code: "INSUFFICIENT_CREDITS" },
        { status: 402 }
      );
    }
  }

  const started = Date.now();
  try {
    const result = await generateVideo(prompt, model.id, {
      size: body.size,
      durationSec: body.durationSec,
      overrides: body.overrides,
    });
    // 真实模型：成功后结算扣费；失败回滚见 catch（不扣）
    if (isPaid) {
      repo.addCredits(-credits, "AI 视频生成", model.id, uid);
    }
    // 用量落库（demo 免费但计入看板）
    logGatewayUsage({
      userId: uid ?? null,
      modelId: result.model,
      providerId: result.provider,
      status: "success",
      inputTokens: Math.max(1, Math.ceil(prompt.length / 3.5)),
      outputTokens: 0,
      costUsd: model.pricePerVideo,
      credits: isPaid ? credits : 0,
      latencyMs: Date.now() - started,
    });
    return Response.json({ ok: true, ...result });
  } catch (err) {
    logGatewayUsage({
      userId: uid ?? null,
      modelId: model.id,
      providerId: model.provider,
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
