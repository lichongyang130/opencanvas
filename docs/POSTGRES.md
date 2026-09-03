# PostgreSQL 版用户体系与生产切换

OpenCanvas 默认零依赖开发：运行时数据层用 Node 22 内置 `node:sqlite`（`src/lib/db/sqlite.ts`，
数据文件 `data/dev.db`），无需任何外部服务。

生产环境可平滑切换到 **PostgreSQL**。本目录说明权威 schema、迁移与切换步骤。

---

## 1. 权威 Schema

| 文件 | 用途 |
| --- | --- |
| `prisma/schema.postgres.prisma` | PostgreSQL 生产权威模型（17 张表，含 userId 归属维度与索引，与运行时 DDL 对齐） |
| `prisma/schema.prisma` | SQLite 开发模型（与 PG 版模型一致，provider 不同，可用 `prisma studio` 查看 dev.db） |
| `prisma/migrations/postgresql/0001_init/migration.sql` | 初始迁移 DDL（与 `schema.postgres.prisma` 一一对应；沙箱无法访问 binaries.prisma.sh 时的手工等价版，可用 `prisma migrate diff` 重新生成后继续演进） |

个人数据表（`documents` / `knowledge_bases` / `notifications` / `credit_ledger` /
`gateway_usage` / `client_errors` / `conversations`）均带 `userId`：**NULL = 未登录本地数据，
非 NULL = 账号数据**，与 API 层隔离规则一致（登录可见「本人 + 本地」，未登录仅本地）。

## 2. 切换步骤

```bash
# 1) 准备 PostgreSQL（≥14）并创建数据库/账号
createdb opencanvas   # 或 CREATE DATABASE opencanvas;

# 2) 配置连接串（.env / 环境变量；开发环境无需配置）
DATABASE_URL=postgresql://user:password@host:5432/opencanvas

# 3) 应用迁移（幂等：已应用的版本自动跳过）
npm run pg:migrate

# 4) 把现有 SQLite 数据导入 PG（幂等 UPSERT，可重复执行；--clear 先清空 PG 同名表）
npm run pg:import          # 全量导入
npm run pg:import -- --clear   # 清空后导入（首次迁移推荐）

# 5) 上传文件：data/uploads 下的原文件需复制到生产存储目录
#    （filePath 为相对 data/ 路径，后续接入 R2/S3 后由存储层统一管理）

# 6) 生成 PG 专用 Prisma Client（便于后续业务层迁到 Prisma）
npx prisma generate --schema prisma/schema.postgres.prisma

# 7) 可选：验证
npm run pg:smoke            # 表结构 + 用户/会话 + 隔离 + 积分 + 删号清理 冒烟
```

## 3. 脚本说明

- `scripts/pg-migrate.mjs`：无 psql 环境的迁移执行器；以 `_schema_migrations` 表记录已应用版本。
- `scripts/pg-import.mjs`：SQLite → PG 全量导入；布尔列 0/1 → `boolean`，按主键 UPSERT。
- `scripts/pg-smoke.mjs`：真实 PG 冒烟；全程事务回滚，不留测试数据；含跨用户隔离与删号清理顺序。

## 4. 行为一致性说明

- 删除账号：`repo.deleteUserAccount` 显式删除 会话 → 知识库关联 → 知识库 → 文档（含上传文件）→
  通知 → 积分 → 错误日志 → 会话 → 用量 → 用户。SQLite 中部分表靠 FK 级联，PG 无 FK 时显式删除，
  双端语义保持一致（`pg:smoke` 第 5 节按此顺序验证）。
- `membership` / `orders` / 模板市场 / 分享码为全局数据，与账号无关。

## 5. 已实测（沙箱 PostgreSQL 18.4）

- ✅ `pg:migrate`：17 张表 + 索引全部建成，重跑自动跳过
- ✅ `pg:smoke`：表结构 / 用户与会话 / A-B 数据隔离 / 积分隔离 / 删号清理 全 PASS
- ✅ `pg:import`：SQLite 测试数据导入 PG，boolean 转换正确，重跑无重复（UPSERT）
