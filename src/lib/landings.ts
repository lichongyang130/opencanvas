/** SEO 落地页矩阵：关键词页数据（中英双语，服务端按 cookie locale 渲染） */

export interface LandingCopy {
  /** 浏览器标题用 */
  metaTitle: string;
  /** meta description */
  metaDesc: string;
  /** hero */
  h1: string;
  sub: string;
  cta: string;
  /** 核心功能 4 项 */
  features: { title: string; desc: string }[];
  /** 三步上手 */
  steps: { title: string; desc: string }[];
  /** FAQ 3 条 */
  faq: { q: string; a: string }[];
}

export interface LandingSpec {
  slug: string;
  /** 关键词别名（internal 文案用） */
  keyword: string;
  zh: LandingCopy;
  en: LandingCopy;
}

export const LANDINGS: LandingSpec[] = [
  {
    slug: "ai-writer",
    keyword: "AI 写作助手",
    zh: {
      metaTitle: "AI 写作助手 — 一键生成文章、文案、报告",
      metaDesc: "在线 AI 写作助手：输入主题即可生成文章、营销文案、工作总结与研究报告，支持长文续写、多模型切换、导出 Word/PDF。免费开始。",
      h1: "AI 写作助手，让文字创作快 10 倍",
      sub: "从公众号文章到商业报告，输入一句话主题，OpenCanvas 自动完成大纲、生成正文、润色语气，并支持导出 Word / PDF。",
      cta: "免费开始写作",
      features: [
        { title: "一键成稿", desc: "主题 → 大纲 → 全文，几百字到几千字分分钟完成。" },
        { title: "多模型切换", desc: "OpenAI / Claude / DeepSeek / 通义，按需选择最优模型。" },
        { title: "深度研究", desc: "自动联网检索资料，输出带来源的深度研究报告。" },
        { title: "导出与分享", desc: "Word / PDF / 公开链接，一键分发到团队。" },
      ],
      steps: [
        { title: "输入主题", desc: "一句话描述想写什么，或粘贴已有素材。" },
        { title: "选择风格", desc: "设定语气、长度与目标读者，AI 自动生成完整结构。" },
        { title: "编辑导出", desc: "在线改稿、继续扩写，最后导出 Word/PDF 或分享。" },
      ],
      faq: [
        { q: "AI 写作助手免费吗？", a: "免费版即可体验完整的文档生成与编辑流程；专业版解锁更多高级模型与无水印导出。" },
        { q: "生成的文字会有版权问题吗？", a: "内容由你提供指令生成，成果归你所有；建议在公开发布前人工复核关键事实。" },
        { q: "支持哪些语言？", a: "AI 原生支持中英文及其他主流语言，界面也可在中英文之间一键切换。" },
      ],
    },
    en: {
      metaTitle: "AI Writing Assistant — Articles, Copy & Reports",
      metaDesc: "Online AI writing assistant: generate articles, marketing copy, summaries and research reports from a topic. Multi-model, Word/PDF export. Start free.",
      h1: "Write 10x faster with an AI writing assistant",
      sub: "From blog posts to business reports — describe your topic and OpenCanvas drafts the outline, writes the content and polishes the tone, ready to export.",
      cta: "Start writing free",
      features: [
        { title: "One-click drafts", desc: "Topic → outline → full text in minutes, from a few hundred to thousands of words." },
        { title: "Multiple models", desc: "Switch between OpenAI, Claude, DeepSeek and Qwen per task." },
        { title: "Deep research", desc: "Auto web search with cited sources for in-depth reports." },
        { title: "Export & share", desc: "Word / PDF or a public link — one click to send to your team." },
      ],
      steps: [
        { title: "Type a topic", desc: "One sentence about what you want, or paste existing material." },
        { title: "Pick a style", desc: "Set tone, length and audience; AI builds the full structure." },
        { title: "Edit & export", desc: "Revise, extend, then export to Word/PDF or share a link." },
      ],
      faq: [
        { q: "Is the AI writing assistant free?", a: "The free plan covers the full doc generation and editing flow; Pro unlocks premium models and watermark-free export." },
        { q: "Who owns the generated text?", a: "Content is generated from your instructions and belongs to you; we recommend fact-checking before public publishing." },
        { q: "Which languages are supported?", a: "Chinese, English and most major languages; the UI itself switches between Chinese and English." },
      ],
    },
  },
  {
    slug: "ai-ppt",
    keyword: "AI PPT 生成",
    zh: {
      metaTitle: "AI PPT 生成器 — 输入主题，3 分钟出 PPT",
      metaDesc: "在线 AI PPT 生成器：输入主题自动生成完整演示文稿，主题配色一键切换，支持导出 PPTX，免费在线制作 PPT。",
      h1: "输入主题，3 分钟生成一套专业 PPT",
      sub: "AI 自动规划页面结构、撰写要点并配好视觉主题；在线编辑后一键导出 PPTX，工作汇报与路演演示都适用。",
      cta: "免费生成 PPT",
      features: [
        { title: "自动生成大纲", desc: "输入主题，AI 依据场景生成页面结构与演讲要点。" },
        { title: "海量主题配色", desc: "商务、科技、教育风格一键切换，排版无需设计功底。" },
        { title: "图表与图片", desc: "结合数据与 AI 配图，页面信息密度恰到好处。" },
        { title: "导出 PPTX", desc: "本地 PowerPoint / WPS 完美打开，可继续二次编辑。" },
      ],
      steps: [
        { title: "输入主题", desc: "例如「AI 写作助手产品发布会」或粘贴你的大纲。" },
        { title: "一键生成", desc: "选择风格与页数，AI 生成整套幻灯片。" },
        { title: "编辑导出", desc: "在线微调文字与配色，下载 PPTX 文件。" },
      ],
      faq: [
        { q: "生成的 PPT 可以导出编辑吗？", a: "可以。在线预览后可导出标准 .pptx 文件，在 PowerPoint / WPS 中继续编辑。" },
        { q: "有免费额度吗？", a: "免费版可生成并导出演示文稿；专业版提供更多页数与高级主题。" },
        { q: "适合哪些场景？", a: "工作汇报、产品路演、教学课件、培训材料等常见演示场景均可快速生成。" },
      ],
    },
    en: {
      metaTitle: "AI PPT Generator — Deck from a Topic in 3 Minutes",
      metaDesc: "Online AI presentation generator: type a topic, get a full slide deck with themes and charts, export to PPTX. Create presentations free.",
      h1: "Turn a topic into a polished deck in 3 minutes",
      sub: "AI plans the slide structure, writes talking points and applies a visual theme; edit online and export to PPTX in one click.",
      cta: "Generate a deck free",
      features: [
        { title: "Auto outline", desc: "AI builds slide structure and talking points from your topic." },
        { title: "Ready-made themes", desc: "Business, tech and education styles — no design skills needed." },
        { title: "Charts & images", desc: "Data and AI-generated visuals keep every slide informative." },
        { title: "PPTX export", desc: "Opens perfectly in PowerPoint / WPS for further editing." },
      ],
      steps: [
        { title: "Type a topic", desc: "e.g. “AI writing assistant product launch” or paste your own outline." },
        { title: "Generate", desc: "Pick a style and page count; AI creates the whole deck." },
        { title: "Edit & export", desc: "Tweak text and colors online, then download the PPTX." },
      ],
      faq: [
        { q: "Can I edit the exported deck?", a: "Yes — preview online, then export a standard .pptx that opens in PowerPoint / WPS." },
        { q: "Is there a free tier?", a: "The free plan supports generation and export; Pro adds more slides and premium themes." },
        { q: "What is it good for?", a: "Work reports, product pitches, lessons and training materials — any presentation scenario." },
      ],
    },
  },
  {
    slug: "ai-video",
    keyword: "AI 视频生成",
    zh: {
      metaTitle: "AI 视频生成 — 文字描述生成短视频",
      metaDesc: "在线 AI 视频生成器：输入文字描述生成短视频，内置零密钥演示引擎，配置 Kling / 万相后可生成真实 AI 视频，免费试用。",
      h1: "用一段文字，生成你的 AI 视频",
      sub: "无需拍摄与剪辑：输入画面描述，OpenCanvas 生成可循环短片；接入 Kling / 通义万相后还可产出电影级真实视频。",
      cta: "免费生成视频",
      features: [
        { title: "零密钥可用", desc: "内置演示引擎立即生成动态短片，无需任何 API Key。" },
        { title: "Kling 1.6 Pro", desc: "配置 FAL_KEY 即可生成 10 秒电影级真实视频。" },
        { title: "通义万相", desc: "国内网络直达，wanx2.1-t2v-turbo 快速出片。" },
        { title: "预览与下载", desc: "MP4 在线播放，下载后可用于社媒与演示。" },
      ],
      steps: [
        { title: "描述画面", desc: "主体、风格、氛围、镜头运动，一句话或多句话均可。" },
        { title: "选择引擎", desc: "演示引擎免费预览，或切换到 Kling / 万相真实模型。" },
        { title: "预览下载", desc: "生成完成后在线播放、重新加载或下载保存。" },
      ],
      faq: [
        { q: "没有 API Key 能用吗？", a: "可以。内置演示引擎零密钥可用；配置 FAL_KEY 或 DASHSCOPE_API_KEY 后即可启用真实模型并扣除积分。" },
        { q: "真实视频生成要多久？", a: "Kling / 万相通常需要 1–3 分钟，页面会显示进度并在完成后自动播放。" },
        { q: "视频可以用在哪里？", a: "短视频平台、宣传物料、演示开场动画等，导出 MP4 后即可使用。" },
      ],
    },
    en: {
      metaTitle: "AI Video Generator — Text to Short Video",
      metaDesc: "Online AI video generator: turn text prompts into short clips. Built-in demo engine works without keys; Kling / Wanxiang models for real AI video. Try free.",
      h1: "Turn a sentence into an AI-generated video",
      sub: "No filming or editing: describe the scene and OpenCanvas produces a looping clip — or cinematic real video with Kling / Tongyi Wanxiang.",
      cta: "Generate a video free",
      features: [
        { title: "No key needed", desc: "The built-in demo engine renders animated clips instantly." },
        { title: "Kling 1.6 Pro", desc: "Set FAL_KEY to generate 10s cinematic videos." },
        { title: "Tongyi Wanxiang", desc: "Fast wanx2.1-t2v-turbo output for China-region access." },
        { title: "Preview & download", desc: "Play MP4 online and download for social or presentations." },
      ],
      steps: [
        { title: "Describe the scene", desc: "Subject, style, mood and camera motion — one or more sentences." },
        { title: "Pick an engine", desc: "Free demo preview, or switch to Kling / Wanxiang." },
        { title: "Preview & save", desc: "Play, re-run or download once generation completes." },
      ],
      faq: [
        { q: "Can I use it without an API key?", a: "Yes — the built-in demo needs no keys; set FAL_KEY or DASHSCOPE_API_KEY to enable real models, billed in credits." },
        { q: "How long does real video take?", a: "Kling / Wanxiang usually take 1–3 minutes; the page shows progress and auto-plays the result." },
        { q: "Where can I use the videos?", a: "Short-video platforms, marketing material and intro animations — export MP4 and go." },
      ],
    },
  },
  {
    slug: "ai-image",
    keyword: "AI 图片生成",
    zh: {
      metaTitle: "AI 图片生成器 — 描述即所得，免费在线绘图",
      metaDesc: "在线 AI 图片生成器：输入描述生成海报、插画、素材图，支持图生图与风格化编辑，内置免费演示引擎，可接入 FLUX / 万相。",
      h1: "描述即所得：在线 AI 图片生成",
      sub: "输入一段文字，得到海报、插画与设计素材；支持参考图变体、扩图、去背景，导出后直接用于社交媒体与设计稿。",
      cta: "免费生成图片",
      features: [
        { title: "文生图", desc: "FLUX / 万相 / DALL·E 多引擎，描述越具体效果越好。" },
        { title: "图生图", desc: "上传参考图生成同款风格变体，保持主体一致。" },
        { title: "智能编辑", desc: "扩图、风格化、去背景，一站式完成设计素材处理。" },
        { title: "画廊管理", desc: "生成记录自动归档，随时回看与复用。" },
      ],
      steps: [
        { title: "输入描述", desc: "画面主体、风格、构图、光线，描述越细越好。" },
        { title: "选择模型", desc: "演示 / FLUX / 万相 / DALL·E，按需选择。" },
        { title: "下载使用", desc: "生成后预览、编辑或一键下载高清图。" },
      ],
      faq: [
        { q: "免费版可以用吗？", a: "可以。内置演示引擎零密钥可用；配置密钥后启用真实模型，调用会按模型计费。" },
        { q: "能生成商用图片吗？", a: "生成结果可用于个人与商业项目，请勿使用他人受版权保护的素材作为参考图。" },
        { q: "支持哪些尺寸与比例？", a: "支持方图、16:9、9:16 等常见比例，适配社媒封面与内容配图。" },
      ],
    },
    en: {
      metaTitle: "AI Image Generator — Free Online Text-to-Image",
      metaDesc: "Online AI image generator: create posters, illustrations and assets from a prompt, with image-to-image and editing tools. Free demo engine, FLUX / Wanxiang ready.",
      h1: "Prompt to picture: online AI image generation",
      sub: "Type a description and get posters, illustrations and design assets — with reference variants, outpainting and background removal built in.",
      cta: "Generate images free",
      features: [
        { title: "Text-to-image", desc: "FLUX / Wanxiang / DALL·E engines — the more specific, the better." },
        { title: "Image-to-image", desc: "Upload a reference to generate consistent style variants." },
        { title: "Smart editing", desc: "Outpaint, restyle and remove backgrounds in one flow." },
        { title: "Gallery", desc: "Every generation is archived for reuse." },
      ],
      steps: [
        { title: "Describe it", desc: "Subject, style, composition and light — the more detail the better." },
        { title: "Pick a model", desc: "Demo / FLUX / Wanxiang / DALL·E, as you like." },
        { title: "Download", desc: "Preview, edit or grab the high-res image." },
      ],
      faq: [
        { q: "Can I use the free version?", a: "Yes — the built-in demo needs no keys; real models are enabled by keys and billed per call." },
        { q: "Can I use images commercially?", a: "Results are fine for personal and commercial projects; don't use copyrighted references." },
        { q: "Which sizes are supported?", a: "Square, 16:9 and 9:16 among common ratios, fitting social covers and content." },
      ],
    },
  },
  {
    slug: "ai-docs",
    keyword: "AI 文档助手",
    zh: {
      metaTitle: "AI 文档助手 — 在线写作、总结与知识库问答",
      metaDesc: "AI 文档助手：上传文档自动总结问答，支持知识库、文档生成与多格式导出，中英文双语界面，免费在线使用。",
      h1: "文档太多？让 AI 帮你读、帮你写",
      sub: "上传 PDF / Word，AI 立即总结要点并回答追问；也可以从主题直接生成结构化文档，存入知识库随时调用。",
      cta: "免费开始",
      features: [
        { title: "文档总结", desc: "长文秒级提取要点，节省阅读时间。" },
        { title: "知识库问答", desc: "把资料沉淀为知识库，问答自动引用来源。" },
        { title: "多格式导入", desc: "支持 PDF / Word / Markdown / 文本。" },
        { title: "协作导出", desc: "生成结果可导出 Word/PDF 或生成公开分享链接。" },
      ],
      steps: [
        { title: "上传文档", desc: "拖入 PDF / Word / Markdown 或粘贴文本。" },
        { title: "提问或生成", desc: "让 AI 总结、改写、扩写或回答具体问题。" },
        { title: "保存复用", desc: "存入知识库，下次对话自动引用。" },
      ],
      faq: [
        { q: "支持哪些文档格式？", a: "PDF、Word（.docx）、Markdown 与纯文本均可上传解析。" },
        { q: "文档数据安全吗？", a: "文档存储在你的本地/私有部署实例中，仅用于生成回答，不会公开分享。" },
        { q: "能多人协作吗？", a: "生成的内容可导出为文件或公开分享链接，便于团队分发。" },
      ],
    },
    en: {
      metaTitle: "AI Document Assistant — Summaries, Q&A & Knowledge Base",
      metaDesc: "AI document assistant: upload PDFs and Word files for instant summaries and Q&A, generate structured documents, and build a knowledge base. Free online.",
      h1: "Too many documents? Let AI read and write them",
      sub: "Upload PDF / Word for instant summaries and follow-up questions — or generate structured documents from a topic and keep them in your knowledge base.",
      cta: "Start free",
      features: [
        { title: "Summaries", desc: "Key points from long docs in seconds." },
        { title: "Knowledge-base Q&A", desc: "Turn materials into a searchable KB with cited answers." },
        { title: "Multiple formats", desc: "PDF / Word / Markdown / plain text accepted." },
        { title: "Share & export", desc: "Export to Word/PDF or publish a public link." },
      ],
      steps: [
        { title: "Upload", desc: "Drag in PDF / Word / Markdown or paste text." },
        { title: "Ask or generate", desc: "Summarize, rewrite, extend or answer specific questions." },
        { title: "Save & reuse", desc: "Store in the knowledge base for future conversations." },
      ],
      faq: [
        { q: "Which formats are supported?", a: "PDF, Word (.docx), Markdown and plain text can all be uploaded and parsed." },
        { q: "Is my document data safe?", a: "Documents live in your local/self-hosted instance and are used only to produce answers." },
        { q: "Can teams collaborate?", a: "Yes — export files or share public links for easy distribution." },
      ],
    },
  },
  {
    slug: "ai-agents",
    keyword: "AI 智能体平台",
    zh: {
      metaTitle: "AI 智能体平台 — 创建、分享与使用智能体",
      metaDesc: "在线 AI 智能体平台：用系统提示词创建专属助手，一键使用共享智能体，支持模板中心与知识库，免费开始打造你的 AI 团队。",
      h1: "打造属于你的 AI 智能体团队",
      sub: "用一句系统提示词定义角色与工作流，一键创建专属助手；也可以从模板中心与社区智能体直接开箱即用。",
      cta: "免费创建智能体",
      features: [
        { title: "零代码创建", desc: "填写名称、角色定位与系统提示词即可发布。" },
        { title: "开箱即用模板", desc: "写作、编程、设计、运营等场景模板一键套用。" },
        { title: "自定义知识", desc: "绑定知识库，让助手回答贴合你的业务资料。" },
        { title: "分享与协作", desc: "公开分享智能体，别人扫码即可使用。" },
      ],
      steps: [
        { title: "定义角色", desc: "想一个名称，写出它该做什么、如何回答。" },
        { title: "绑定知识", desc: "可选：关联知识库，让回答更专业。" },
        { title: "使用与分享", desc: "立即对话，或分享给团队与社区。" },
      ],
      faq: [
        { q: "创建智能体需要编程吗？", a: "不需要。全部通过表单完成，系统提示词会自动生成专业角色。" },
        { q: "可以用别人的智能体吗？", a: "可以。模板中心和共享智能体均可一键使用，无需配置。" },
        { q: "智能体能学习我的资料吗？", a: "可以绑定知识库，在回答时自动检索你的文档与知识。" },
      ],
    },
    en: {
      metaTitle: "AI Agent Platform — Create, Share & Use Agents",
      metaDesc: "Online AI agent platform: create custom assistants from a system prompt, use shared agents and templates, and attach a knowledge base. Start free.",
      h1: "Build your own team of AI agents",
      sub: "Define a role and workflow with a system prompt to create a dedicated assistant — or start from ready-made templates & community agents.",
      cta: "Create an agent free",
      features: [
        { title: "No-code creation", desc: "Name, role and system prompt — publish in minutes." },
        { title: "Ready templates", desc: "Writing, coding, design and ops presets, one click way." },
        { title: "Custom knowledge", desc: "Attach a knowledge base so answers fit your business." },
        { title: "Share & collaborate", desc: "Publish an agent publicly for anyone to use instantly." },
      ],
      steps: [
        { title: "Define the role", desc: "Give it a name and describe what it does and how it answers." },
        { title: "Attach knowledge", desc: "Optional: link a knowledge base for more expert replies." },
        { title: "Use & share", desc: "Chat now, or share with your team and community." },
      ],
      faq: [
        { q: "Do I need to code to create an agent?", a: "No — everything is form-based; the system prompt builds a professional role automatically." },
        { q: "Can I use agents created by others?", a: "Yes — template center and shared agents work out of the box." },
        { q: "Can agents learn my materials?", a: "Attach a knowledge base and it will retrieve your docs when answering." },
      ],
    },
  },
];

export function getLanding(slug: string): LandingSpec | undefined {
  return LANDINGS.find((l) => l.slug === slug);
}
