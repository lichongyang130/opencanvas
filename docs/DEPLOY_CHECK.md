# 生产部署验证清单（next build + next start 回归）

## 构建
- `npm run build`：Next 16（webpack 生产构建）0 error，48 个 API 路由 + 12 个页面全部产物生成。

## 启动
```bash
npm run start -- -p 3008      # 生产模式（0.0.0.0，Arena 域名代理可直连）
```

## 回归矩阵（2019-09-03 全 ✅）
| 项 | 结果 |
| --- | --- |
| `/` `/docs` `/knowledge` `/templates` `/tools` `/agents` `/membership` `/apps` `/privacy` `/terms` | 200 |
| `/robots.txt` `/sitemap.xml` `/manifest.webmanifest` `/icon.svg` | 200 |
| `/api/health`（db/node/uptime/storage/queue/providers，无密钥） | 200 |
| 双语：`oc_lang=en` → html lang/title/metadata、privacy/terms 英文 | ✅ |
| 匿名：`/api/export` 200（local-export-v1）、`/api/logs/client/stats` 401 | ✅ |
| 业务闭环：注册→上传→下载→知识库关联→query（tfidf 降级）→分享页→删号 | 全 200 |
| 向量检索：`overrides.openai.baseUrl` 指向本地 mock → engine=embedding + gateway_usage 记账 | ✅ |

## 本次发现并修复
- `src/lib/gateway/embedding.ts`：`embedTexts` 硬编码 DashScope/OpenAI baseUrl，未尊重 BYOK
  `overrides.{provider}.baseUrl`（中转服务/本地 mock 无法注入）→ 已改为 `overrides.baseUrl || 默认`。
  修复后向量检索与 embedding 记账在生产模式实测通过。
