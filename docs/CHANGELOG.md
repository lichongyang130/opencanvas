# OpenCanvas 变更日志

> 本轮目标：把「占位页面」全部替换为真实可用功能，并完成全局深色主题重构。

## 2026-09-03 · 第十一轮：模型网关增强（A3）

**跨供应商降级**
- 模型目录新增 fallback 链：gpt-4o-mini → deepseek-chat → qwen-plus；gpt-4o / claude-3.5 → qwen-max → qwen-plus；qwen-max → qwen-plus
- 网关按链自动切换：仅在上游失败且未输出任何 token 时降级（已流式输出不撤回），对话推送降级状态
- 环境变量 `GATEWAY_FALLBACK=0` 可关闭

**多 Key 轮询**
- 供应商适配器支持密钥列表：`OPENAI_API_KEYS=a,b,c`（各供应商同款），请求按轮询切换
- 当前 key 返回 401/403/429 时自动换下一个 key 重试；全部失败才报错

**限流**
- 进程内令牌桶：`GATEWAY_RATE_LIMIT`（默认 60 次/分钟/用户，未登录按 IP；0 = 关闭）
- 超限返回 429 + 建议等待秒数；对话/PPT/大纲接口均接入

**成本看板**
- 新表 `gateway_usage`：每次真实调用记录模型/供应商/是否降级/tokens/成本/积分/延迟/状态
- `GET /api/gateway/stats`：今日/近 7 天调用、成本、按模型聚合、最近调用；`scope=all` 需 `GATEWAY_ADMIN_KEY`
- 设置中心「模型设置」新增「网关增强」与「用量与成本看板」两个区块（含 .env 说明）

## 2026-09-03 · 第十轮：增长闭环（A4）

**产物分享只读页**
- 画布标题栏新增「分享」：PPT / 文档 / 图片 / 研究报告一键生成公开只读链接（`/s/:code`）
- 分享页多态解析：智能体 → 产物 → 模板 → 案例（legacy）统一走 `/api/shares/:code`
- PPT 分享页支持翻页只读预览 + 下载 PPTX（复用导出接口）；文档/报告复用只读组件；图片网格展示
- 「复制到我的工作台」：`POST /api/shares/:code/import` 服务端建会话写产物 → 跳 `/chat` 直接编辑
- 新表 `artifact_shares`；老库自动迁移

**模板独立分享码**
- `prompt_templates` 新增 `shared` / `shareCode`（老库自动 ALTER）
- 「我的提示词」卡片：独立分享链接（公开只读页，含「开始创作」）+ 原离线分享码双入口
- `POST /api/templates/:id/share` 生成/复用分享码，`DELETE` 取消分享

## 2026-09-03 · 第九轮：PPT 增强（A2）

**演讲者备注**
- 主幻灯片下方新增「演讲者备注」编辑框，`patchSlide(idx, {"note"})` 600ms 防抖落库
- PPTX 导出每页写入 `speakerNotes`；打印视图同样保留备注

**大纲先行**
- 幻灯片模式参数行新增「大纲先行」开关：先生成目录大纲，用户可修改标题/章节/要点后确认，再按大纲生成完整 PPT
- 新接口 `POST /api/slides/outline`（SSE）：真实模型输出 JSON 大纲；未配密钥走内置示例大纲，零配置可体验
- `POST /api/slides` 支持 `outline` 字段：真实模型严格遵循章节顺序与标题；演示路径把章节映射到示例 PPT
- 确认弹窗：章节可编辑（标题 + 每行一条要点），取消/关闭清空待确认状态

**主题市场**
- 主题切换改为市场式 chips（色点 + 标签，选中反白），主题扩至 9 套：violet / ocean / sunset / forest / ink / rose / slate / amber / cyan

## 2026-09-03 · 第八轮：图像工具补齐（A1）

