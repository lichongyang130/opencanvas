export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 背景移除。
 * POST { url } -> { url }（remove.bg 返回 PNG，服务端转 data URI）
 * 依赖 REMOVE_BG_API_KEY；未配置时返回 501，前端降级为本地 AI（@imgly/background-removal）。
 */
export async function POST(req: Request) {
  const body = (await req.json()) as { url?: string };
  const url = (body.url ?? "").trim();
  if (!url || !/^(data:|https?:\/\/)/.test(url)) {
    return Response.json({ error: "url 不能为空或格式不正确" }, { status: 400 });
  }
  const key = process.env.REMOVE_BG_API_KEY;
  if (!key) {
    return Response.json(
      { error: "未配置 REMOVE_BG_API_KEY，已使用本地 AI 去除背景" },
      { status: 501 }
    );
  }

  try {
    const form = new FormData();
    if (url.startsWith("data:")) {
      const m = url.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!m) throw new Error("不支持的 data URI");
      const ext = m[1] === "jpeg" ? "jpg" : m[1] || "png";
      form.append("image_file", new Blob([Buffer.from(m[2], "base64")], { type: `image/${m[1]}` }), `image.${ext}`);
    } else {
      form.append("image_url", url);
    }
    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": key },
      body: form,
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`remove.bg 失败 ${res.status}: ${t.slice(0, 200)}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return Response.json({
      url: `data:image/png;base64,${buf.toString("base64")}`,
      model: "remove.bg",
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "背景移除失败" },
      { status: 500 }
    );
  }
}

/** 模型列表（含是否配置/是否支持图生图），供前端自动选择 */
export async function GET() {
  const { IMAGE_MODELS } = await import("@/lib/gateway/image");
  const status = (await import("@/lib/gateway/image")).getImageProviderStatus();
  return Response.json({
    models: IMAGE_MODELS.map((m) => ({
      id: m.id,
      label: m.label,
      provider: m.provider,
      configured: status[m.provider] ?? m.provider === "demo",
      imageToImage: Boolean(m.imageToImage),
      creditsPerImage: m.creditsPerImage,
    })),
    removeBgConfigured: Boolean(process.env.REMOVE_BG_API_KEY),
  });
}
