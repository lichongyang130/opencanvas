import { repo } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 库内文档：GET /api/knowledge/:id/documents */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!repo.getKnowledgeBase(params.id)) {
    return Response.json({ error: "知识库不存在" }, { status: 404 });
  }
  return Response.json({ documents: repo.listKbDocuments(params.id) });
}

/** 关联文档：POST { documentId } */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = (await req.json()) as { documentId?: string };
  if (!body.documentId) return Response.json({ error: "缺少 documentId" }, { status: 400 });
  if (!repo.getKnowledgeBase(params.id)) {
    return Response.json({ error: "知识库不存在" }, { status: 404 });
  }
  const ok = repo.addKbDocument(params.id, body.documentId);
  if (!ok) return Response.json({ error: "文档不存在" }, { status: 404 });
  return Response.json({ ok: true, documents: repo.listKbDocuments(params.id) });
}

/** 移除关联：DELETE { documentId } */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const body = (await req.json().catch(() => ({}))) as { documentId?: string };
  if (!body.documentId) return Response.json({ error: "缺少 documentId" }, { status: 400 });
  repo.removeKbDocument(params.id, body.documentId);
  return Response.json({ ok: true, documents: repo.listKbDocuments(params.id) });
}
