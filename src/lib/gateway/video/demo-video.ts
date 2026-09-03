import { encodeIndexedGif } from "./gif";
import type { VideoAdapter, VideoResult } from "./types";

/**
 * 演示视频：零密钥可完整体验。
 * 按提示词散列生成配色，程序化合成 16 帧动画（渐变背景 + 流动光斑 + 扫描线），
 * 以「256 色调色板 + 索引帧」直接编码 GIF（data URI），前端自动循环播放且可下载。
 * 真实供应商（FAL / 万相视频）接入点见 src/lib/gateway/video/index.ts。
 */

const W = 480;
const H = 270;
const FRAMES = 16;
/** 调色板网格：16 级色相混合 × 16 级亮度 = 256 色 */
const PAL_STEPS = 16;

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sat = s;
  const lig = l;
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = lig - c / 2;
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function hashOf(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

/** 由提示词种子生成 256 色调色板（色相混合 × 亮度） */
function buildPalette(hueBase: number, hue2: number): Uint8Array {
  const palette = new Uint8Array(256 * 3);
  for (let t = 0; t < PAL_STEPS; t++) {
    const hue = hueBase + (hue2 - hueBase) * (t / (PAL_STEPS - 1));
    for (let b = 0; b < PAL_STEPS; b++) {
      const light = 0.16 + 0.62 * (b / (PAL_STEPS - 1)); // 0.16 ~ 0.78
      const [r, g, bl] = hslToRgb(hue, 0.72, light);
      const i = (t * PAL_STEPS + b) * 3;
      palette[i] = r;
      palette[i + 1] = g;
      palette[i + 2] = bl;
    }
  }
  return palette;
}

/** 渲染单帧调色板索引（渐变 + 三光斑 + 扫描线，全部量化进 256 色） */
function renderIndexFrame(t: number): Uint8Array {
  const idx = new Uint8Array(W * H);
  const cx = W / 2, cy = H / 2;
  const spots: [number, number, number][] = [
    [cx + Math.cos(t * 2) * W * 0.32, cy + Math.sin(t * 3 + 1) * H * 0.3, 0.55],
    [cx + Math.cos(t * 2.6 + 2.1) * W * 0.36, cy + Math.sin(t * 2.2 + 4) * H * 0.34, 0.4],
    [cx + Math.cos(t * 1.8 + 4.5) * W * 0.28, cy + Math.sin(t * 3.4 + 2.4) * H * 0.26, 0.3],
  ];

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // 对角渐变（时间微移）
      let g = (x / W + y / H) / 2 + 0.08 * Math.sin(t * 2);
      let glow = 0;
      for (const [sx, sy, amp] of spots) {
        const dx = x - sx;
        const dy = y - sy;
        const d = Math.sqrt(dx * dx + dy * dy) / (W * 0.3);
        glow += Math.max(0, 1 - d) * amp;
      }
      const scan = Math.max(0, Math.sin((y + t * 60) * 0.35)) * 0.14;

      // 色相混合度：曝光/光斑把颜色推向 hue2 方向
      const tF = Math.min(0.999, Math.max(0, g * 0.82 + glow * 0.18));
      // 亮度：基调 + 光斑 + 扫描线
      const bF = Math.min(0.999, Math.max(0, 0.4 + glow * 0.42 + scan));
      const tIdx = (tF * PAL_STEPS) | 0;
      const bIdx = (bF * PAL_STEPS) | 0;
      idx[y * W + x] = tIdx * PAL_STEPS + bIdx;
    }
  }
  return idx;
}

export const demoVideoAdapter: VideoAdapter = {
  id: "demo",
  isConfigured() {
    return true;
  },
  async generate(prompt: string): Promise<VideoResult> {
    const seed = hashOf(prompt || "opencanvas demo");
    const hueBase = seed % 360;
    const hue2 = (hueBase + 70 + ((seed >> 3) % 80) + 360) % 360;
    const palette = buildPalette(hueBase, hue2);

    const frames: Uint8Array[] = [];
    for (let f = 0; f < FRAMES; f++) {
      const t = (f / FRAMES) * Math.PI * 2;
      frames.push(renderIndexFrame(t));
    }
    // 80ms/帧 ≈ 1.3s 循环
    const gif = encodeIndexedGif({ w: W, h: H }, palette, frames, 8);

    return {
      url: `data:image/gif;base64,${Buffer.from(gif).toString("base64")}`,
      mock: true,
      model: "demo-video",
      provider: "demo",
      durationSec: Math.round((FRAMES * 8) / 100),
      width: W,
      height: H,
    };
  },
};
