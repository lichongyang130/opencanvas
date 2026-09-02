import type { ImageAdapter, ImageResult } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * 阿里云百炼 图像（国内）。
 * - 文生图：wan2.7-t2i-flash / wanx2.5-t2i（Seedream 同源）/ wanx2.1-t2i-turbo
 * - 图生图：wanx2.1-i2i-turbo（传 imageUrl 时自动走图生图接口）
 * 流程：创建异步任务 → 轮询状态 → 返回结果图 URL。
 */
const T2I: Record<string, string> = {
  "wan2.7-t2i-flash": "wan2.7-t2i-flash",
  "wanx2.5-t2i": "wanx2.5-t2i",
};
const I2I = "wanx2.1-i2i-turbo";

export function createDashScopeImageAdapter(apiKey?: string, baseUrl?: string): ImageAdapter {
  const root = (baseUrl || "https://dashscope.aliyuncs.com").replace(/\/+$/, "");
  return {
    id: "dashscope",
    isConfigured() {
      return Boolean(apiKey);
    },
    async generate(prompt, opts): Promise<ImageResult> {
      if (!apiKey) throw new Error("dashscope image: 未配置 DASHSCOPE_API_KEY");

      const modelId = opts.model ?? "wan2.7-t2i-flash";
      const isI2I = Boolean(opts.imageUrl);
      const model = isI2I ? I2I : (T2I[modelId] ?? "wan2.7-t2i-flash");
      const size =
        opts.size === "1024x1792"
          ? isI2I ? "720*1280" : "720*1280"
          : opts.size === "1792x1024"
            ? "1280*720"
            : "1024*1024";

      const content: Record<string, unknown>[] = [{ text: prompt }];
      if (opts.imageUrl) content.push({ image: opts.imageUrl });

      const create = await fetch(
        `${root}/api/v1/services/aigc/multimodal-generation/generation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "X-DashScope-Async": "enable",
          },
          body: JSON.stringify({
            model,
            input: { messages: [{ role: "user", content }] },
            parameters: { size, n: 1 },
          }),
          signal: opts.signal,
        }
      );
      if (!create.ok) {
        const t = await create.text().catch(() => "");
        throw new Error(`万相创建任务失败 ${create.status}: ${t.slice(0, 200)}`);
      }
      const created = (await create.json()) as { output?: { task_id?: string }; code?: string; message?: string };
      const taskId = created.output?.task_id;
      if (!taskId) throw new Error(`万相未返回任务ID: ${created.message ?? ""}`);

      // 轮询（最多约 90 秒）
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
            message?: string;
          };
        };
        const status = data.output?.task_status;
        if (status === "SUCCEEDED") {
          const url = data.output?.results?.[0]?.url;
          if (!url) throw new Error("万相任务完成但无图片 URL");
          return { url, model: isI2I ? I2I : model };
        }
        if (status === "FAILED") {
          throw new Error(`万相生成失败: ${data.output?.message ?? ""}`);
        }
      }
      throw new Error("万相生成超时");
    },
  };
}
