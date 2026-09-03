import { repo } from "@/lib/db/repo";
import { getUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PATCH：{ name?, desc?, tags?, semantic?, qa?, cite? }（能力开关持久化） */
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const uid = getUserFromRequest(req)?.id ?? null;
  const cur = repo.getKnowledgeBase(params.id, uid);
  if (!cur) return Response.json({ error: "知识库不存在" }, { status: 404 });
  const body = (await req.json()) as {
    name?: string;
    desc?: string;
    tags?: string[];
    semantic?: boolean;
    qa?: boolean;
    cite?: boolean;
  };
  const name = (body.name ?? "").trim();
  if (body.name !== undefined && !name) return Response.json({ error: "名称不能为空" }, { status: 400 });
  repo.updateKnowledgeBase(
    params.id,
    {
      name: body.name !== undefined ? name.slice(0, 40) : cur.name,
      desc: body.desc !== undefined ? (body.desc ?? "").trim().slice(0, 200) : cur.desc,
      tags: body.tags !== undefined ? body.tags.slice(0, 8) : cur.tags,
      semantic: body.semantic ?? cur.semantic,
      qa: body.qa ?? cur.qa,
      cite: body.cite ?? cur.cite,
    },
    uid
  );
  return Response.json({ base: repo.getKnowledgeBase(params.id, uid) });
}

/** DELETE：删除知识库（关联自动清理） */
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const uid = getUserFromRequest(req)?.id ?? null;
  const cur = repo.getKnowledgeBase(params.id, uid);
  if (!cur) return Response.json({ error: "知识库不存在" }, { status: 404 });
  repo.deleteKnowledgeBase(params.id, uid);
  return Response.json({ ok: true });
}
