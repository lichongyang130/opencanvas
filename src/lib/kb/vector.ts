import { embedTexts } from "@/lib/gateway/embedding";
import type { ProviderOverrides } from "@/lib/gateway";
import type { KbSearchDoc, KbSearchHit } from "./search";

/**
 * Embedding 向量检索：文档按窗口切块 → 模型向量化 → 余弦相似度取 top。
 * 未配置 Embedding 密钥时调用方降级到本地 TF-IDF（search.ts 的 retrieve）。
 */

const CHUNK_LEN = 400;
const CHUNK_OVERLAP = 60;
const MAX_CHUNKS_PER_DOC = 16;
const BATCH = 32;

/** 简单内容指纹（缓存 key 用） */
function contentHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/** 窗口切块：优先按段落聚合，超长再滑动窗口 */
export function chunkText(
  content: string,
  maxLen = CHUNK_LEN,
  overlap = CHUNK_OVERLAP
): string[] {
  const paras = content
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let buf = "";
  for (const p of paras) {
    if (buf && buf.length + p.length + 1 > maxLen) {
      chunks.push(buf);
      buf = "";
    }
    if (p.length > maxLen) {
      for (let i = 0; i < p.length; i += maxLen - overlap) {
        chunks.push(p.slice(i, i + maxLen));
      }
      continue;
    }
    buf = buf ? `${buf}\n${p}` : p;
  }
  if (buf) chunks.push(buf);
  return chunks.length > 0 ? chunks : [content.slice(0, maxLen)];
}

/** 进程内向量缓存：key = docId:contentHash(text) → number[] */
const cache = new Map<string, number[]>();

function cosine(a: number[], b: number[]): number {
  let sum = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) sum += a[i] * b[i];
  return sum;
}

/** 向量化全部 chunk（批量 32，命中缓存跳过未变化块） */
async function embedChunks(
  chunks: { docId: string; text: string }[],
  overrides?: ProviderOverrides
): Promise<number[][]> {
  const out: number[][] = new Array(chunks.length);
  for (let i = 0; i < chunks.length; ) {
    const k = `${chunks[i].docId}:${contentHash(chunks[i].text)}`;
    const hit = cache.get(k);
    if (hit) {
      out[i] = hit;
      i += 1;
      continue;
    }
    // 收集一批 miss
    const missIdx: number[] = [];
    for (let j = i; j < chunks.length && missIdx.length < BATCH; j++) {
      const kk = `${chunks[j].docId}:${contentHash(chunks[j].text)}`;
      const h = cache.get(kk);
      if (h) out[j] = h;
      else missIdx.push(j);
    }
    if (missIdx.length > 0) {
      const res = await embedTexts(
        missIdx.map((j) => chunks[j].text),
        overrides
      );
      missIdx.forEach((j, n) => {
        const kk = `${chunks[j].docId}:${contentHash(chunks[j].text)}`;
        cache.set(kk, res.vectors[n]);
        out[j] = res.vectors[n];
      });
    }
    i += missIdx.length > 0 ? missIdx.length : 1;
  }
  return out;
}

/**
 * 向量检索：返回 topK 命中。Embedding 调用失败时抛错（调用方降级 TF-IDF）。
 */
export async function vectorRetrieve(
  docs: KbSearchDoc[],
  question: string,
  topK: number,
  overrides?: ProviderOverrides
): Promise<KbSearchHit[]> {
  const chunks: { docId: string; docName: string; text: string }[] = [];
  for (const d of docs) {
    const parts = chunkText(d.content).slice(0, MAX_CHUNKS_PER_DOC);
    for (const text of parts) chunks.push({ docId: d.id, docName: d.name, text });
  }
  if (chunks.length === 0) return [];

  const queryRes = await embedTexts([question], overrides);
  const qVec = queryRes.vectors[0];
  const chunkVecs = await embedChunks(chunks, overrides);

  const scored = chunks
    .map((c, i) => ({ c, score: cosine(qVec, chunkVecs[i] ?? []) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  // 同一文档只保留最佳块，避免重复来源
  const seen = new Set<string>();
  const hits: KbSearchHit[] = [];
  for (const s of scored) {
    if (seen.has(s.c.docId)) continue;
    seen.add(s.c.docId);
    hits.push({
      docId: s.c.docId,
      docName: s.c.docName,
      snippet: s.c.text.replace(/\s+/g, " ").trim().slice(0, 320) + (s.c.text.length > 320 ? "…" : ""),
      score: Math.round(s.score * 1000) / 10,
    });
  }
  return hits;
}
