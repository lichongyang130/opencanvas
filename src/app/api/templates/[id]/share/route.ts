import { repo } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 生成/复用模板独立分享码：POST /api/templates/:id/share -> { code, url, shared } */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const cur = repo.getTemplate(params.id);
  if (!cur) return Response.json({ error: "模板不存在" }, { status: 404 });
  const code = repo.shareTemplate(params.id);
  if (!code) return Response.json({ error: "生成分享码失败" }, { status: 500 });
  return Response.json({ code, url: `/s/${code}`, shared: true });
}

/** 取消分享：DELETE /api/templates/:id/share */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const cur = repo.getTemplate(params.id);
  if (!cur) return Response.json({ error: "模板不存在" }, { status: 404 });
  repo.unshareTemplate(params.id);
  return Response.json({ shared: false });
}
