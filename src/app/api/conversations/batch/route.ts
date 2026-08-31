import { repo } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 批量操作。
 * POST { action: "archive" | "unarchive" | "delete", ids: string[] }
 */
export async function POST(req: Request) {
  const body = (await req.json()) as { action?: string; ids?: string[] };
  const ids = Array.isArray(body.ids) ? body.ids.filter((x) => typeof x === "string") : [];
  if (ids.length === 0 || !body.action) {
    return Response.json({ error: "参数不完整" }, { status: 400 });
  }

  if (body.action === "archive") repo.setArchivedBatch(ids, true);
  else if (body.action === "unarchive") repo.setArchivedBatch(ids, false);
  else if (body.action === "delete") repo.deleteConversations(ids);
  else return Response.json({ error: "未知操作" }, { status: 400 });

  return Response.json({ ok: true, count: ids.length });
}