- 万相 imageedit 接入：指令编辑（description_edit）/ 智能扩图（expand，四向比例）/ 风格化（stylization_all），base_image_url 支持 base64，设置页选 DASHSCOPE key 即用
- 画布图片工具行：变体 / AI 编辑 / 扩图 / 风格化 / 同款组图（串行 3 视角）/ 去背景 / 下载
- 尺寸模板：1:1 / 16:9 / 9:16 / 海报 4:5 / 封面 4:3（fal 与万相同步映射）

## 2026-09-03 · 第七轮：Google / GitHub OAuth 登录

- 完整 OAuth 2.0 授权码流程（服务端）：/api/auth/oauth/{google,github} 授权跳转（state + httpOnly cookie 防 CSRF）→ 回调换 token → 拉取资料 → 绑定/创建本地用户 → 会话 cookie
- 登录弹窗新增「Google / GitHub」按钮（官方 G 图标 + GitHub 图标）；未配置凭据时点击给出配置指引
- users 表新增 provider / providerUserId 列（幂等迁移）；同邮箱自动绑定本地账号；GitHub 邮箱非公开时自动请求 user/emails 补拉
- OAuth 回调结果回到首页 toast 提示（/?oauth=success|error）；.env.example 新增 GOOGLE/GITHUB CLIENT_ID/SECRET、OAUTH_REDIRECT_BASE 及回调地址说明
- 配置方式：Google Cloud Console / GitHub Developer Settings 创建 OAuth 应用，回调地址 = https://你的域名/api/auth/oauth/{google,github}/callback

## 2026-09-03 · 第六轮：登录真实化 + 弹窗遮挡修复

- 全局登录态 store（useAuthStore）：顶栏徽章与侧栏底部卡片共享状态，登录/登出实时同步
- 首页左下「Alex Chen」mock 用户卡片 → 真实「登录 / 注册」卡片（已登录显示头像昵称 + 下拉：会员方案 / 退出登录）
- AuthBadge 弹窗与头像下拉改为 React Portal 挂 body + fixed z-[9999]，修复顶栏层叠上下文导致的「登录框被遮挡」
- 弹窗支持点击遮罩关闭、自动聚焦邮箱输入

## 2026-09-03 · 第五轮：AI 绘图增强（FLUX / Seedream / 背景移除）

- 新增 fal.ai 图像适配器：FLUX.1 Schnell（文生图）/ Dev（图生图，image_url），queue 轮询 60s，支持 base64 data URI；设置页可配 FAL_KEY、测试连接、获取模型列表（fal /v1/models）
- 通义万相图像适配器扩展：wan2.7-t2i-flash / wanx2.5-t2i（Seedream 同源）文生图，wanx2.1-i2i-turbo 图生图（image_url）
- /api/images 支持 model 指定与 imageUrl 图生图，按模型自动扣积分（失败不扣）；模型表含价格/积分/图生图能力，/api/models 自动下发
- 图片工作台：参数行「绘图模型」下拉（自动/FLUX/万相/DALL·E）+「参考图（图生图）」按钮，上传图片附件即作为参考图
- 画布图片新增操作：一键生成「变体」（以该图为参考图）与「去背景」（服务端 remove.bg 优先，未配置时客户端 @imgly/background-removal WASM 本地 AI，免费）
- demo 适配器支持图生图占位提示；.env.example 新增 FAL_KEY / REMOVE_BG_API_KEY 说明
- 复查修正：fal 模型列表改用官方 `endpoint_id` 字段；万相按版本分接口（wan2.7/2.5 新版 multimodal、wanx2.5-t2i 旧 text2image、wanx2.1-i2i-turbo 旧 image2image），图生图推荐 wan2.5-i2i-preview 并兼容新旧响应
- 体验修正：图片模式隐藏对话模型选择器（用绘图模型下拉）、仅传参考图也可提交（默认变体提示词）、本地去背景对外链先取 Blob 再处理

## 2026-09-03 · 第四轮：本地账号体系（P2-4-2 本地版）

