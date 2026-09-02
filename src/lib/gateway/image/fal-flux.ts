import type { ImageAdapter, ImageResult } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * fal.ai FLUX 文生图 / 图生图（海外）。
 * 模型：fal-ai/flux/schnell（快，仅文生图）/ fal-ai/flux/dev（支持 image_url 图生图）
 * 流程：POST queue.fal.run/{model} → status_url 轮询 → response_url 取图。
 * 兼容旧别名 fal-ai/flux-schnell、fal-ai/flux-dev。
 */
const MODELS: Record<string, { path: string; i2iPath?: string; supportsImg: boolean }> = {
  "fal-ai/flux/schnell": { path: "fal-ai/flux/schnell", supportsImg: false },
  "fal-ai/flux/dev": { path: "fal-ai/flux/dev", i2iPath: "fal-ai/flux/dev/image-to-image", supportsImg: true },
  "fal-ai/flux-schnell": { path: "fal-ai/flux/schnell", supportsImg: false },
  "fal-ai/flux-dev": { path: "fal-ai/flux/dev", i2iPath: "fal-ai/flux/dev/image-to-image", supportsImg: true },
};

export function createFalFluxAdapter(apiKey?: string): ImageAdapter {
  return {
    id: "fal",
    isConfigured() {
      return Boolean(apiKey);
    },
    async generate(prompt, opts): Promise<ImageResult> {
      if (!apiKey) throw new Error("fal flux: 未配置 FAL_KEY");
      const modelId = opts.model ?? "fal-ai/flux/schnell";
      const m = MODELS[modelId] ?? MODELS["fal-ai/flux/schnell"];
      if (opts.imageUrl && !m.supportsImg) {
        throw new Error(`模型「${modelId}」不支持图生图，请改用 fal-ai/flux-dev`);
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Key ${apiKey}`,
      };
      const body: Record<string, unknown> = {
        prompt,
        image_size: opts.size === "1792x1024" ? "landscape_16_9" : opts.size === "1024x1792" ? "portrait_9_16" : "square_hd",
        num_images: 1,
      };
      if (opts.imageUrl) body.image_url = opts.imageUrl;

      const submit = await fetch(`https://queue.fal.run/${opts.imageUrl && m.i2iPath ? m.i2iPath : m.path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: opts.signal,
      });
      if (!submit.ok) {
        const t = await submit.text().catch(() => "");
        throw new Error(`FLUX 提交失败 ${submit.status}: ${t.slice(0, 200)}`);
      }
      const queued = (await submit.json()) as {
        request_id?: string;
        status_url?: string;
        response_url?: string;
        detail?: string;
      };
      if (!queued.request_id && !queued.response_url) {
        throw new Error(`FLUX 未返回任务: ${queued.detail ?? "未知错误"}`);
      }
      const statusUrl = queued.status_url ?? `https://queue.fal.run/${m.path}/requests/${queued.request_id}/status`;
      const respUrl = queued.response_url ?? `https://queue.fal.run/${m.path}/requests/${queued.request_id}`;

      // 轮询（最多约 60 秒）
      for (let i = 0; i < 30; i++) {
        await sleep(2000);
        const st = await fetch(statusUrl, { headers: { Authorization: `Key ${apiKey}` } });
        if (st.ok) {
          const sj = (await st.json()) as { status?: string };
          if (sj.status === "COMPLETED") {
            const rr = await fetch(respUrl, { headers: { Authorization: `Key ${apiKey}` } });
            if (!rr.ok) throw new Error(`FLUX 取结果失败 ${rr.status}`);
            const rj = (await rr.json()) as {
              images?: { url?: string }[];
              image?: { url?: string };
            };
            const url = rj.images?.[0]?.url ?? rj.image?.url;
            if (!url) throw new Error("FLUX 完成但无图片 URL");
            return { url, model: modelId };
          }
          if (sj.status === "FAILED" || sj.status === "CANCELLED") {
            throw new Error(`FLUX 任务 ${sj.status}`);
          }
        }
      }
      throw new Error("FLUX 生成超时");
    },
  };
}
