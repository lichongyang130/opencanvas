import type { ImageAdapter, ImageResult } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * 阿里云百炼 图像（国内）。
 * 按模型版本路由到正确接口（各代官方接口结构不同）：
 * - wan2.7-t2i-flash / wan2.5-i2i-preview（新）：multimodal-generation/generation，input.messages
 * - wanx2.5-t2i（旧文生图 V2）：text2image/image-synthesis，input.prompt
 * - wanx2.1-i2i-turbo（旧图生图）：image2image/image-synthesis，input.prompt + image_url
 * 统一：创建异步任务 → 轮询 /tasks/{id} → 兼容解析 results / choices 两种输出。
 */
type DashModel = "wan2.7-t2i-flash" | "wan2.5-i2i-preview" | "wanx2.5-t2i" | "wanx2.1-i2i-turbo";

const NEW_MODELS = new Set(["wan2.7-t2i-flash", "wan2.5-i2i-preview"]);

function sizeOf(size: string, isNew: boolean): string {
  const s =
    size === "1792x1024" ? "1280*720" : size === "1024x1792" ? "720*1280" : isNew ? "1280*1280" : "1024*1024";
  return s;
}

export function createDashScopeImageAdapter(apiKey?: string, baseUrl?: string): ImageAdapter {
  const root = (baseUrl || "https://dashscope.aliyuncs.com").replace(/\/+$/, "");
  return {
    id: "dashscope",
    isConfigured() {
      return Boolean(apiKey);
    },
    async generate(prompt, opts): Promise<ImageResult> {
      if (!apiKey) throw new Error("dashscope image: 未配置 DASHSCOPE_API_KEY");

      const modelId = (opts.model ?? "wan2.7-t2i-flash") as DashModel;
      const isNew = NEW_MODELS.has(modelId);
      const isI2I = Boolean(opts.imageUrl);
      if (isI2I && modelId === "wanx2.5-t2i") {
        throw new Error(`模型「${modelId}」不支持图生图，请用 wanx2.1-i2i-turbo / wan2.5-i2i-preview`);
      }
      if (isI2I && modelId === "wan2.7-t2i-flash") {
        throw new Error(`模型「${modelId}」不支持图生图，请用 wan2.5-i2i-preview`);
      }
      const size = sizeOf(opts.size ?? "1024x1024", isNew);

      // ── 1. 创建异步任务 ──
      let endpoint: string;
      let body: Record<string, unknown>;
      if (isI2I && modelId === "wanx2.1-i2i-turbo") {
        endpoint = `${root}/api/v1/services/aigc/image2image/image-synthesis`;
        body = {
          model: modelId,
          input: { prompt, image_url: opts.imageUrl },
          parameters: { size, n: 1 },
        };
      } else if (!isNew) {
        // wanx2.5-t2i：旧文生图
        endpoint = `${root}/api/v1/services/aigc/text2image/image-synthesis`;
        body = { model: modelId, input: { prompt }, parameters: { size, n: 1 } };
      } else {
        // wan2.7-t2i-flash / wan2.5-i2i-preview：新版 multimodal（messages）
        endpoint = `${root}/api/v1/services/aigc/multimodal-generation/generation`;
        const content: Record<string, unknown>[] = [];
        if (opts.imageUrl) content.push({ image: opts.imageUrl });
        content.push({ text: prompt });
        body = {
          model: modelId,
          input: { messages: [{ role: "user", content }] },
          parameters: { size, n: 1 },
        };
      }

      const create = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-DashScope-Async": "enable",
        },
        body: JSON.stringify(body),
        signal: opts.signal,
      });
      if (!create.ok) {
        const t = await create.text().catch(() => "");
        throw new Error(`万相创建任务失败 ${create.status}: ${t.slice(0, 300)}`);
      }
      const created = (await create.json()) as {
        output?: { task_id?: string };
        task_id?: string;
        code?: string;
        message?: string;
      };
      const taskId = created.output?.task_id ?? created.task_id;
      if (!taskId) throw new Error(`万相未返回任务ID: ${created.message ?? ""}`);

      // ── 2. 轮询（最多约 90 秒）──
      for (let i = 0; i < 30; i++) {
        await sleep(3000);
        const r = await fetch(`${root}/api/v1/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: opts.signal,
        });
        if (!r.ok) {
          const t = await r.text().catch(() => "");
          throw new Error(`万相轮询失败 ${r.status}: ${t.slice(0, 200)}`);
        }
        const data = (await r.json()) as {
          output?: {
            task_status?: string;
            results?: { url?: string }[];
            choices?: { message?: { content?: { image?: string }[] } }[];
            message?: string;
          };
        };
        const status = data.output?.task_status;
        if (status === "SUCCEEDED") {
          // 兼容旧 results + 新 choices 两种输出
          const url =
            data.output?.results?.[0]?.url ??
            data.output?.choices?.[0]?.message?.content?.find((c) => c.image)?.image;
          if (!url) throw new Error("万相任务完成但无图片 URL");
          return { url, model: modelId };
        }
        if (status === "FAILED") {
          throw new Error(`万相生成失败: ${data.output?.message ?? ""}`);
        }
      }
      throw new Error("万相生成超时");
    },
  };
}
