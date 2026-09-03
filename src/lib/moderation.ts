/**
 * 轻量内容审核（零外部依赖，可扩展为云端审核 API）。
 * - 输入：拦截明显违规文案（广告/博彩/违法违规占位词），返回 400 由前端提示
 * - 输出：流式累计检测，命中即终止生成并返回审核错误事件
 * 词表为最小示例，可按合规要求扩充。
 */

const BLOCK_WORDS = [
  "代开发票",
  "刷单兼职",
  "赌博网站",
  "博彩平台",
  "出售枪支",
  "毒品交易",
  "制作假证",
  "电信诈骗",
];

const BLOCK_PATTERNS: RegExp[] = [
  /(加|联系|搜索)\s*(微信|qq|vx|wx)\s*[:：]?\s*[a-z0-9]{5,}/i,
  /https?:\/\/\S*(?:bet|casino|porn|赌博|彩票)\S*/i,
];

export interface ModerationResult {
  ok: boolean;
  reason?: string;
}

export function checkText(text: string): ModerationResult {
  if (!text) return { ok: true };
  for (const w of BLOCK_WORDS) {
    if (text.includes(w)) return { ok: false, reason: `包含违规内容「${w}」` };
  }
  for (const re of BLOCK_PATTERNS) {
    if (re.test(text)) return { ok: false, reason: "包含疑似违规推广信息" };
  }
  return { ok: true };
}

/** 输出流式审核：累计 buffer，命中即中止并提示 */
export function createOutputGuard() {
  let buf = "";
  return {
    feed(delta: string): string | null {
      buf = (buf + delta).slice(-200);
      const hit = BLOCK_WORDS.find((w) => buf.includes(w));
      if (hit) return `输出包含违规内容「${hit}」，已中止生成`;
      return null;
    },
    reset() {
      buf = "";
    },
  };
}
