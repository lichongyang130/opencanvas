/** 幻灯片生成 —— 数据结构与主题类型 */

export type SlideLayout =
  | "cover" // 封面
  | "toc" // 目录
  | "content" // 标题 + 要点
  | "twoCol" // 左右双栏
  | "stats" // 关键数字
  | "timeline" // 时间轴
  | "compare" // 左右对比
  | "process" // 流程步骤
  | "quote" // 引言金句
  | "team" // 团队/人物
  | "end"; // 结束页

export interface Slide {
  layout: SlideLayout;
  title?: string;
  subtitle?: string;
  bullets?: string[];
  /** twoCol：右栏要点 */
  bulletsRight?: string[];
  twoColTitle?: string;
  /** stats：关键数字卡片 [{value:"92%", label:"客户满意度"}] */
  stats?: { value: string; label: string }[];
  /** timeline：阶段节点 [{time:"2024Q1", label:"事件"}] */
  timeline?: { time: string; label: string }[];
  /** compare：对比标题 [左,右] + 对比项 rows [[左,右],...] */
  compareTitle?: string;
  compareRows?: { left: string; right: string }[];
  /** process：流程步骤数组 */
  process?: string[];
  /** quote：引言内容 */
  quote?: string;
  quoteBy?: string;
  /** team：成员 [{name, role, emoji}] */
  team?: { name: string; role: string; emoji?: string }[];
  /** 图片提示词（AI 配图生成用；无配图时省略） */
  imagePrompt?: string;
  /** 已生成的配图 URL（data URI / 图床） */
  imageUrl?: string;
  /** 演讲者备注 */
  note?: string;
}

export interface SlideDeck {
  title: string;
  subtitle?: string;
  theme: ThemeId;
  slides: Slide[];
}

export type ThemeId = "violet" | "ocean" | "sunset" | "forest" | "ink" | "rose" | "slate" | "amber" | "cyan";

/** PPT 大纲（大纲先行流程：用户确认后再生成完整幻灯片） */
export interface OutlineSection {
  title: string;
  bullets: string[];
}

export interface SlideOutline {
  title: string;
  sections: OutlineSection[];
}
