# 深度研究 Deep Research 端到端验证

> 批次：第二十三轮（P0 招牌链路收官 · 演示模式零凭据可用）
> 状态：**8/8 PASS · 零外部凭据**（无 Tavily Key / 模型 Key 时走内置演示研究引擎）

## 功能总览（核心链路早前已交付，本轮补齐验收缺口）

| 层 | 位置 | 说明 |
| --- | --- | --- |
| 引擎 | `src/lib/research/engine.ts` | 演示模式（无 Key → 结构化示例报告）+ 真实模式（Tavily 多查询联网 → 去重 → 模型综述 → 带 [n] 引用报告） |
| 数据 | `src/lib/research/{types,sample-report}.ts` | ResearchReport/Source 类型；示例报告（6 小节 + 4 来源 + 4 要点，均带 [n] 角标） |
| API | `POST /api/research` | SSE：`status`（"正在阅读第 N 个来源"）→ `report` / `error`；depth basic/advanced、maxResults 5/6/8 |
| 工作台 | Chat 模式切换「🔬 研究报告」+ ArtifactPanel/ReportView | 进度动效 → 引用角标报告 → 下载 MD / 复制 / **一键转 PPT** / 分享只读页 |
| 配置 | 设置中心「搜索/联网」 | Tavily Key（env `TAVILY_API_KEY`）+ 研究策略（深度/来源数量） |

## 本轮新增（验收补齐）

- 工具中心「**深度研究**」入口卡片：`kind=chat` + `mode=research`（`fillTemplate` 支持模式路由），点击直达研究模式并预填主题（26 个工具）
- `POST /api/research` 增加内容审核：违规 topic → 400（复用 `checkText`）
- 演示模式计入网关用量：`gateway_usage` 落 `modelId=research-demo / providerId=research`（免费，cost=0，归属当前用户）；真实模式由 `streamChatCompletion` 按模型正常记账

## 复验方法

```bash
npm run dev -- -p 3007
BASE=http://localhost:3007 node scripts/e2e-research.mjs
```

## 断言（8 项）

1. 应用健康（`/api/health`）
2. 演示研究 SSE 成功且 ≥3 条进度事件
3. 报告结构完整：`demo=true`、topic 匹配、摘要 >20 字、≥5 小节、≥4 来源、4 条要点
4. 正文带 `[n]` 引用角标；来源 `demo=true` 且 URL 为 example.com（前端「示例来源」标识依据）
5. 注册账号
6. 登录态研究成功（`report.demo=true`）
7. `gateway_usage`：`scope=me` 的 `byModel` 含 `research-demo`（calls≥1，cost=0）
8. 违规 topic → 400；测试账号删除清理

## 真实联网接入点（拿到 Key 后自动生效）

- `TAVILY_API_KEY`（设置中心也可填）：engine 自动切换真实模式——多路查询 → 去重 → 模型综述（报告结构与前端零改动）
- 扩展位：`engine.ts` 的 `tavilySearch` 可加 Exa / 博查 / 秘塔同构 adapter；阅读环节可接 Jina Reader 深化摘要
