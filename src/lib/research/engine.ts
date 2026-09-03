import { streamChatCompletion, type ChatMessage, type ProviderOverrides } from "@/lib/gateway";
import { buildSampleReport } from "./sample-report";
import type { ResearchReport, ResearchSource } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface RunOptions {
  model: string;
  overrides?: ProviderOverrides;
  tavilyKey?: string;
  /** 搜索深度：basic 快速检索 / advanced 深度检索 */
  depth?: "basic" | "advanced";
  /** 每次查询返回的来源数 */
  maxResults?: number;
  onProgress: (message: string) => void;
}

async function tavilySearch(
  query: string,
  key: string,
  depth: "basic" | "advanced" = "advanced",
  maxResults = 6
): Promise<ResearchSource[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      query,
      max_results: maxResults,
      search_depth: depth,
      include_answer: false,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`搜索服务错误 ${res.status}: ${t.slice(0, 150)}`);
  }
  const data = (await res.json()) as {
    results?: { title?: string; url?: string; content?: string }[];
  };
  return (data.results ?? [])
    .filter((r) => r.url)
    .map((r) => ({
      title: r.title ?? r.url ?? "未命名来源",
      url: r.url as string,
      snippet: (r.content ?? "").slice(0, 280),
    }));
}

/** 收集流式回复为完整文本 */
async function completeChat(
  model: string,
  messages: ChatMessage[],
  overrides?: ProviderOverrides
): Promise<string> {
  let out = "";
  await streamChatCompletion(
    model,
    messages,
    { onToken: (d) => (out += d) },
    overrides
  );
  return out;
}

function extractJson(raw: string): Record<string, unknown> {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s !== -1 && e > s) text = text.slice(s, e + 1);
  return JSON.parse(text) as Record<string, unknown>;
}

export async function runResearch(topic: string, opts: RunOptions): Promise<ResearchReport> {
  const key = opts.tavilyKey || process.env.TAVILY_API_KEY;

  // —— 演示模式 ——
  if (!key) {
    const steps = [
      "正在拆解研究问题…",
      "正在联网搜索相关资料（演示模式：使用示例来源）…",
      "正在阅读并去重资料…",
      "正在撰写带引用的研究报告…",
    ];
    for (const s of steps) {
      opts.onProgress(s);
      await sleep(550);
    }
    return buildSampleReport(topic);
  }

  // —— 真实联网研究 ——
  const depth = opts.depth ?? "advanced";
  const maxResults = opts.maxResults ?? 6;
  opts.onProgress(depth === "advanced" ? "正在规划检索关键词…" : "正在规划快速检索…");
  const queries =
    depth === "advanced"
      ? [topic, `${topic} 市场规模 增长 趋势`, `${topic} 主要玩家 竞争 对比`, `${topic} 政策 趋势 机会`]
      : [topic, `${topic} 市场 竞争`];
  await sleep(300);

  opts.onProgress(depth === "advanced" ? "正在多路线联网搜索…" : "正在快速联网搜索…");
  const results = await Promise.all(
    queries.map((q) => tavilySearch(q, key, depth, maxResults).catch(() => [] as ResearchSource[]))
  );

  // 去重合并
  const seen = new Set<string>();
  const sources: ResearchSource[] = [];
  for (const r of results.flat()) {
    if (r.url && !seen.has(r.url)) {
      seen.add(r.url);
      sources.push(r);
    }
  }
  if (sources.length === 0) {
    opts.onProgress("未检索到结果，使用内置示例报告…");
    return buildSampleReport(topic);
  }
  opts.onProgress(`已获取 ${sources.length} 个来源，正在综述分析…`);

  const sourceList = sources
    .map((s, i) => `[${i + 1}] ${s.title} — ${s.snippet}`)
    .join("\n");

  const system = `你是资深行业研究分析师。基于给定的检索资料，为用户主题撰写一份中文深度研究报告。
要求：
1. 只输出一个 JSON 对象，不要 markdown 代码围栏或解释文字。
2. 结构：{"summary":"2-3句执行摘要","sections":[{"heading":"小节标题","body":"2-4句一段，事实性表述末尾用[n]标注来源"}],"takeaways":["关键结论1","关键结论2","关键结论3","关键结论4"]}
3. 4-6 个小节，覆盖：背景与规模、主要玩家/现状、核心能力或驱动因素、商业模式/成本、趋势与机会。
4. 引用必须来自给定来源编号，不要编造来源；资料不足时给出合理分析但不虚构精确数据。`;

  const user = `研究主题：${topic}\n\n检索资料：\n${sourceList}`;

  const raw = await completeChat(
    opts.model,
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    opts.overrides
  );

  let parsed: Record<string, unknown>;
  try {
    parsed = extractJson(raw);
  } catch {
    // 解析失败退化为示例结构 + 原文摘要
    return {
      ...buildSampleReport(topic),
      demo: false,
      sources,
      summary: raw.slice(0, 200),
    };
  }

  return {
    topic,
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    sections: Array.isArray(parsed.sections)
      ? (parsed.sections as unknown[])
          .map((x) => x as Record<string, unknown>)
          .filter((x) => x && typeof x.heading === "string")
          .map((x) => ({
            heading: String(x.heading),
            body: typeof x.body === "string" ? x.body : "",
          }))
      : [],
    takeaways: Array.isArray(parsed.takeaways)
      ? (parsed.takeaways as unknown[]).map(String)
      : [],
    sources,
    createdAt: Date.now(),
  };
}
