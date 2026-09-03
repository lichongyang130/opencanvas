import { repo } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PATCH：uses+1（运行次数）或更新内容 */
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const body = (await req.json()) as { action?: "use"; label?: string; desc?: string; category?: string; mode?: string; prompt?: string };
  const cur = repo.getTemplate(params.id);
  if (!cur) return Response.json({ error: "模板不存在" }, { status: 404 });

  if (body.action === "use") {
    repo.incrTemplateUses(params.id);
    return Response.json({ ok: true, uses: cur.uses + 1 });
  }
  repo.updateTemplate(params.id, {
    label: body.label ?? cur.label,
    desc: body.desc ?? cur.desc,
    category: body.category ?? cur.category,
    mode: body.mode ?? cur.mode,
    prompt: body.prompt ?? cur.prompt,
  });
  return Response.json({ template: repo.getTemplate(params.id) });
}

/** DELETE：删除用户模板（内置模板为静态数据，不在库中） */
export async function DELETE(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const cur = repo.getTemplate(params.id);
  if (!cur) return Response.json({ error: "模板不存在" }, { status: 404 });
  repo.deleteTemplate(params.id);
  return Response.json({ ok: true });
}
