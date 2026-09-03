import { repo } from "@/lib/db/repo";
import { getUserFromRequest } from "@/lib/auth";
import { retrieve, fallbackSnippet, type KbSearchDoc, type KbSearchHit } from "@/lib/kb/search";
import { vectorRetrieve } from "@/lib/kb/vector";
import { embeddingConfigured } from "@/lib/gateway/embedding";
import type { ProviderOverrides } from "@/lib/gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * RAG 检索：POST /api/knowledge/:id/query { question, overrides? }
 * 检索链路：
 *  1. 配置了 Embedding 密钥（DASHSCOPE/OPENAI）→ 模型向量检索（文本切块 + 余弦）
 *  2. 未配置或 Embedding 失败 → 本地 TF-IDF + 关键词融合检索（零依赖降级）
 *  3. 无命中 → 最近文档片段兜底（保证引用来源能力）
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const uid = getUserFromRequest(req)?.id ?? null;
  const kb = repo.getKnowledgeBase(params.id, uid);
  if (!kb) return Response.json({ error: "知识库不存在" }, { status: 404 });
  const body = (await req.json()) as { question?: string; overrides?: ProviderOverrides };
  const question = (body.question ?? "").trim();
  if (!question) return Response.json({ error: "请输入问题" }, { status: 400 });
  if (question.length > 500) return Response.json({ error: "问题过长（最多 500 字）" }, { status: 400 });

  const docs: KbSearchDoc[] = repo
    .listKbDocuments(params.id, uid)
    .filter((d) => d.content && d.deleted !== true)
    .map((d) => ({ id: d.id, name: d.name, content: d.content }));

  if (docs.length === 0) {
    return Response.json({ hits: [], empty: true, message: "知识库还没有文档，先去添加一些吧" });
  }

  let hits: KbSearchHit[] = [];
  let engine: "embedding" | "tfidf" | "fallback" = "fallback";

  if (kb.semantic && embeddingConfigured(body.overrides)) {
    try {
      hits = await vectorRetrieve(docs, question, 3, body.overrides, { userId: uid });
      engine = hits.length > 0 ? "embedding" : "fallback";
    } catch {
      // Embedding 失败 → 本地降级
      hits = [];
    }
  }
  if (hits.length === 0 && kb.semantic) {
    hits = retrieve(docs, question, 3);
    engine = hits.length > 0 ? "tfidf" : "fallback";
  }
  const finalHits = hits.length > 0 ? hits : fallbackSnippet(docs, 2);

  return Response.json({ hits: finalHits, empty: false, engine });
}
