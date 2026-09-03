import type { VideoAdapter, VideoResult } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * fal.ai 视频（Kling / 可灵，海外）。
 * 模型：fal-ai/kling-video/v1.6/pro/text-to-video（Kling 1.6 Pro 文生视频）
 * 流程（与 FLUX 图片一致）：POST queue.fal.run/{model} → status_url 轮询 → response_url 取结果。
 * 输出：{ video: { url } }（fal 媒体直链，MP4，前端 <video> 直接播放）。
 */

const FAL_ASPECT: Record<string, string> = {
  "16:9": "16:9",
  "9:16": "9:16",
  "1:1": "1:1",
};

const SIZE_WH: Record<string, [number, number]> = {
  "16:9": [1280, 720],
  "9:16": [720, 1280],
  "1:1": [1024, 1024],
};

export function createFalVideoAdapter(apiKey?: string): VideoAdapter {
  return {
    id: "fal",
    isConfigured() {
      return Boolean(apiKey);
    },
    async generate(prompt, opts): Promise<VideoResult> {
      if (!apiKey) throw new Error("fal video: 未配置 FAL_KEY");
      const modelId = opts.model ?? "fal-ai/kling-video/v1.6/pro/text-to-video";
      const aspect = FAL_ASPECT[opts.size ?? "16:9"] ?? "16:9";
      const [width, height] = SIZE_WH[aspect] ?? [1280, 720];
      // Kling 时长仅支持 5 / 10 秒
      const duration = (opts.durationSec ?? 5) <= 5 ? "5" : "10";

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Key ${apiKey}`,
      };
      const body = {
        prompt,
        duration,
        aspect_ratio: aspect,
        negative_prompt: "模糊、变形、低质量、水印",
      };

      const submit = await fetch(`https://queue.fal.run/${modelId}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: opts.signal,
      });
      if (!submit.ok) {
        const t = await submit.text().catch(() => "");
        throw new Error(`Kling 提交失败 ${submit.status}: ${t.slice(0, 200)}`);
      }
      const queued = (await submit.json()) as {
        request_id?: string;
        status_url?: string;
        response_url?: string;
        detail?: string;
      };
      if (!queued.request_id && !queued.response_url) {
        throw new Error(`Kling 未返回任务: ${queued.detail ?? "未知错误"}`);
      }
      const statusUrl = queued.status_url ?? `https://queue.fal.run/${modelId}/requests/${queued.request_id}/status`;
      const respUrl = queued.response_url ?? `https://queue.fal.run/${modelId}/requests/${queued.request_id}`;

      // 视频生成较慢，最多轮询约 5 分钟
      for (let i = 0; i < 100; i++) {
        await sleep(3000);
        const st = await fetch(statusUrl, { headers: { Authorization: `Key ${apiKey}` } });
        if (st.ok) {
          const sj = (await st.json()) as { status?: string };
          if (sj.status === "COMPLETED") {
            const rr = await fetch(respUrl, { headers: { Authorization: `Key ${apiKey}` } });
            if (!rr.ok) throw new Error(`Kling 取结果失败 ${rr.status}`);
            const rj = (await rr.json()) as {
              video?: { url?: string; width?: number; height?: number; duration?: number };
              url?: string;
            };
            const url = rj.video?.url ?? rj.url;
            if (!url) throw new Error("Kling 完成但无视频 URL");
            return {
              url,
              mock: false,
              model: modelId,
              provider: "fal",
              durationSec: rj.video?.duration ?? Number(duration),
              width: rj.video?.width ?? width,
              height: rj.video?.height ?? height,
            };
          }
          if (sj.status === "FAILED" || sj.status === "CANCELLED") {
            throw new Error(`Kling 任务 ${sj.status}`);
          }
        }
      }
      throw new Error("Kling 生成超时（约 5 分钟）");
    },
  };
}
