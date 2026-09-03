/**
 * 最小 GIF89a 编码器（纯 Node，零依赖）：
 * 输入 256 色调色板索引帧矩阵，输出 GIF 二进制。
 * 用于 demo 视频生成器把程序化动画帧合成可下载/可预览的 GIF。
 */

/** 调色板：n 色 RGB */
function writeColorTable(frames: Uint8Array[], w: number, h: number): { table: Uint8Array; lut: Map<number, number> } {
  // 从所有帧统计最多 256 种颜色（去重）
  const counts = new Map<number, number>();
  for (const f of frames) {
    for (let i = 0; i + 2 < f.length; i += 3) {
      const c = (f[i] << 16) | (f[i + 1] << 8) | f[i + 2];
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 256);
  const table = new Uint8Array(256 * 3);
  const lut = new Map<number, number>();
  sorted.forEach(([c], i) => {
    table[i * 3] = (c >> 16) & 0xff;
    table[i * 3 + 1] = (c >> 8) & 0xff;
    table[i * 3 + 2] = c & 0xff;
    lut.set(c, i);
  });
  return { table, lut };
}

/** LZW 编码（GIF 变长码，LSB-first 字节流） */
function lzwEncode(indices: Uint8Array): Uint8Array {
  const CLEAR = 256;
  const EOI = 257;
  const out: number[] = [];
  let bits = 0;
  let bitBuf = 0;
  const pushCode = (code: number, size: number) => {
    bitBuf |= code << bits;
    bits += size;
    while (bits >= 8) {
      out.push(bitBuf & 0xff);
      bitBuf >>= 8;
      bits -= 8;
    }
  };

  const dict = new Map<number, number>();
  let codeSize = 9;
  let next = 258;

  const reset = () => {
    dict.clear();
    codeSize = 9;
    next = 258;
  };

  reset();
  pushCode(CLEAR, codeSize); // 起始 clear
  let prefix = indices[0] ?? 0;
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    const key = (prefix << 8) | k;
    const found = dict.get(key);
    if (found !== undefined) {
      prefix = found;
      continue;
    }
    pushCode(prefix, codeSize);
    dict.set(key, next++);
    if (next === (1 << codeSize) + 1 && codeSize < 12) {
      // GIF 经典 off-by-one：解码器表滞后编码器一条目，
      // 必须等「下一个可分配码」达到 2^codeSize+1 时才升位。
      codeSize += 1;
    } else if (next >= 4096) {
      // 字典满：输出 clear 并重置（之后继续用 9 位）
      pushCode(CLEAR, codeSize);
      reset();
    }
    prefix = k;
  }
  pushCode(prefix, codeSize);
  pushCode(EOI, codeSize);
  if (bits > 0) out.push(bitBuf & 0xff);

  return Uint8Array.from(out);
}

export interface GifFrame {
  /** 调色板索引帧（w*h） */
  indices: Uint8Array;
  /** 帧延迟（1/100 秒） */
  delayCs: number;
}

/** 组装 GIF 二进制（共享：RGB 量化路径 / 索引帧路径） */
function assembleGif(w: number, h: number, table: Uint8Array, frames: GifFrame[]): Uint8Array {
  const parts: Uint8Array[] = [];
  const push = (bytes: Uint8Array | number[]) => parts.push(bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes));

  // Header
  push([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]); // GIF89a
  // Logical Screen Descriptor: 256 色全局表
  push([w & 0xff, (w >> 8) & 0xff, h & 0xff, (h >> 8) & 0xff, 0xf7, 0, 0]);
  // Global Color Table
  push(table);

  for (const f of frames) {
    // Graphics Control Extension（无透明，delay）
    push([
      0x21, 0xf9, 0x04, 0x04,
      f.delayCs & 0xff, (f.delayCs >> 8) & 0xff,
      0x00, 0x00,
    ]);
    // Image Descriptor（全幅）
    push([0x2c, 0, 0, 0, 0, w & 0xff, (w >> 8) & 0xff, h & 0xff, (h >> 8) & 0xff, 0x00]);
    // Image Data：LZW
    const lzw = lzwEncode(f.indices);
    push([8]); // min code size
    for (let i = 0; i < lzw.length; i += 255) {
      const chunk = lzw.subarray(i, i + 255);
      push([chunk.length]);
      push(chunk);
    }
    push([0x00]); // block terminator
  }
  push([0x3b]); // trailer

  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/** 将 RGB 帧合成 GIF（自动统计 256 色全局调色板，超出部分映射到最高频色） */
export function encodeGif(
  size: { w: number; h: number },
  rgbFrames: Uint8Array[],
  delayCs = 8
): Uint8Array {
  const { w, h } = size;
  const { table, lut } = writeColorTable(rgbFrames, w, h);
  const frames: GifFrame[] = rgbFrames.map((rgb) => {
    const idx = new Uint8Array(w * h);
    for (let p = 0; p < idx.length; p++) {
      const i = p * 3;
      const c = (rgb[i] << 16) | (rgb[i + 1] << 8) | rgb[i + 2];
      idx[p] = lut.get(c) ?? 0;
    }
    return { indices: idx, delayCs };
  });
  return assembleGif(w, h, table, frames);
}

/**
 * 直接以「调色板 + 索引帧」编码 GIF（零量化开销、色彩完全保真）：
 * paletteRgb 为 256×3 RGB（调用方负责把动画纳入该调色板）。
 */
export function encodeIndexedGif(
  size: { w: number; h: number },
  paletteRgb: Uint8Array,
  indexFrames: Uint8Array[],
  delayCs = 8
): Uint8Array {
  const { w, h } = size;
  if (paletteRgb.length < 256 * 3) {
    throw new Error("paletteRgb 至少需要 256×3 字节");
  }
  const table = paletteRgb.subarray(0, 256 * 3);
  const frames: GifFrame[] = indexFrames.map((indices) => {
    if (indices.length !== w * h) {
      throw new Error("索引帧尺寸与画布不一致");
    }
    return { indices, delayCs };
  });
  return assembleGif(w, h, table, frames);
}
