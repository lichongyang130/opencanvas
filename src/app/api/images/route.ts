import { generateImage } from "@/lib/gateway/image";
import type { ProviderOverrides } from "@/lib/gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 文生图 / 图生图。
 * POST { model?, prompt, size?, imageUrl?, overrides? } -> { url, model, credits }
 * model 传 "auto"（或缺省）时服务端按已配置密钥自动选择（图生图优先 flux-dev / 万相 i2i）。
 * 演示模型返回 SVG data URI；真实模型返回图床 URL / base64。
 */
export async function POST(req: Request) {
  const body = (await req.json()) as {
    model?: string;
    prompt?: string;
    size?: string;
    imageUrl?: string;
    overrides?: ProviderOverrides;
  };
  const prompt = (body.prompt ?? "").trim();
  const imageUrl = (body.imageUrl ?? "").trim();
  if (!prompt) return Response.json({ error: "prompt 不能为空" }, { status: 400 });
  if (imageUrl && !/^(data:|https?:\/\/)/.test(imageUrl)) {
    return Response.json({ error: "imageUrl 格式不正确" }, { status: 400 });
  }

  try {
    const result = await generateImage(body.model ?? "auto", prompt, {
      size: body.size ?? "1024x1024",
      imageUrl: imageUrl || undefined,
      overrides: body.overrides,
    });
    // 真实计费扣积分（demo 模型 credits=0 自动跳过；失败不扣）
    if (result.credits > 0) {
      try {
        (await import("@/lib/db/repo")).repo.addCredits(-result.credits, "AI 绘图");
      } catch {
        /* 数据库不可用时忽略 */
      }
    }
    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "图像生成失败" },
      { status: 500 }
    );
  }
}
