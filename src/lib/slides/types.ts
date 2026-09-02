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
  /** 图片提示词（AI 配图生成用；无配图时省略） */
  imagePrompt?: string;
  /** 已生成的配图 URL（data URI / 图床） */
  imageUrl?: string;
  note?: string;
}

export interface SlideDeck {
  title: string;
  subtitle?: string;
  theme: ThemeId;
  slides: Slide[];
}

export type ThemeId = "violet" | "ocean" | "sunset" | "forest" | "ink";
