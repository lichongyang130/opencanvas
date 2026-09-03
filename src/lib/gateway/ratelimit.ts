/**
 * 网关限流 —— 进程内令牌桶（窗口 = 固定 1 分钟）。
 * 单实例部署够用；多实例/Serverless 需换 Redis 分布式限流（见 docs/roadmap.md C 类）。
 * 阈值：环境变量 GATEWAY_RATE_LIMIT（次/分钟/用户），默认 60；0 = 关闭限流。
 */

const buckets = new Map<string, { windowStart: number; count: number }>();

export function getRateLimitPerMin(): number {
  const raw = Number(process.env.GATEWAY_RATE_LIMIT ?? "60");
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 60;
}

export interface RateLimitResult {
  ok: boolean;
  /** 被限时建议等待毫秒数 */
  retryAfterMs: number;
  /** 剩余额度（该窗口） */
  remaining: number;
}

const WINDOW_MS = 60_000;

export function checkRateLimit(key: string): RateLimitResult {
  const limit = getRateLimitPerMin();
  if (limit === 0) return { ok: true, retryAfterMs: 0, remaining: Number.MAX_SAFE_INTEGER };

  const now = Date.now();
  const cur = buckets.get(key);
  if (!cur || now - cur.windowStart >= WINDOW_MS) {
    buckets.set(key, { windowStart: now, count: 1 });
    return { ok: true, retryAfterMs: 0, remaining: limit - 1 };
  }
  if (cur.count >= limit) {
    return { ok: false, retryAfterMs: WINDOW_MS - (now - cur.windowStart), remaining: 0 };
  }
  cur.count += 1;
  return { ok: true, retryAfterMs: 0, remaining: limit - cur.count };
}

/** 防止内存无限增长：每 5 分钟清理过期桶 */
let cleanupTimer: ReturnType<typeof setInterval> | null = null;
export function startRateLimitCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) {
      if (now - v.windowStart >= WINDOW_MS * 2) buckets.delete(k);
    }
  }, 5 * 60_000);
  cleanupTimer.unref?.();
}
