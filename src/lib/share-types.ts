/** 分享页统一数据视图 —— 纯类型与常量（客户端/服务端公用，不引入 DB/Node 依赖） */

export interface SharePayload {
  kind: "agent" | "template" | "case" | "slides" | "docs" | "image" | "report";
  title: string;
  description: string;
  data: Record<string, unknown>;
}

export const KIND_LABEL: Record<string, string> = {
  agent: "共享智能体",
  template: "共享模板",
  case: "真实案例",
  slides: "PPT 演示文稿",
  docs: "文档产物",
  image: "图片作品",
  report: "研究报告",
};

export type ShareKind = SharePayload["kind"];
