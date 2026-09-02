/**
 * 本地 RAG 检索引擎（零外部依赖）。
 * 中文按 2-gram 切词 + 停用词过滤，英文按整词；文档打分 = 关键词命中加权，
 * 命中窗口取「关键词最密集区域」，返回带来源的真实片段。
 * 生产环境可替换为 Embedding 向量检索（接口保持不变）。
 */

export interface KbSearchDoc {
  id: string;
  name: string;
  content: string;
}

export interface KbSearchHit {
  docId: string;
  docName: string;
  snippet: string;
  score: number;
}

const STOP = new Set(
  "的了是在和与及或一个有我你他她它们这那也都还就很对到去上为从以而吧吗呢啊哦嗯呀么什么怎么如何哪个多少没有不不是要会将可可以应该能能够进行可以相关以及其中对于通过根据按照需要如果因为所以但是然而并且或者".split("")
);

/** 抽取查询关键词：中文 2-gram + 英文/数字词 */
function extractTerms(q: string): string[] {
  const terms: string[] = [];
  const push = (t: string) => {
    const s = t.trim().toLowerCase();
    if (s.length >= 2 && !STOP.has(s)) terms.push(s);
  };
  const cjk = q.match(/[\u4e00-\u9fa5]+/g) ?? [];
  for (const seg of cjk) {
    if (seg.length <= 2) {
      push(seg);
    } else {
      for (let i = 0; i < seg.length - 1; i++) push(seg.slice(i, i + 2));
      // 整段作为短语也参与加权
      terms.push(seg);
    }
  }
  const latin = q.match(/[A-Za-z0-9_]{2,}/g) ?? [];
  for (const w of latin) push(w);
  return terms;
}

function scoreDoc(content: string, terms: string[]): number {
  const lower = content.toLowerCase();
  let score = 0;
  for (const t of terms) {
    const count = lower.split(t).length - 1;
    if (count > 0) score += count * (t.length >= 4 ? 2 : 1);
  }
  return score;
}

/** 在文档中找关键词最密集的片段（窗口 260 字符） */
function bestSnippet(content: string, terms: string[]): string {
  const lower = content.toLowerCase();
  // 记录每个关键词的全部命中位置
  const positions: number[] = [];
  for (const t of terms) {
    let idx = lower.indexOf(t);
    while (idx !== -1 && positions.length < 200) {
      positions.push(idx);
      idx = lower.indexOf(t, idx + 1);
    }
  }
  if (positions.length === 0) return content.slice(0, 260);

  // 以「最密集命中簇」中心为片段起点
  positions.sort((a, b) => a - b);
  const WINDOW = 260;
  const start = Math.max(0, Math.min(positions[0] - Math.round(WINDOW * 0.35), content.length - WINDOW));
  const end = Math.min(content.length, start + WINDOW);
  let snippet = content.slice(start, end).replace(/\s+/g, " ").trim();
  // 尽量从句子边界开始
  const sentenceStart = snippet.search(/[。！？\n]/) + 1;
  if (sentenceStart > 0 && sentenceStart < snippet.length - 60) snippet = snippet.slice(sentenceStart);
  return snippet.length > 300 ? snippet.slice(0, 300) + "…" : snippet;
}

/* ------------------------------------------------------------------ */
/* 语义向量化（零外部依赖）：TF-IDF + cosine。                          */
/* 每个文档按 2-gram/英文词切分 → 词频 → IDF 加权 → 单位向量；          */
/* 查询同样向量化后与文档求 cosine，与关键词命中分数融合排序。          */
/* 生产环境可在不改接口的前提下替换为 Embedding 向量检索。             */
/* ------------------------------------------------------------------ */

type Vec = Map<string, number>;

function tokenize(content: string): string[] {
  const out: string[] = [];
  const cjk = content.match(/[\u4e00-\u9fa5]+/g) ?? [];
  for (const seg of cjk) {
    if (seg.length <= 2) {
      out.push(seg);
    } else {
      for (let i = 0; i < seg.length - 1; i++) out.push(seg.slice(i, i + 2));
    }
  }
  const latin = content.match(/[A-Za-z0-9_]{2,}/g) ?? [];
  for (const w of latin) out.push(w.toLowerCase());
  return out;
}

function buildVec(tokens: string[], df: Map<string, number>, total: number): Vec {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  const v: Vec = new Map();
  let norm = 0;
  for (const [term, freq] of tf) {
    const idf = Math.log(1 + total / (1 + (df.get(term) ?? 0)));
    const w = (1 + Math.log(freq)) * idf;
    v.set(term, w);
    norm += w * w;
  }
  const n = Math.sqrt(norm) || 1;
  for (const [term, w] of v) v.set(term, w / n);
  return v;
}

function cosine(a: Vec, b: Vec): number {
  let sum = 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const [term, w] of small) {
    const w2 = large.get(term);
    if (w2) sum += w * w2;
  }
  return sum;
}

/** TF-IDF 语义检索：返回 [docId, cosine 分数] 前 topK */
function semanticRetrieve(docs: KbSearchDoc[], question: string, topK: number): { id: string; score: number }[] {
  if (docs.length === 0) return [];
  const tokenized = docs.map((d) => tokenize(d.content));
  const df = new Map<string, number>();
  for (const tokens of tokenized) {
    for (const t of new Set(tokens)) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const total = docs.length;
  const qVec = buildVec(tokenize(question), df, total);
  const scored = docs
    .map((d, i) => ({ id: d.id, score: cosine(qVec, buildVec(tokenized[i], df, total)) }))
    .filter((x) => x.score > 0.02)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  return scored;
}

export function retrieve(docs: KbSearchDoc[], question: string, topK = 3): KbSearchHit[] {
  // 1) 语义向量分
  const semantic = semanticRetrieve(docs, question, topK * 2);
  const semScore = new Map(semantic.map((s) => [s.id, s.score]));
  // 2) 关键词命中分（保留精确匹配的强信号）
  const terms = extractTerms(question);
  const kwScore = new Map<string, number>();
  for (const d of docs) {
    const s = scoreDoc(d.content, terms);
    if (s > 0) kwScore.set(d.id, s);
  }
  // 3) 融合：语义 0-1 归一 *100 + 关键词加权（同义改写靠语义，精确实体靠关键词）
  const scored = docs
    .map((d) => {
      const sem = semScore.get(d.id) ?? 0;
      const kw = kwScore.get(d.id) ?? 0;
      return { doc: d, score: Math.round((sem * 100 + kw * 1.5) * 10) / 10 };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  if (scored.length === 0) return [];
  return scored.map((x) => ({
    docId: x.doc.id,
    docName: x.doc.name,
    snippet: bestSnippet(x.doc.content, terms.length > 0 ? terms : tokenize(question)),
    score: x.score,
  }));
}

/** 无命中时返回最近文档开头片段（保证「引用来源」能力始终可用） */
export function fallbackSnippet(docs: KbSearchDoc[], limit = 2): KbSearchHit[] {
  return docs.slice(0, limit).map((d) => ({
    docId: d.id,
    docName: d.name,
    snippet: d.content.slice(0, 260).replace(/\s+/g, " ").trim(),
    score: 0,
  }));
}

/** 把命中片段拼成可注入 LLM 的上下文 */
export function buildContext(hits: KbSearchHit[]): string {
  return hits
    .map((h, i) => `【资料${i + 1}｜${h.docName}】\n${h.snippet}`)
    .join("\n\n")
    .trim();
}
