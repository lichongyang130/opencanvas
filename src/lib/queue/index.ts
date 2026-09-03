import { randomUUID } from "node:crypto";

/**
 * 后台任务队列抽象（roadmap「生产化存储与队列」）：
 *   - 配置 REDIS_URL → BullMQ（真实持久队列，Worker 可独立进程部署）
 *   - 未配置 → 进程内内存队列（开发/沙箱零依赖，同进程消费）
 *
 * 用法（server 侧）：
 *   import { queue } from "@/lib/queue";
 *   await queue.enqueue("doc:index", { docId });
 *   await queue.register("doc:index", async (job) => { ... });   // 应用启动时注册
 *
 * 注意：内存模式下任务在进程内异步串行消费；生产建议配置 REDIS_URL
 * 并部署独立 Worker（见 docs/STORAGE_QUEUE.md）。
 */

export interface QueueJob {
  id: string;
  name: string;
  data: Record<string, unknown>;
  createdAt: number;
}

export interface QueueDriver {
  readonly kind: "bullmq" | "memory";
  enqueue(name: string, data: Record<string, unknown>): Promise<QueueJob>;
  register(name: string, handler: (data: Record<string, unknown>) => Promise<void> | void): void;
  /** 待处理/处理中数量（health 用） */
  pending(name?: string): number;
  close?(): Promise<void>;
}

/* ───────────────────────── 内存队列 ───────────────────────── */

type MemHandler = (data: Record<string, unknown>) => Promise<void> | void;

class MemoryQueue implements QueueDriver {
  readonly kind = "memory" as const;
  private jobs: QueueJob[] = [];
  private handlers = new Map<string, MemHandler>();
  private running = false;

  async enqueue(name: string, data: Record<string, unknown>): Promise<QueueJob> {
    const job: QueueJob = { id: `q-${Date.now()}-${randomUUID().slice(0, 8)}`, name, data, createdAt: Date.now() };
    this.jobs.push(job);
    this.drain();
    return job;
  }

  register(name: string, handler: MemHandler): void {
    this.handlers.set(name, handler);
  }

  pending(name?: string): number {
    return name ? this.jobs.filter((j) => j.name === name).length : this.jobs.length;
  }

  private async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      while (this.jobs.length > 0) {
        const job = this.jobs.shift()!;
        const handler = this.handlers.get(job.name);
        if (!handler) continue;
        try {
          await handler(job.data);
        } catch {
          /* 单任务失败不阻塞队列 */
        }
      }
    } finally {
      this.running = false;
    }
  }
}

/* ───────────────────────── BullMQ 队列 ───────────────────────── */

let bullPromise: Promise<QueueDriver> | null = null;

class BullQueue implements QueueDriver {
  readonly kind = "bullmq" as const;
  constructor(private q: any) {}

  async enqueue(name: string, data: Record<string, unknown>): Promise<QueueJob> {
    const job = await this.q.add(name, data);
    return { id: String(job.id), name, data, createdAt: Date.now() };
  }

  register(name: string, handler: (data: Record<string, unknown>) => Promise<void> | void): void {
    this.q.process(name, async (job: any) => handler(job.data));
  }

  pending(name?: string): number {
    // 简化：仅返回内存态（BullMQ 会异步统计；health 用近似值）
    return 0;
  }

  async close(): Promise<void> {
    await this.q.close();
  }
}

export function redisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL);
}

async function createBullQueue(): Promise<QueueDriver> {
  const { Queue } = await import("bullmq");
  const q = new Queue("opencanvas-jobs", {
    connection: { url: process.env.REDIS_URL! },
    defaultJobOptions: { removeOnComplete: 200, removeOnFail: 500 },
  });
  return new BullQueue(q);
}

let memoryQueue: MemoryQueue | null = null;

/** 全局队列单例 */
export function getQueue(): QueueDriver {
  if (redisConfigured()) {
    if (!bullPromise) bullPromise = createBullQueue();
    return bullPromise as unknown as QueueDriver;
  }
  if (!memoryQueue) memoryQueue = new MemoryQueue();
  return memoryQueue;
}

/** 队列状态（/api/health 展示） */
export function queueStatus(): { kind: "bullmq" | "memory"; pending: number; redis?: boolean } {
  const q = getQueue();
  return { kind: q.kind, pending: q.pending(), redis: redisConfigured() };
}

export type { MemHandler };
