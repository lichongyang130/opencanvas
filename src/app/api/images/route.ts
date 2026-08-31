import { generateImage } from "@/lib/gateway/image";
import type { ProviderOverrides } from "@/lib/gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 文生图。
 * POST { model, prompt, size, overrides? } -> { url, model, credits }
 * 演示模型返回 SVG data URI；真实模型返回图床 URL / base64。
 */
export async function POST(req: Request) {
  const body = (await req.json()) as {
    model?: string;
    prompt?: string;
    size?: string;
    overrides?: ProviderOverrides;
  };
  const prompt = (body.prompt ?? "").trim();
  if (!prompt) return Response.json({ error: "prompt 不能为空" }, { status: 400 });

  try {
    const result = await generateImage(body.model ?? "demo-image", prompt, {
      size: body.size ?? "1024x1024",
      overrides: body.overrides,
    });
    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "图像生成失败" },
      { status: 500 }
    );
  }
}
