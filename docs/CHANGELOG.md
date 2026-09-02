# OpenCanvas 变更日志

> 本轮目标：把「占位页面」全部替换为真实可用功能，并完成全局深色主题重构。

## 2026-09-02 · 占位清零 + 全站真实化 + 深色模式（一次性交付）

### P0 核心功能接真

**P0-1 文件上传解析 + 文档中心**
- `documents` 表 + `data/uploads` 文件存储；`POST/GET/PATCH/DELETE /api/documents` + 详情/下载/搜索/回收站
- PDF（pdf-parse）、DOCX（mammoth）、Markdown/TXT/CSV/JSON/LOG/HTML/YML 直接正文提取；XLSX/PPTX 登记
- 文档中心：真实列表、拖拽/多文件上传、正文预览抽屉、收藏、回收站、下载

**P0-2 模板中心接真实数据 + 一键运行**
- `prompt_templates` 表 + CRUD/计数 API；热门/最新/我的提交三个 Tab
- 提交模板真实入库（变量 `{{x}}` 实时预览）；一键运行新建对应模式会话并真实发送；共享模板运行前真实计数
- 右栏推荐按 uses 排序、随机来一个、我的模板删除

**P0-3 智能体 CRUD + 分享**
- `agents` 表 + CRUD/分享 API；我的智能体（创建/编辑/删除）+ 官方智能体（personas.ts 真实系统提示词）
- `startAgent`：新建绑定角色的会话、注入 system prompt 到 `/api/chat`、预填开场白；使用次数按绑定会话数统计
- 分享：公开链接 `/s/:code`，复制/预览/取消分享，分享页可「立即使用」

### P1 产品差异化

**知识库（本地 RAG）**
- `knowledge_bases` + `kb_documents` 表；CRUD/文档关联 API（复用文档正文解析）
- `lib/kb/search.ts` 本地检索引擎：中文 2-gram + 滑窗打分，返回带来源片段与相关度
- 知识库页：真实统计/列表/搜索/分页；能力开关（语义检索/问答增强/引用来源）持久化
- 提问弹窗：命中片段 → 注入 `/api/chat` 生成带引用回答

**工具箱**
- 内容创作/数据分析工具经对话引擎真实执行（预填指令）；文档工具直达文档中心；协作类如实标注「规划中」

**通知中心**
- `notifications` 表 + API；全局 `NotificationBell` 替换 7 个页面铃铛
- 上传文档/建库/建智能体/提交模板自动产生通知，未读角标、点击跳转、全部已读

### P2 扩展能力

**代码沙箱（P2-1）**
- AI 回复含 HTML 代码块时出现「运行预览」；右侧画布 sandbox iframe 隔离运行
- 重新运行/复制源码/新窗口打开；`codePreview` 随会话持久化

**本地积分中心（P2-2）**
- `credit_ledger` 账本；AI 调用按真实用量扣积分（gateway credits）
- 上传 +5 / 创建智能体/模板/知识库 +3 / 分享 +3 / 每日签到 +10
- `CreditsBadge` 全局组件（7 页顶栏）：余额 + 今日任务 + 流水，到账弹跳动效

**深色模式（P2-4-1）**
- Tailwind stone/brand 色板变量化 + 语义令牌（背景/面板/边框/悬停/品牌/强调）
- 19 个文件 300+ 处硬编码色替换；`.dark` 全套深色令牌，品牌色提亮
- 设置中心「外观主题」：跟随系统 / 浅色 / 深色，即时切换 + 本地持久化

### 体验美化
- 模板热门 Tab：Top3 卡片 🔥 徽章 + 强调描边
- 知识库提问：命中词高亮（中文 2-gram/英文词）
- 工具箱：全局搜索框（24 个工具实时过滤）
- 智能体创建弹窗：官方角色一键预设（8 个）
- 积分徽章：余额变化弹跳动效

### 数据层
- 新增表：`prompt_templates`、`agents`、`knowledge_bases`、`kb_documents`、`notifications`、`credit_ledger`
- `conversations` 新增列：`personaSystem`、`codePreview`
- 老库自动迁移（CREATE IF NOT EXISTS + ALTER TABLE 补列），无需手动操作

### 已知边界（如实说明）
- 文生视频、OCR/压缩/水印、团队协作、登录账号：需外部服务，界面已标注「规划中」
- 深色模式覆盖主流程页面；第三方依赖自绘组件（如部分图表）仍为其原始配色
