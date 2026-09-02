import { repo } from "@/lib/db/repo";
import { retrieve, fallbackSnippet, type KbSearchDoc, type KbSearchHit } from "@/lib/kb/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * RAG 检索：POST /api/knowledge/:id/query { question }
 * 对库内文档做本地关键词检索，返回 top 片段 + 得分 + 来源。
 * 与生成解耦：前端拿到 hits 后可自行调用 /api/chat 生成带引用的回答。
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const kb = repo.getKnowledgeBase(params.id);
  if (!kb) return Response.json({ error: "知识库不存在" }, { status: 404 });
  const body = (await req.json()) as { question?: string };
  const question = (body.question ?? "").trim();
  if (!question) return Response.json({ error: "请输入问题" }, { status: 400 });
  if (question.length > 500) return Response.json({ error: "问题过长（最多 500 字）" }, { status: 400 });

  const docs: KbSearchDoc[] = repo
    .listKbDocuments(params.id)
    .filter((d) => d.content && d.deleted !== true)
    .map((d) => ({ id: d.id, name: d.name, content: d.content }));

  if (docs.length === 0) {
    return Response.json({ hits: [], empty: true, message: "知识库还没有文档，先去添加一些吧" });
  }

  // 语义搜索开关关闭时降级为「最近文档片段」
  const hits: KbSearchHit[] = kb.semantic
    ? retrieve(docs, question, 3)
    : [];
  const finalHits = hits.length > 0 ? hits : fallbackSnippet(docs, 2);

  return Response.json({ hits: finalHits, empty: false });
}
