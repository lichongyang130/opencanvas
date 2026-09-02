import type { ThemeId } from "./types";

/**
 * 让 LLM 严格输出幻灯片 JSON 的系统提示词。
 * 只输出 JSON、不要 markdown 代码块、不要解释文字。
 */
export function buildSlidesPrompt(
  topic: string,
  context?: string
): { system: string; user: string } {
  const system = `你是专业的演示文稿设计助手。根据用户主题生成一套高质量中文 PPT 的结构化数据。

严格要求：
1. 只输出一个 JSON 对象，不要输出 markdown 代码块、不要任何解释或前后缀文字。
2. JSON 结构如下：
{
  "title": "演示标题",
  "subtitle": "可选副标题",
  "slides": [
    {"layout": "cover",   "title": "标题", "subtitle": "副标题"},
    {"layout": "toc",     "title": "目录", "bullets": ["章节1","章节2","章节3","章节4"]},
    {"layout": "content", "title": "页标题", "bullets": ["要点1","要点2","要点3"], "imagePrompt": "可选的英文配图描述"},
    {"layout": "twoCol",  "title": "页标题", "bullets": ["左栏要点"], "twoColTitle": "右栏标题", "bulletsRight": ["右栏要点"]},
    {"layout": "stats",   "title": "页标题", "stats": [{"value":"92%","label":"指标名"}]},
    {"layout": "timeline", "title": "发展历程", "timeline": [{"time":"2024Q1","label":"里程碑"}]},
    {"layout": "compare", "title": "方案对比", "compareTitle": "对比维度", "compareRows": [{"left":"方案A","right":"方案B"}]},
    {"layout": "process", "title": "实施流程", "process": ["步骤1","步骤2","步骤3"]},
    {"layout": "quote",   "title": "金句页", "quote": "一句话观点", "quoteBy": "署名/出处"},
    {"layout": "team",    "title": "团队介绍", "team": [{"name":"姓名","role":"角色","emoji":"可选"}]},
    {"layout": "end",     "title": "谢谢观看", "subtitle": "可选"}
  ]
}
3. 页数 8~12 页，必须以 cover 开头、end 结尾，中间合理使用 toc/content/twoCol/stats/timeline/compare/process/quote/team。
4. 每页要点 3~5 条，每条不超过 22 个汉字，信息密度高、可直接上屏。
5. stats 的 value 用简短有力的数字/百分比/金额；数据不确定时用合理示例并避免编造精确来源。
6. imagePrompt 用英文短语描述配图（主体+风格+色调），没有合适配图可省略。
7. timeline/compare/process/quote/team 按内容适配，不宜用时不强行使用。
8. 内容要专业、有洞察，符合商业演示标准。`;

  const user = context
    ? `请基于以下研究资料，为主题「${topic}」生成一份汇报 PPT，充分提炼资料中的数据与结论：\n\n${context}`
    : `请为以下主题生成 PPT：${topic}`;
  return { system, user };
}

export function themeOrDefault(theme?: string): ThemeId {
  const valid: ThemeId[] = ["violet", "ocean", "sunset", "forest", "ink"];
  return (valid as string[]).includes(theme ?? "") ? (theme as ThemeId) : "violet";
}
