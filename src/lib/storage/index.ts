import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

/**
 * 文件存储抽象：本地磁盘（默认）或 S3 兼容对象存储（Cloudflare R2 / AWS S3 / MinIO）。
 * 选择规则：
 *   - 配置了 S3_BUCKET + S3_ACCESS_KEY_ID + S3_SECRET_ACCESS_KEY → S3Driver（R2 配置 S3_ENDPOINT）
 *   - 否则 → LocalDriver（data/ 下，默认零外部服务）
 *
 * 注意：本模块仅供服务端使用（API 路由 / repo），禁止客户端组件引用。
 */

export interface StorageDriver {
  readonly kind: "local" | "s3";
  /** 写入对象（key 相对存储根，如 uploads/2029-...-a.txt） */
  put(key: string, data: Buffer, mime?: string): Promise<string>;
  get(key: string): Promise<Buffer | null>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
}

/* ───────────────────────── 本地磁盘驱动 ───────────────────────── */

class LocalDriver implements StorageDriver {
  readonly kind = "local" as const;
  private root: string;

  constructor(root?: string) {
    this.root = root ?? path.join(process.cwd(), "data");
  }

  private full(key: string): string {
    // 防目录穿越
    const clean = key.replace(/^\/+/, "");
    const p = path.join(this.root, clean);
    if (!p.startsWith(path.join(this.root, ""))) throw new Error("非法存储路径");
    return p;
  }

  async put(key: string, data: Buffer): Promise<string> {
    const full = this.full(key);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, data);
    return key;
  }

  async get(key: string): Promise<Buffer | null> {
    const full = this.full(key);
    if (!existsSync(full)) return null;
    return readFileSync(full);
  }

  async exists(key: string): Promise<boolean> {
    return existsSync(this.full(key));
  }

  async delete(key: string): Promise<void> {
    const full = this.full(key);
    try {
      unlinkSync(full);
    } catch {
      /* 不存在忽略 */
    }
  }
}

/* ───────────────────────── S3 / R2 驱动 ───────────────────────── */

class S3Driver implements StorageDriver {
  readonly kind = "s3" as const;
  private s3: S3Client;
  private bucket: string;
  private publicBase?: string;

  constructor() {
    // R2 用 S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com + S3_REGION=auto
    this.s3 = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "1",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    });
    this.bucket = process.env.S3_BUCKET!;
    this.publicBase = process.env.S3_PUBLIC_BASE_URL || undefined;
  }

  async put(key: string, data: Buffer, mime = "application/octet-stream"): Promise<string> {
    await this.s3.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: data, ContentType: mime })
    );
    return this.publicBase ? `${this.publicBase.replace(/\/$/, "")}/${key}` : key;
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const res = await this.s3.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key })
      );
      const bytes = await res.Body?.transformToByteArray();
      return bytes ? Buffer.from(bytes) : null;
    } catch {
      return null;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch {
      /* 不存在忽略 */
    }
  }
}

export function s3Configured(): boolean {
  return Boolean(
    process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY
  );
}

let s3Driver: S3Driver | null = null;

/** 全局存储驱动单例（S3 配置动态读取，首次调用时决定；同步返回 driver） */
export function getStorage(): StorageDriver {
  if (s3Configured()) {
    if (!s3Driver) s3Driver = new S3Driver();
    return s3Driver;
  }
  return new LocalDriver();
}

/** 存储状态（/api/health 展示） */
export function storageStatus(): { kind: "local" | "s3"; bucket?: string } {
  return s3Configured()
    ? { kind: "s3", bucket: process.env.S3_BUCKET }
    : { kind: "local" };
}

/** 生成安全的存储 key：uploads/<ts>-<rand>-<safeName> */
export function uploadKey(name: string): string {
  const safe = name.replace(/[^\w.\-\u4e00-\u9fa5]/g, "_").slice(0, 80) || "file";
  return `uploads/${Date.now()}-${randomUUID().slice(0, 8)}-${safe}`;
}
