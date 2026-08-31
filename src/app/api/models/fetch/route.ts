import { buildProviders, type ProviderId, type ProviderOverrides } from "@/lib/gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_BASE: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  deepseek: "https://api.deepseek.com/v1",
  dashscope: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  anthropic: "https://api.anthropic.com",
};

interface FetchedModel {
  id: string;
}

/**
 * 动态获取某供应商账号/中转实际可用的模型列表。
 * POST { provider, overrides? } -> { models: string[] }
 */
export async function POST(req: Request) {
  const body = (await req.json()) as { provider?: ProviderId; overrides?: ProviderOverrides };
  const provider = body.provider;
  if (!provider || provider === "demo") {
    return Response.json({ error: "不支持的供应商" }, { status: 400 });
  }

  const providers = body.overrides ? buildProviders(body.overrides) : buildProviders();
  const adapter = providers[provider];
  if (!adapter.isConfigured()) {
    return Response.json({ error: "该供应商未配置密钥，请先在模型设置中填写 API Key" }, { status: 400 });
  }

  const ov = body.overrides?.[provider];
  const baseUrl = (ov?.baseUrl || DEFAULT_BASE[provider]).replace(/\/+$/, "");
  const apiKey = ov?.apiKey || "";

  try {
    let ids: string[] = [];

    if (provider === "anthropic") {
      const res = await fetch(`${baseUrl}/v1/models`, {
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      });
      if (!res.ok) throw new Error(`列表接口返回 ${res.status}`);
      const data = (await res.json()) as { data?: FetchedModel[] };
      ids = (data.data ?? []).map((m) => m.id);
    } else {
      // OpenAI 兼容：GET /models
      const res = await fetch(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) throw new Error(`列表接口返回 ${res.status}`);
      const data = (await res.json()) as { data?: FetchedModel[] };
      ids = (data.data ?? []).map((m) => m.id);
    }

    // 去重 + 过滤明显的非对话模型（embedding/audio/tts/whisper/image 等）
    const blocked = /(embed|tts|whisper|audio|speech|image|moderation|rerank|vision-ocr)/i;
    const models = [...new Set(ids)]
      .filter((id) => !blocked.test(id))
      .sort((a, b) => a.localeCompare(b));

    if (models.length === 0) return Response.json({ error: "未获取到可用模型" }, { status: 502 });
    return Response.json({ models });
  } catch (err) {
    return Response.json(
      { error: `获取失败：${err instanceof Error ? err.message : "网络错误"}（请检查 API Key 与 Base URL/中转地址）` },
      { status: 502 }
    );
  }
}
