/** 深度研究 —— 数据结构 */

export interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
  /** demo 模式下为模拟来源 */
  demo?: boolean;
}

export interface ResearchReport {
  topic: string;
  /** 简短执行摘要 */
  summary: string;
  /** 分节内容（markdown 风格纯文本，引用用 [n] 角标） */
  sections: { heading: string; body: string }[];
  /** 关键结论/要点 */
  takeaways: string[];
  sources: ResearchSource[];
  demo?: boolean;
  createdAt: number;
}

export type ResearchProgress =
  | { type: "status"; message: string }
  | { type: "report"; report: ResearchReport }
  | { type: "error"; message: string };
