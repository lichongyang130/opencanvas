# AI 视频生成（演示引擎）端到端验证

> 批次：第二十二轮（B 类功能 mock 交付）
> 状态：**7/7 PASS · 零外部凭据**（内置 demo 引擎本机合成 GIF 动画）

## 交付内容

| 层 | 文件 | 说明 |
| --- | --- | --- |
| 网关 | `src/lib/gateway/video/types.ts` | VideoProviderId / VideoAdapter / VideoResult / 模型元数据 |
| 网关 | `src/lib/gateway/video/gif.ts` | 纯 Node 零依赖 GIF89a 编码器（LZW 变长码 + 256 色表） |
| 网关 | `src/lib/gateway/video/demo-video.ts` | 提示词散列配色 → 16 帧程序化动画（渐变/光斑/扫描线），256 色索引帧 |
| 网关 | `src/lib/gateway/video/index.ts` | 模型清单（demo / FAL Kling / 万相）与适配器注册点 |
| API | `POST /api/video` | 审核 → 生成 → `gateway_usage` 归属记账 |
| API | `GET /api/video/status` | 供应商配置状态 + 模型清单 |
| 页面 | `/tools/video` | 描述/预设/进度/预览/下载 GIF/引擎状态 |
| 入口 | `/tools` | 内容创作栏「AI 视频生成」卡片 |

## 复验方法

```bash
npm run dev -- -p 3007
BASE=http://localhost:3007 node scripts/e2e-video.mjs
```

## 断言（7 项）

1. 应用健康（`/api/health`）
2. 引擎状态：`demo` 可用，3 个模型，含 `demo-video`
3. 匿名生成：`mock=true`，data URI 解码后为 GIF89a、480×270、`0x3B` trailer
4. 注册账号
5. 登录态生成：`model=demo-video`、`provider=demo`、免费
6. 用量归属：`/api/gateway/stats?scope=me` 中 `byModel` 含 `demo-video`（calls≥1，costUsd=0）
7. 违规描述（如「出售枪支」）→ 400 拦截；测试账号删除清理

## GIF 正确性（超出字节头检查的深层验证）

- **独立 LZW 解码器**（第三方实现口径）逐帧解码：16 帧 × 129,600 索引全部还原，码流与帧长精确对齐
- **ImageMagick**：`identify -verbose` 16 帧全部可解，无 corrupt / invalid colormap index

### 编码器关键点（勿回退）

- LZW 码宽升位时机必须为 `next === (1 << codeSize) + 1`（解码器表滞后编码器一条目，
  `2^codeSize` 直接升位会在第二个字典边界后错位 → 大图尾帧裁断/色表越界）
- 字典满（`next >= 4096`）：以当前 12 位输出 CLEAR 后重置为 9 位
- 调色板统计按 `i += 3` 步进，禁止越界读 `f[i+1]/f[i+2]`（否则生成寄生色导致末像素错色）

## 真实供应商接入点

- FAL（Kling，全球）：`fal.run` 异步任务 + queue 轮询 → `VIDEO_MODELS` 现有条目 `fal-ai/kling-video/v1.6/pro/text-to-video`
- 阿里云百炼万相（国内）：`wanx2.1-t2v-turbo` 异步任务
- 在 `src/lib/gateway/video/index.ts` 的 `ADAPTERS` 注册实现后，前端 `/tools/video` 与计费通道自动生效（`creditsPerVideo` 已按模型标注）
