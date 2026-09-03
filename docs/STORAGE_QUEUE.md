# 生产化存储与队列（R2/S3 + Redis）

OpenCanvas 默认零外部服务：文件存本地 `data/`，任务在进程内内存队列消费。
配置环境变量即可平滑切换到 **S3 兼容对象存储（Cloudflare R2 / AWS S3 / MinIO）** 与 **Redis + BullMQ**，业务代码不变（走 `src/lib/storage` 与 `src/lib/queue` 抽象）。

---

## 1. 文件存储

### 默认：本地磁盘
- 所有上传文件（文档原文件、后续图片/视频/PPTX 导出）写入 `data/uploads/`。
- 零依赖、零配置，`GET /api/health` 返回 `storage: { kind: "local" }`。

### 切换 Cloudflare R2（生产推荐）
```bash
# .env（或环境变量）
S3_BUCKET=opencanvas-files
S3_ACCESS_KEY_ID=<R2 Access Key>
S3_SECRET_ACCESS_KEY=<R2 Secret Key>
S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
S3_REGION=auto
S3_FORCE_PATH_STYLE=0
# 可选：公开读时作为下载 URL 前缀
S3_PUBLIC_BASE_URL=https://files.example.com
```
配置后 `GET /api/health` 返回 `storage: { kind: "s3", bucket: "opencanvas-files" }`，
上传/下载/删除文档全走 R2（S3 兼容协议、AWS SDK 签名 v4）。

### AWS S3 / MinIO
- AWS S3：不设置 `S3_ENDPOINT`（默认 AWS 域），`S3_REGION=ap-northeast-1` 等。
- MinIO/自建：`S3_ENDPOINT=http://minio:9000` + `S3_FORCE_PATH_STYLE=1`。

### 接口
```ts
import { getStorage } from "@/lib/storage";
await getStorage().put(key, buf, mime);
await getStorage().get(key);        // Buffer | null
await getStorage().exists(key);
await getStorage().delete(key);
```
`src/lib/docs/files.ts` 的 `saveUploadFile / readUploadFile / deleteUploadFile / uploadExists`
已统一走该层；删号清理（`repo.deleteUserAccount`）同样删除对象文件。

> 提示：从 SQLite 切 PG（`docs/POSTGRES.md`）后，老文件在 `data/uploads/`，
> 需一次性上传到 R2（可用 `S3_FORCE_PATH_STYLE=1` + 本地 MinIO 演练）。

---

## 2. 后台任务队列

### 默认：进程内内存队列
- `getQueue()` 返回 `MemoryQueue`：`enqueue` 后同进程异步串行消费，零依赖。
- 适合开发/沙箱；进程重启任务丢失。

### 配置 Redis → BullMQ
```bash
REDIS_URL=redis://user:password@host:6379
```
- `getQueue()` 返回 BullMQ `Queue`（队列名 `opencanvas-jobs`，任务完成/失败各保留 200/500 条），
  可独立部署 Worker 进程消费，任务持久、可重试。

### 接口
```ts
import { getQueue } from "@/lib/queue";
const q = getQueue();
q.register("doc:index", async ({ docId }) => { ... });   // 应用启动时注册
await q.enqueue("doc:index", { docId });                  // 任意位置入队
```
`GET /api/health` 返回 `queue: { kind: "memory"|"bullmq", pending, redis }`。

### 适合接入的任务
- 视频生成、研究深度任务（B 类，接真实供应商后建议异步化）
- 文档批量解析/向量化预热
- 导出任务、邮件/通知推送

---

## 3. 实测记录（沙箱）

- ✅ 默认本地模式：上传 → 下载 → 删除 文档全链路正常；`/api/health` 显示 `storage.local` / `queue.memory`
- ✅ 删号清理：本地对象文件同步删除（走 `repo.deleteUserAccount` → `deleteUploadFile`）
- ⚠️ S3/R2 与 Redis 真实端点需要外部凭据，沙箱无法端到端；代码路径均已就绪（S3 用 AWS SDK、
  BullMQ 用 `Queue.add/process`），配置后可在生产验证