- users / sessions 表 + conversations.userId（幂等迁移）
- /api/auth/register|login|logout|me；scrypt 密码哈希 + httpOnly cookie（30 天），零外部依赖
- AuthBadge：首页/工作台顶栏登录按钮、注册/登录弹窗、头像下拉登出；刷新恢复会话
- 会话按用户归属：登录后新会话归本人，列表按身份过滤（未登录仅见本地旧会话）

## 2026-09-03 · 第三轮：TipTap 富文本 + PPT 单页 AI 重写 + 流式重试

- 富文本编辑器：TipTap 所见即所得（标题/粗斜体/删除线/列表/引用/代码块/撤销重做），Markdown 双向转换（marked + turndown），AI 操作与导出链路不变
- PPT AI 单页重写：/api/slides 新增 rewrite 模式，真实模型改写选中页（版式可自适应，旧配图作废）
- 流式请求 HTTP 阶段失败客户端自动重试一次（Abort 不重试）

## 2026-09-03 · 第二轮：PPT 版式/PDF/高亮/编辑重发

- PPT 新版式：时间轴 / 对比 / 流程 / 引言 / 团队（类型、prompt、解析器、渲染四层同步）
- PPT 导出 PDF：打印视图逐页输出（@media print 横版 + break-inside-avoid）
- Markdown 代码块语法高亮：语言标签 + 关键词/字符串/注释/数字着色（零依赖）
- 消息编辑重发：用户消息「编辑」→ 删除后续回复并回填输入框（含数据库清理）
- 顶栏任务标题可点击重命名（Enter 保存 / Esc 取消）
- 代码版本历史持久化（随会话落库）

## 2026-09-03 · 缺口清单批量落地（感知/体验/健壮性）

**核心能力**
- PPT 自动配图：单页 + 批量「AI 配图」，自动选模型（DALL·E 3 / 万相 / 演示 SVG），imageUrl 随会话持久化
- 知识库语义向量化：零依赖 TF-IDF + cosine，与关键词命中融合排序，接口不变
- 对话附件：粘贴/拖拽/按钮添加图片与文档，文本注入模型上下文，图片 Markdown 渲染（Markdown 组件补图片/链接支持）
- 深度研究「一键转 PPT」（此前已实现，本轮验收打通）

**交互与体验**
- 移动端响应式：侧栏抽屉导航、画布全屏；PWA（manifest + icon + theme-color）
- Artifact 画布：多产物 Tab（代码预览 ↔ 对话产物）、代码版本历史（10 版回看）
- 消息重新生成（含删除 API）、↑ 键召回上一条、Ctrl/Cmd+N 新建
- 历史分组（今天/昨天/7 天内/更早）、首页随机灵感、首访 3 步新手引导
- 语音输入（Web Speech API）+ 消息朗读（speechSynthesis）
- DocView：Markdown 快捷工具栏（标题/加粗/列表/引用/代码/链接）+ 导出 PDF

**健壮性与合规**
- 网关：首个 token 前失败自动重试一次
- 本地内容审核：输入拦截 + 输出流式检测（词表/正则可扩展）
- API：`DELETE /api/messages`（重新生成清理旧回复）

## 2026-09-03 · 知识库接入工作台对话（RAG）

**数据层**
- `conversations` 新增 `kbId`、`messages` 新增 `refs`（含幂等 PRAGMA 迁移）；repo 读写同步扩展

**工作台**
- 新建 `KbPicker`：输入舱上方选择/解除知识库，空态引导去知识库创建，选中显示已启用提示
- 会话绑定知识库后发送消息：自动 POST `/api/knowledge/:id/query` 检索命中片段 → 注入 system 上下文（`【资料N｜docName】snippet`，要求优先依据资料并列出引用来源）→ 命中写入消息 `refs` 并持久化
- 引用来源卡片：回答下方可折叠展示（文档名 / 片段 / 相关度），历史会话重新打开自动回填

**API**
- `POST /api/messages` 接受 `refs`；`PATCH /api/conversations/:id` 接受 `kbId`

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
