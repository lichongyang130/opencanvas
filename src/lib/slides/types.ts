/** 幻灯片生成 —— 数据结构与主题类型 */

export type SlideLayout =
  | "cover" // 封面
  | "toc" // 目录
  | "content" // 标题 + 要点
  | "twoCol" // 左右双栏
  | "stats" // 关键数字
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
  /** 图片提示词（第 2 阶段自动生成配图；第 1 阶段由渐变占位） */
  imagePrompt?: string;
  note?: string;
}

export interface SlideDeck {
  title: string;
  subtitle?: string;
  theme: ThemeId;
  slides: Slide[];
}

export type ThemeId = "violet" | "ocean" | "sunset" | "forest" | "ink";
