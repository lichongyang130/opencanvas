"use client";

/**
 * 知识库本地数据层（localStorage 持久化）。
 * 浏览器端使用；提供种子数据、增删除、搜索、筛选。
 * 后续可无缝替换为服务端 API。
 */

export interface KbRow {
  id: string;
  name: string;
  desc: string;
  count: number;
  size: string;
  time: string;
  tint: string;
  sizeGb: number;
  tags: string[];
  updatedAt: string;
}

const KEY = "oc:knowledge-bases";
const SEED: KbRow[] = [
  { id: "kb-prod", name: "产品文档库", desc: "包含产品需求文档、PRD、设计文档、产品说明等相关资料", count: 156, size: "2.4 GB", time: "今天 14:30", tint: "bg-sky-50 text-sky-600", sizeGb: 2.4, tags: ["产品", "需求", "设计", "PRD"], updatedAt: "2024-01-15 16:30" },
  { id: "kb-market", name: "市场调研资料", desc: "市场分析、竞品调研、行业报告等内容", count: 89, size: "1.8 GB", time: "今天 11:20", tint: "bg-emerald-50 text-emerald-600", sizeGb: 1.8, tags: ["市场", "竞品", "行业"], updatedAt: "2024-02-02 10:12" },
  { id: "kb-tech", name: "技术知识库", desc: "技术文档、开发指南、API 文档等内容", count: 232, size: "3.7 GB", time: "昨天 16:45", tint: "bg-violet-50 text-violet-600", sizeGb: 3.7, tags: ["技术", "API", "开发"], updatedAt: "2024-03-05 09:50" },
  { id: "kb-training", name: "培训资料库", desc: "培训课件、操作手册、学习资料等内容", count: 78, size: "1.2 GB", time: "昨天 10:15", tint: "bg-orange-50 text-orange-600", sizeGb: 1.2, tags: ["培训", "课程", "手册"], updatedAt: "2024-03-18 14:22" },
  { id: "kb-policy", name: "公司制度文档", desc: "公司制度、流程规范、政策文件等内容", count: 45, size: "890 MB", time: "08-13 09:30", tint: "bg-amber-50 text-amber-600", sizeGb: 0.89, tags: ["制度", "流程", "政策"], updatedAt: "2024-04-01 09:00" },
  { id: "kb-case", name: "客户案例库", desc: "成功案例、解决方案、客户反馈等内容", count: 127, size: "2.1 GB", time: "08-12 15:20", tint: "bg-cyan-50 text-cyan-600", sizeGb: 2.1, tags: ["案例", "交付", "反馈"], updatedAt: "2024-04-22 17:31" },
  { id: "kb-legal", name: "法务合同库", desc: "合同模板、合规文件、授权协议等内容", count: 64, size: "980 MB", time: "08-10 11:05", tint: "bg-red-50 text-red-600", sizeGb: 0.98, tags: ["合同", "法务", "合规"], updatedAt: "2024-05-06 13:40" },
  { id: "kb-hr", name: "人力资源库", desc: "招聘、绩效、员工手册及 HR 制度文档", count: 92, size: "1.6 GB", time: "08-09 10:18", tint: "bg-pink-50 text-pink-600", sizeGb: 1.6, tags: ["招聘", "绩效", "HR"], updatedAt: "2024-05-20 15:00" },
  { id: "kb-finance", name: "财务制度库", desc: "预算、报销、税务及财务制度规范", count: 37, size: "720 MB", time: "08-08 09:42", tint: "bg-lime-50 text-lime-600", sizeGb: 0.72, tags: ["财务", "预算", "税务"], updatedAt: "2024-06-02 10:10" },
  { id: "kb-marketing", name: "营销素材库", desc: "品牌素材、活动物料、社媒内容素材", count: 214, size: "4.3 GB", time: "08-07 16:20", tint: "bg-fuchsia-50 text-fuchsia-600", sizeGb: 4.3, tags: ["营销", "品牌", "素材"], updatedAt: "2024-06-15 12:35" },
  { id: "kb-deploy", name: "交付资料库", desc: "项目交付物、验收文档、实施记录", count: 58, size: "1.4 GB", time: "08-06 10:52", tint: "bg-teal-50 text-teal-600", sizeGb: 1.4, tags: ["交付", "项目", "验收"], updatedAt: "2024-06-30 18:05" },
  { id: "kb-knowledge", name: "行业报告库", desc: "行业研究报告、白皮书、趋势分析", count: 176, size: "3.2 GB", time: "08-05 14:28", tint: "bg-indigo-50 text-indigo-600", sizeGb: 3.2, tags: ["报告", "行业", "白皮书"], updatedAt: "2024-07-10 09:20" },
];

function read(): KbRow[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as KbRow[];
  } catch {}
  try {
    localStorage.setItem(KEY, JSON.stringify(SEED));
  } catch {}
  return SEED.slice();
}

function write(list: KbRow[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export function loadKnowledgeBases(): KbRow[] {
  return read();
}

export function saveKnowledgeBase(row: KbRow) {
  const list = read();
  const idx = list.findIndex((r) => r.id === row.id);
  if (idx >= 0) list[idx] = row;
  else list.unshift(row);
  write(list);
}

export function removeKnowledgeBase(id: string) {
  write(read().filter((r) => r.id !== id));
}

export function createKnowledgeBase(name: string): KbRow {
  const row: KbRow = {
    id: `kb-${Date.now()}`,
    name: name.trim() || "未命名知识库",
    desc: "新建知识库，等待上传文档与配置能力",
    count: 0,
    size: "0 B",
    time: "刚刚",
    tint: "bg-sky-50 text-sky-600",
    sizeGb: 0,
    tags: [],
    updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
  };
  saveKnowledgeBase(row);
  return row;
}

/** 统计汇总 */
export function summarize(list: KbRow[]) {
  return {
    total: list.length,
    docs: list.reduce((a, r) => a + r.count, 0),
    vectors: list.reduce((a, r) => a + r.count, 0),
    sizeGb: list.reduce((a, r) => a + r.sizeGb, 0),
  };
}
