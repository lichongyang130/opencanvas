import type { WorkspaceMode } from "@/lib/store/chat";

/** 一键场景模板：点击即新建对应模式任务并发送预置 prompt */
export interface Template {
  id: string;
  label: string;
  desc: string;
  category: TemplateCategory;
  mode: WorkspaceMode;
  prompt: string;
}

export type TemplateCategory = "marketing" | "research" | "business" | "video" | "edu" | "creative";

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  marketing: "市场营销",
  research: "研究分析",
  business: "商业办公",
  video: "视频创作",
  edu: "教育教学",
  creative: "创意设计",
};

export const CATEGORY_ORDER: TemplateCategory[] = [
  "marketing",
  "research",
  "business",
  "video",
  "edu",
  "creative",
];

export const TEMPLATES: Template[] = [
  { id: "t-launch-kit", label: "新品发布全套件", desc: "发布会演示 PPT", category: "marketing", mode: "slides", prompt: "为「AI 智能写作助手」新品发布会生成一套完整 PPT" },
  { id: "t-social", label: "社媒营销文案", desc: "5 条小红书/Ins 文案", category: "marketing", mode: "chat", prompt: "为一款新上市的精品挂耳咖啡，写 5 条不同风格的小红书/Instagram 社媒推广文案，包含标题、正文和标签" },
  { id: "t-brand-poster", label: "品牌宣传图", desc: "新中式茶饮海报", category: "marketing", mode: "image", prompt: "新中式茶饮品牌的社媒宣传海报，清新水彩风格，竹影与茶汤，柔和光线，竖版构图" },
  { id: "t-ad-copy", label: "广告投放文案", desc: "信息流广告标题", category: "marketing", mode: "chat", prompt: "为一款 AI 笔记应用写 10 条信息流广告标题+短文案，突出效率提升，风格各不同" },

  { id: "t-research-ai", label: "AI 赛道研究", desc: "玩家/规模/趋势", category: "research", mode: "research", prompt: "深度研究 2025 年 AI 搜索与智能体赛道：主要玩家、市场规模、技术趋势与差异化机会" },
  { id: "t-market", label: "市场调研报告", desc: "美国精品咖啡", category: "research", mode: "research", prompt: "调研美国精品咖啡市场：规模、增长率、主要品牌、消费者画像与进入策略" },
  { id: "t-competitor", label: "竞品分析", desc: "横向对比表", category: "research", mode: "research", prompt: "对主流一站式 AI 创作工具（HIX AI、Genspark、Jasper、Notion AI）做竞品分析：功能、定价、优劣势" },

  { id: "t-bp", label: "商业计划书", desc: "SaaS 完整 BP", category: "business", mode: "docs", prompt: "写一份 SaaS 产品商业计划书：问题与机会、解决方案、目标市场、商业模式、竞品分析、团队、财务预测" },
  { id: "t-webinar", label: "研讨会 PPT", desc: "B2B 分享演示", category: "business", mode: "slides", prompt: "为一场面向 B2B SaaS 团队的「AI 提效实战」网络研讨会生成演示 PPT" },
  { id: "t-email", label: "商务合作邮件", desc: "BD 外联邮件", category: "business", mode: "chat", prompt: "写一封商务合作开发邮件：向潜在渠道合作伙伴介绍 AI 工作空间产品并提议合作，专业不卑不亢" },
  { id: "t-report", label: "季度经营复盘", desc: "复盘文档框架", category: "business", mode: "docs", prompt: "写一份季度经营复盘报告框架：目标回顾、关键成果、问题分析、下季度计划" },

  { id: "t-video-ad", label: "带货短视频脚本", desc: "15 秒分镜", category: "video", mode: "video", prompt: "为新款主动降噪耳机写一条 15 秒抖音/短视频带货脚本，包含分镜、画面、旁白和字幕" },
  { id: "t-video-launch", label: "新品发布短片", desc: "30 秒分镜脚本", category: "video", mode: "video", prompt: "为一款新咖啡品牌上市写一条 30 秒品牌短片分镜脚本：开场、产品、场景、号召" },

  { id: "t-lesson", label: "教案课件", desc: "小学科学教案", category: "edu", mode: "docs", prompt: "为小学三年级科学课「水的三态变化」生成一份完整教案：教学目标、重难点、教学过程、板书设计" },
  { id: "t-course-ppt", label: "课程演示 PPT", desc: "教学幻灯片", category: "edu", mode: "slides", prompt: "为高中历史「工业革命」一课生成教学演示 PPT，包含背景、过程、影响" },
  { id: "t-summary", label: "长文总结", desc: "资料要点提炼", category: "edu", mode: "chat", prompt: "请把复杂主题讲解成 5 个要点的通俗版本，适合零基础学生理解：主题为「大语言模型是如何工作的」" },

  { id: "t-storybook", label: "儿童绘本插画", desc: "小狐狸与雪", category: "creative", mode: "image", prompt: "一只小狐狸第一次看到雪的温馨绘本插画，柔和暖色调，手绘水彩风格，方形构图" },
  { id: "t-cyber", label: "赛博朋克场景", desc: "未来城市夜景", category: "creative", mode: "image", prompt: "赛博朋克风格的未来城市夜景，霓虹灯、雨夜街道、飞行汽车，电影感，横版宽幅" },
  { id: "t-mascot", label: "品牌 IP 形象", desc: "吉祥物设计图", category: "creative", mode: "image", prompt: "一个科技公司的可爱机器人吉祥物 IP 形象设计，圆润、紫蓝色调、3D 渲染风格，纯白背景" },
];
