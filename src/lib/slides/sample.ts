import type { SlideDeck, SlideOutline, ThemeId } from "./types";

/** 演示模型（无密钥）时返回的示例 PPT，让 PPT 功能零配置可体验 */
export function buildSampleDeck(topic: string, theme: ThemeId = "violet"): SlideDeck {
  const t = topic.trim() || "AI 智能体工作空间产品发布";
  return {
    title: t,
    subtitle: "让研究、分析与创作在一个流程中完成",
    theme,
    slides: [
      {
        layout: "cover",
        title: t,
        subtitle: "产品发布会 · 2026",
        imagePrompt: "futuristic AI workspace, purple gradient, clean tech style",
      },
      {
        layout: "toc",
        title: "目录",
        bullets: ["行业背景", "产品方案", "核心能力", "市场与定价"],
      },
      {
        layout: "content",
        title: "行业背景：AI 创作需求爆发",
        bullets: [
          "全球 AI 写作/设计工具用户已超 1 亿",
          "用户平均在 5 个以上 AI 工具间切换",
          "单点工具无法打通「调研→成稿→设计」链路",
          "市场亟需一站式智能体工作空间",
        ],
        imagePrompt: "growing market chart, abstract 3d, violet tone",
      },
      {
        layout: "stats",
        title: "市场机会",
        stats: [
          { value: "10M+", label: "目标早期用户" },
          { value: "$20B", label: "2030 市场规模" },
          { value: "6 合 1", label: "研究/PPT/图/视频/文档/代码" },
        ],
      },
      {
        layout: "twoCol",
        title: "产品方案：对话即成品",
        bullets: [
          "一句话生成整套营销素材",
          "深度研究自动多轮搜索",
          "文档 / PPT / 图片 / 视频联动",
          "品牌资产保持风格一致",
        ],
        twoColTitle: "技术底座",
        bulletsRight: [
          "统一模型网关，国内外模型即插即用",
          "Agent 编排引擎，多步任务自动执行",
          "积分计费，成本透明可控",
        ],
      },
      {
        layout: "content",
        title: "核心能力一：深度研究",
        bullets: [
          "自动拆解问题、多轮联网搜索",
          "阅读并去重数十篇资料",
          "输出带引用的结构化研究报告",
          "一键转为演示幻灯片",
        ],
      },
      {
        layout: "content",
        title: "核心能力二：一键 PPT",
        bullets: [
          "主题一句话，大纲与成稿自动完成",
          "多套主题版式，配图自动生成",
          "画布内直接编辑、换主题",
          "一键导出 PPTX / PDF",
        ],
        imagePrompt: "presentation slides floating, modern flat illustration",
      },
      {
        layout: "stats",
        title: "效率提升",
        stats: [
          { value: "10x", label: "内容产出速度" },
          { value: "-80%", label: "工具切换成本" },
          { value: "98%", label: "用户满意度目标" },
        ],
      },
      {
        layout: "end",
        title: "谢谢观看",
        subtitle: "立即免费体验 · 注册即送积分",
      },
    ],
  };
}

/** 演示路径：由示例 PPT 生成一份大纲，让「大纲先行」零配置可体验 */
export function buildSampleOutline(topic: string): SlideOutline {
  const t = topic.trim() || "AI 智能体工作空间产品发布";
  return {
    title: t,
    sections: [
      { title: "行业背景", bullets: ["AI 创作需求爆发", "工具分散割裂", "迫切需要一站式方案"] },
      { title: "市场机会", bullets: ["目标用户规模", "市场规模与增速", "切入时机与差异化"] },
      { title: "产品方案", bullets: ["对话即成品", "研究/PPT/图/文档联动", "品牌资产一致"] },
      { title: "核心能力", bullets: ["深度研究", "一键 PPT", "图片与多模态创作"] },
      { title: "技术底座", bullets: ["统一模型网关", "Agent 编排", "积分计费透明"] },
      { title: "总结与行动", bullets: ["价值总结", "近期里程碑", "下一步行动"] },
    ],
  };
}

/** 演示路径：把已确认大纲映射到示例 PPT（保留版式与示例内容，替换标题/要点） */
export function applyOutlineToSample(deck: SlideDeck, outline: SlideOutline): SlideDeck {
  const sections = outline.sections;
  const slides = deck.slides.map((s, i) => {
    // cover/toc/end 保留；内容页按大纲顺序填充
    if (s.layout === "cover" || s.layout === "toc" || s.layout === "end") return s;
    const idx = Math.min(i - 2, sections.length - 1);
    const sec = sections[Math.max(0, idx)];
    if (!sec) return s;
    return {
      ...s,
      title: sec.title,
      bullets: sec.bullets.length > 0 ? sec.bullets : s.bullets,
    };
  });
  return { ...deck, title: outline.title, slides };
}
