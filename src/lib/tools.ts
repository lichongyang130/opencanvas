import {
  BarChart3,
  Download,
  FileImage,
  FileText,
  GitBranch,
  KeyRound,
  Link2,
  ListChecks,
  MessageSquareQuote,
  Scissors,
  Send,
  Sparkles,
  Table2,
  Type,
  Upload,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * 工具箱注册表。
 * - local：纯前端计算，离线可用
 * - ai：调用 /api/chat 流式生成（未配密钥时走内置演示模型）
 * - watermark / share / task：用到浏览器或现有服务端的专项工具
 * - unsupported：确实依赖服务端/第三方能力，界面上会说明原因并给出替代方案
 */

export type ToolKind = "local" | "ai" | "watermark" | "share" | "task" | "unsupported";

export interface ToolResult {
  output: string;
  /** 结果下方的一行说明（如压缩率、去重条数） */
  note?: string;
  /** 需要渲染的 HTML（目前用于图表） */
  html?: string;
  /** 结果图片的 dataURL（水印工具） */
  image?: string;
  /** 下载建议扩展名 */
  ext?: string;
}

export interface ToolOption {
  label: string;
  choices: { value: string; label: string }[];
  default: string;
}

export interface ToolDef {
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  tint: string;
  bg: string;
  category: string;
  kind: ToolKind;
  /** 输入框占位提示 */
  hint: string;
  /** 运行按钮文案 */
  action?: string;
  /** kind=ai 的系统提示词 */
  system?: string;
  /** kind=local 的处理函数 */
  run?: (input: string, opt?: string) => ToolResult;
  /** 选项下拉（如转换目标格式） */
  option?: ToolOption;
  /** 预设示例，方便一键试用 */
  sample?: string;
  /** kind=unsupported 的原因与替代方案 */
  reason?: string;
  /** 替代方案的提示词（跳到对话用 AI 完成） */
  fallbackPrompt?: string;
}

/* ══════════════ 纯前端工具实现 ══════════════ */

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** 极简 Markdown → HTML */
function mdToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inList = false;
  let inCode = false;
  const inline = (t: string) =>
    esc(t)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("```")) {
      if (inCode) {
        out.push("</code></pre>");
        inCode = false;
      } else {
        if (inList) {
          out.push("</ul>");
          inList = false;
        }
        out.push("<pre><code>");
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      out.push(`${esc(line)}\n`);
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      const lv = h[1].length;
      out.push(`<h${lv}>${inline(h[2])}</h${lv}>`);
      continue;
    }
    const li = line.match(/^\s*[-*]\s+(.*)$/);
    if (li) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(li[1])}</li>`);
      continue;
    }
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
    if (!line.trim()) continue;
    out.push(`<p>${inline(line)}</p>`);
  }
  if (inCode) out.push("</code></pre>");
  if (inList) out.push("</ul>");
  return out.join("\n");
}

/** HTML → 纯文本/Markdown */
function htmlToText(html: string): string {
  let s = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/(h[1-6]|p|li|div|tr)>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
  return s
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** 压缩文本：去掉多余空行与行尾空格 */
function minifyText(input: string): ToolResult {
  const before = input.length;
  const out = input
    .split("\n")
    .map((l) => l.replace(/\s+$/, "").replace(/\s{2,}/g, " "))
    .filter((l, i, arr) => !(l.trim() === "" && arr[i - 1]?.trim() === ""))
    .join("\n")
    .trim();
  const saved = before ? Math.round(((before - out.length) / before) * 100) : 0;
  return {
    output: out,
    note: `原 ${before} 字符 → 现 ${out.length} 字符，减少 ${saved}%`,
  };
}

/** 文本统计 */
function textStats(input: string): ToolResult {
  const chars = input.length;
  const charsNoSpace = input.replace(/\s/g, "").length;
  const lines = input.split("\n").length;
  const paragraphs = input.split(/\n\s*\n/).filter((p) => p.trim()).length;
  const chinese = (input.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const words = (input.match(/[A-Za-z0-9_'-]+/g) ?? []).length;
  const freq = new Map<string, number>();
  for (const w of input.match(/[\u4e00-\u9fa5]{2,}|[A-Za-z][A-Za-z0-9'-]{1,}/g) ?? []) {
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  const lines10 = Math.max(1, lines);
  const report = [
    `字符数（含空格）：${chars}`,
    `字符数（不含空格）：${charsNoSpace}`,
    `中文字数：${chinese}`,
    `英文单词数：${words}`,
    `行数：${lines}`,
    `段落数：${paragraphs}`,
    `预计朗读时长：约 ${Math.max(1, Math.round(chinese / 300 + words / 180))} 分钟`,
    "",
    "高频词 Top15：",
    ...top.map(([w, n], i) => `${i + 1}. ${w} × ${n}`),
    "",
    `平均每行 ${(chars / lines10).toFixed(1)} 字符`,
  ].join("\n");
  return { output: report };
}

/** 去重：保留首次出现顺序 */
function dedupeLines(input: string): ToolResult {
  const lines = input.split("\n");
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const l of lines) {
    const k = l.trim();
    if (!k) {
      kept.push(l);
      continue;
    }
    if (seen.has(k)) continue;
    seen.add(k);
    kept.push(l);
  }
  return {
    output: kept.join("\n"),
    note: `原 ${lines.length} 行 → 现 ${kept.length} 行，去重 ${lines.length - kept.length} 行`,
  };
}

function splitTable(input: string): string[][] {
  const rows: string[][] = [];
  for (const raw of input.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (/^\|?[\s:-]*\|[\s:|-]*$/.test(line) && line.includes("-")) continue; // 分隔行
    const cells = line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split(/\t|\||,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
      .map((c) => c.trim().replace(/^"(.*)"$/, "$1"));
    rows.push(cells);
  }
  return rows;
}

function mdToCsv(input: string): ToolResult {
  const rows = splitTable(input);
  if (rows.length === 0) return { output: "", note: "没有解析到表格内容" };
  const csv = rows
    .map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(","))
    .join("\n");
  return { output: csv, note: `共 ${rows.length} 行 ${Math.max(...rows.map((r) => r.length))} 列`, ext: "csv" };
}

function csvToMd(input: string): ToolResult {
  const rows = splitTable(input);
  if (rows.length === 0) return { output: "", note: "没有解析到表格内容" };
  const cols = Math.max(...rows.map((r) => r.length));
  const head = rows[0];
  const body = rows.slice(1);
  const line = (cells: string[]) => `| ${Array.from({ length: cols }, (_, i) => cells[i] ?? "").join(" | ")} |`;
  const md = [line(head), `| ${Array.from({ length: cols }, () => "---").join(" | ")} |`, ...body.map(line)].join("\n");
  return { output: md, note: `共 ${body.length} 行数据 / ${cols} 列`, ext: "md" };
}

function toJson(input: string): ToolResult {
  const rows = splitTable(input);
  if (rows.length < 2) return { output: JSON.stringify(rows, null, 2), note: "未识别到表头，按原始行导出" };
  const head = rows[0];
  const data = rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h || `col${i + 1}`, r[i] ?? ""])));
  return { output: JSON.stringify(data, null, 2), note: `共 ${data.length} 条记录`, ext: "json" };
}

/** 数据可视化：每行「名称,数值」→ SVG 柱状图 */
function barChart(input: string): ToolResult {
  const rows = input
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.split(/[,，\t]/).map((s) => s.trim());
      if (m.length < 2) {
        const m2 = l.match(/^(.*?)[\s:：]+(-?\d+(?:\.\d+)?)$/);
        return m2 ? { label: m2[1], value: Number(m2[2]) } : null;
      }
      const value = Number(m[m.length - 1].replace(/[^\d.-]/g, ""));
      if (Number.isNaN(value)) return null;
      return { label: m.slice(0, -1).join(" "), value };
    })
    .filter((x): x is { label: string; value: number } => Boolean(x));

  if (rows.length === 0) {
    return { output: "", note: "没解析到数据，请每行写「名称,数值」，例如：北京,120" };
  }

  const W = 640;
  const rowH = 34;
  const H = rows.length * rowH + 40;
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1);
  const labelW = 120;
  const bars = rows
    .map((r, i) => {
      const y = i * rowH + 16;
      const w = Math.max(2, (Math.abs(r.value) / max) * (W - labelW - 90));
      return [
        `<text x="${labelW - 8}" y="${y + 15}" text-anchor="end" font-size="13" fill="#57534e">${esc(r.label)}</text>`,
        `<rect x="${labelW}" y="${y}" width="${w}" height="18" rx="4" fill="#f97316" opacity="0.85" />`,
        `<text x="${labelW + w + 8}" y="${y + 15}" font-size="12" fill="#78716c">${r.value}</text>`,
      ].join("");
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#fdfaf6" rx="12" />
  <text x="16" y="24" font-size="13" fill="#a8a29e">数据可视化 · 共 ${rows.length} 项，最大值 ${max}</text>
  ${bars}
</svg>`;
  return {
    output: rows.map((r) => `${r.label}\t${r.value}`).join("\n"),
    html: svg,
    note: `共 ${rows.length} 项数据，最大值 ${max}（可复制下方结果或直接下载 SVG）`,
  };
}

