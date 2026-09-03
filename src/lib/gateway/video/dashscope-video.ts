import type { VideoAdapter, VideoResult } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * 阿里云百炼 通义万相 文生视频（国内）。
 * 模型：wanx2.1-t2v-turbo（5 秒成片，异步任务）。
 * 流程（与万相图片一致）：POST /api/v1/services/aigc/video-generation/video-synthesis
 *   （X-DashScope-Async: enable）→ 轮询 GET /api/v1/tasks/{task_id} → output.video_url。
 * video_url 为 OSS 签名直链（24 小时有效），前端 <video> 直接播放。
 */

const SIZE_MAP: Record<string, string> = {
  "16:9": "1280*720",
  "9:16": "720*1280",
  "1:1": "960*960",
};

const SIZE_WH: Record<string, [number, number]> = {
  "16:9": [1280, 720],
  "9:16": [720, 1280],
  "1:1": [960, 960],
};

export function createDashScopeVideoAdapter(apiKey?: string, baseUrl?: string): VideoAdapter {
  const root = (baseUrl || "https://dashscope.aliyuncs.com").replace(/\/+$/, "");
  return {
    id: "dashscope",
    isConfigured() {
      return Boolean(apiKey);
    },
    async generate(prompt, opts): Promise<VideoResult> {
      if (!apiKey) throw new Error("dashscope video: 未配置 DASHSCOPE_API_KEY");
      const modelId = opts.model ?? "wanx2.1-t2v-turbo";
      const sizeKey = SIZE_MAP[opts.size ?? "16:9"] ?? "1280*720";
      const [width, height] = SIZE_WH[opts.size ?? "16:9"] ?? [1280, 720];

      // ── 1. 创建异步任务 ──
      const create = await fetch(`${root}/api/v1/services/aigc/video-generation/video-synthesis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-DashScope-Async": "enable",
        },
        body: JSON.stringify({
          model: modelId,
          input: { prompt },
          parameters: { size: sizeKey, prompt_extend: true },
        }),
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

      // ── 2. 轮询（视频任务较慢，最多约 5 分钟）──
      for (let i = 0; i < 100; i++) {
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
            video_url?: string;
            message?: string;
          };
          usage?: { video_duration?: number; video_ratio?: string };
        };
        const status = data.output?.task_status;
        if (status === "SUCCEEDED") {
          const url = data.output?.video_url;
          if (!url) throw new Error("万相任务完成但无视频 URL");
          return {
            url,
            mock: false,
            model: modelId,
            provider: "dashscope",
            durationSec: data.usage?.video_duration ?? 5,
            width,
            height,
          };
        }
        if (status === "FAILED") {
          throw new Error(`万相生成失败: ${data.output?.message ?? ""}`);
        }
      }
      throw new Error("万相生成超时（约 5 分钟）");
    },
  };
}