/** 文本版本快照（localStorage） */
const VERSION_KEY = "oc:tool-versions";
function saveVersion(input: string): ToolResult {
  if (!input.trim()) return { output: "", note: "请输入内容后再保存版本" };
  let list: { ts: number; len: number; head: string; text: string }[] = [];
  try {
    list = JSON.parse(localStorage.getItem(VERSION_KEY) ?? "[]");
  } catch {
    list = [];
  }
  list.unshift({
    ts: Date.now(),
    len: input.length,
    head: input.trim().split("\n")[0].slice(0, 30),
    text: input,
  });
  list = list.slice(0, 20);
  try {
    localStorage.setItem(VERSION_KEY, JSON.stringify(list));
  } catch {}
  const out = list
    .map(
      (v, i) =>
        `${i === 0 ? "●" : "○"} v${list.length - i} · ${new Date(v.ts).toLocaleString("zh-CN", { hour12: false })} · ${v.len} 字符 · ${v.head}`
    )
    .join("\n");
  return { output: out, note: `已保存 v${list.length}，共保留 ${list.length} 个版本（存于本机浏览器）` };
}

/* ══════════════ 注册表 ══════════════ */

export const TOOL_GROUPS: { title: string; tools: ToolDef[] }[] = [
  {
    title: "文档处理",
    tools: [
      {
        id: "format",
        name: "格式转换",
        desc: "Markdown / HTML / 纯文本互转",
        icon: FileText,
        tint: "text-blue-600",
        bg: "bg-blue-50",
        category: "文档处理",
        kind: "local",
        hint: "粘贴 Markdown、HTML 或纯文本…",
        sample: "# 标题\n这是一段 **加粗** 文字。\n\n- 要点一\n- 要点二",
        option: {
          label: "转换方向",
          default: "md2html",
          choices: [
            { value: "md2html", label: "Markdown → HTML" },
            { value: "html2md", label: "HTML → 纯文本" },
            { value: "md2text", label: "Markdown → 纯文本" },
          ],
        },
        run: (input, opt) => {
          if (opt === "html2md") return { output: htmlToText(input), ext: "txt" };
          if (opt === "md2text") return { output: htmlToText(mdToHtml(input)), ext: "txt" };
          return { output: mdToHtml(input), ext: "html", note: "已生成 HTML，可复制嵌入网页或下载" };
        },
      },
      {
        id: "pdf",
        name: "PDF 工具",
        desc: "合并、拆分、加密、压缩 PDF 文件",
        icon: FileText,
        tint: "text-red-500",
        bg: "bg-red-50",
        category: "文档处理",
        kind: "unsupported",
        hint: "",
        reason: "PDF 处理需要服务端渲染/加密引擎，当前版本未内置。",
        fallbackPrompt: "请把下面这份内容整理成结构清晰的 PDF 大纲（含标题层级与分页建议）：\n",
      },
      {
        id: "ocr",
        name: "图片转文字",
        desc: "提取图片中的文字内容",
        icon: FileImage,
        tint: "text-emerald-600",
        bg: "bg-emerald-50",
        category: "文档处理",
        kind: "unsupported",
        hint: "",
        reason: "OCR 需要服务端识别模型，当前版本未内置。",
        fallbackPrompt: "我需要把图片里的文字提取出来，请告诉我可行的步骤与推荐工具：",
      },
      {
        id: "compress",
        name: "文档压缩",
        desc: "去掉多余空白与空行，减小文本体积",
        icon: Scissors,
        tint: "text-violet-600",
        bg: "bg-violet-50",
        category: "文档处理",
        kind: "local",
        hint: "粘贴要压缩的文本…",
        sample: "第一段。\n\n\n第二段  里面有   多余空格。\n   \n第三段。",
        run: minifyText,
      },
      {
        id: "watermark",
        name: "水印添加",
        desc: "给图片加上文字水印后下载",
        icon: FileImage,
        tint: "text-orange-600",
        bg: "bg-orange-50",
        category: "文档处理",
        kind: "watermark",
        hint: "选择一张图片，填写水印文字后生成",
        action: "生成水印图",
      },
      {
        id: "docstats",
        name: "文档统计",
        desc: "统计字数、行数、段落与高频词",
        icon: Type,
        tint: "text-amber-600",
        bg: "bg-amber-50",
        category: "文档处理",
        kind: "local",
        hint: "粘贴要统计的文本…",
        sample: "人工智能正在改变内容创作的方式。内容创作也需要新的工具与流程。",
        run: textStats,
      },
    ],
  },
  {
    title: "内容创作",
    tools: [
      {
        id: "write",
        name: "智能写作",
        desc: "辅助撰写、修改、提升内容质量",
        icon: Sparkles,
        tint: "text-emerald-600",
        bg: "bg-emerald-50",
        category: "内容创作",
        kind: "ai",
        hint: "描述你想写的内容…",
        sample: "帮我写一篇关于「远程办公效率」的公众号文章开头",
        system:
          "你是资深内容创作者。根据用户要求直接产出高质量正文：结构清晰、有具体细节与例子，语言自然，不写空话套话，不要解释你的写作思路。",
      },
      {
        id: "polish",
        name: "内容润色",
        desc: "优化文字表达，提升可读性",
        icon: FileText,
        tint: "text-blue-600",
        bg: "bg-blue-50",
        category: "内容创作",
        kind: "ai",
        hint: "粘贴需要润色的文字…",
        sample: "这个产品非常好用，我们团队用了之后效率提升了很多，推荐大家也来用。",
        system:
          "你是文字编辑。请润色用户给的文字：让表达更流畅、准确、有分寸，保留原意与事实，不要新增虚构内容。只输出润色后的正文。",
      },
      {
        id: "summary",
        name: "摘要提取",
        desc: "自动提取文章、报告、文档要点",
        icon: FileText,
        tint: "text-sky-600",
        bg: "bg-sky-50",
        category: "内容创作",
        kind: "ai",
        hint: "粘贴长文，提取要点…",
        sample: "（在这里粘贴一篇长文）",
        system:
          "你是信息提炼专家。请输出：一句话摘要（不超过 40 字）+ 5-8 条要点（每条不超过 30 字，保留关键数据与结论）+ 可选的后续行动建议。不要复述原文。",
      },
      {
        id: "grammar",
        name: "语法检查",
        desc: "检查语法与拼写错误，纠正表达",
        icon: FileText,
        tint: "text-red-500",
        bg: "bg-red-50",
        category: "内容创作",
        kind: "ai",
        hint: "粘贴要检查的文字…",
        sample: "他昨天已经去过了那个地方，但是我们还没去了。",
        system:
          "你是中文校对编辑。请检查并修正文字中的错别字、语法问题、标点和表达不通顺之处。输出格式：先给「修改后全文」，再给「修改说明」列表（原文 → 改为 → 原因）。",
      },
      {
        id: "keywords",
        name: "关键词提取",
        desc: "自动提取关键词与标签",
        icon: Sparkles,
        tint: "text-violet-600",
        bg: "bg-violet-50",
        category: "内容创作",
        kind: "ai",
        hint: "粘贴文本，提取关键词…",
        sample: "（在这里粘贴文本）",
        system:
          "你是 SEO 与内容分析专家。请从文本中提取 8-12 个关键词/标签，按重要度排序，每个后附一句为什么重要（不超过 20 字）。用列表输出。",
      },
      {
        id: "abstract",
        name: "摘要生成",
        desc: "为你的内容生成一段摘要",
        icon: Sparkles,
        tint: "text-orange-600",
        bg: "bg-orange-50",
        category: "内容创作",
        kind: "ai",
        hint: "粘贴内容，生成一段摘要…",
        sample: "（在这里粘贴内容）",
        system:
          "请为下面的内容写一段 120 字左右的中文摘要，要求：客观准确、信息密度高、可直接作为导语使用。只输出摘要本身。",
      },
    ],
  },
  {
    title: "数据处理",
    tools: [
      {
        id: "table",
        name: "表格处理",
        desc: "CSV / Markdown 表格互转",
        icon: Table2,
        tint: "text-emerald-600",
        bg: "bg-emerald-50",
        category: "数据处理",
        kind: "local",
        hint: "粘贴 CSV 或 Markdown 表格…",
        sample: "城市,销量,同比\n北京,1200,8%\n上海,980,-3%\n广州,760,12%",
        option: {
          label: "转换方向",
          default: "csv2md",
          choices: [
            { value: "csv2md", label: "CSV → Markdown 表格" },
            { value: "md2csv", label: "Markdown 表格 → CSV" },
          ],
        },
        run: (input, opt) => (opt === "md2csv" ? mdToCsv(input) : csvToMd(input)),
      },
      {
        id: "chart",
        name: "数据可视化",
        desc: "把「名称,数值」变成柱状图",
        icon: BarChart3,
        tint: "text-sky-600",
        bg: "bg-sky-50",
        category: "数据处理",
        kind: "local",
        hint: "每行一条：名称,数值",
        sample: "北京,1200\n上海,980\n广州,760\n深圳,1140",
        run: barChart,
      },
      {
        id: "analyze",
        name: "数据分析",
        desc: "让 AI 解读数据并给出结论",
        icon: Sparkles,
        tint: "text-blue-600",
        bg: "bg-blue-50",
        category: "数据处理",
        kind: "ai",
        hint: "粘贴数据（表格/CSV 均可）…",
        sample: "月份,营收,成本\n1月,120,80\n2月,150,95\n3月,142,101",
        system:
          "你是数据分析师。请基于用户给出的数据做分析：先说数据讲了什么（趋势、异常、结构），再给 3-5 条可执行的建议。不要编造数据里没有的信息，不确定处明确说明。",
      },
      {
        id: "dedupe",
        name: "去重工具",
        desc: "删除重复行，保留原始顺序",
        icon: ListChecks,
        tint: "text-violet-600",
        bg: "bg-violet-50",
        category: "数据处理",
        kind: "local",
        hint: "粘贴多行文本…",
        sample: "张三\n李四\n张三\n王五\n李四",
        run: dedupeLines,
      },
      {
        id: "import",
        name: "数据导入",
        desc: "把 CSV / JSON 规整成表格",
        icon: Upload,
        tint: "text-amber-600",
        bg: "bg-amber-50",
        category: "数据处理",
        kind: "local",
        hint: "粘贴 CSV 或 JSON…",
        sample: 'name,score\nalice,92\nbob,78',
        run: (input) => {
          const t = input.trim();
          if (t.startsWith("[") || t.startsWith("{")) {
            try {
              const obj = JSON.parse(t) as unknown;
              const arr = Array.isArray(obj) ? obj : [obj];
              const cols = [...new Set(arr.flatMap((r) => Object.keys(r as Record<string, unknown>)))];
              const rows = [
                cols.join(" | "),
                cols.map(() => "---").join(" | "),
                ...arr.map((r) =>
                  cols.map((c) => String((r as Record<string, unknown>)[c] ?? "")).join(" | ")
                ),
              ];
              return { output: rows.join("\n"), note: `解析出 ${arr.length} 条记录 / ${cols.length} 个字段`, ext: "md" };
            } catch {
              return { output: "", note: "JSON 解析失败，请检查格式" };
            }
          }
          return csvToMd(input);
        },
      },
      {
        id: "export",
        name: "数据导出",
        desc: "把表格导出为 CSV / JSON / Markdown",
        icon: Download,
        tint: "text-orange-600",
        bg: "bg-orange-50",
        category: "数据处理",
        kind: "local",
        hint: "粘贴要导出的数据…",
        sample: "城市,销量\n北京,1200\n上海,980",
        option: {
          label: "导出格式",
          default: "csv",
          choices: [
            { value: "csv", label: "CSV" },
            { value: "json", label: "JSON" },
            { value: "md", label: "Markdown 表格" },
            { value: "txt", label: "纯文本" },
          ],
        },
        run: (input, opt) => {
          if (opt === "json") return toJson(input);
          if (opt === "md") return csvToMd(input);
          if (opt === "txt") return { output: input, ext: "txt" };
          return mdToCsv(input);
        },
      },
    ],
  },
  {
    title: "协作工具",
    tools: [
      {
        id: "team",
        name: "团队协作",
        desc: "多人协作编辑文档",
        icon: Users,
        tint: "text-blue-600",
        bg: "bg-blue-50",
        category: "协作工具",
        kind: "unsupported",
        hint: "",
        reason: "多人实时协作需要服务端账号与同步服务，当前版本未内置。",
        fallbackPrompt: "请帮我把下面这份内容整理成适合团队协作的版本（明确分工、待确认项与下一步）：\n",
      },
      {
        id: "comment",
        name: "评论批注",
        desc: "像编辑一样逐段给出批注",
        icon: MessageSquareQuote,
        tint: "text-violet-600",
        bg: "bg-violet-50",
        category: "协作工具",
        kind: "ai",
        hint: "粘贴需要批注的文稿…",
        sample: "（在这里粘贴文稿）",
        system:
          "你是资深主编。请对文稿逐段给出批注：每段先引用关键句，再从「亮点 / 问题 / 修改建议」三点点评，最后给一个总体评价与优先级最高的 3 条修改意见。语气专业直接。",
      },
      {
        id: "version",
        name: "版本管理",
        desc: "把当前内容存为新版本快照",
        icon: GitBranch,
        tint: "text-emerald-600",
        bg: "bg-emerald-50",
        category: "协作工具",
        kind: "local",
        hint: "输入内容后点「保存为新版本」…",
        sample: "v1 的初稿内容…",
        action: "保存为新版本",
        run: saveVersion,
      },
      {
        id: "perm",
        name: "权限管理",
        desc: "设置文档访问权限",
        icon: KeyRound,
        tint: "text-orange-600",
        bg: "bg-orange-50",
        category: "协作工具",
        kind: "unsupported",
        hint: "",
        reason: "权限体系依赖服务端账号与鉴权，当前版本未内置。",
        fallbackPrompt: "请帮我设计一份文档权限矩阵（角色 × 可读/可写/可分享/可管理）：",
      },
      {
        id: "share",
        name: "分享链接",
        desc: "生成一条可分享的内容链接",
        icon: Link2,
        tint: "text-sky-600",
        bg: "bg-sky-50",
        category: "协作工具",
        kind: "share",
        hint: "输入要分享的内容（提示词、结论、资料摘要等）…",
        sample: "为「AI 写作助手」写 5 条小红书种草文案，每条含标题、正文和标签。",
        action: "生成分享链接",
      },
      {
        id: "task",
        name: "活动任务",
        desc: "把这段描述变成一个 AI 任务",
        icon: Send,
        tint: "text-amber-600",
        bg: "bg-amber-50",
        category: "协作工具",
        kind: "task",
        hint: "描述要执行的任务…",
        sample: "整理本周工作并输出一份周报，包含进展、风险与下周计划",
        action: "创建并发起任务",
      },
    ],
  },
];

export const ALL_TOOLS: ToolDef[] = TOOL_GROUPS.flatMap((g) => g.tools);

export function findTool(id: string): ToolDef | undefined {
  return ALL_TOOLS.find((t) => t.id === id);
}
