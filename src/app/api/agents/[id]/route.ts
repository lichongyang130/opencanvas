import { repo } from "@/lib/db/repo";
import { getUserFromRequest } from "@/lib/auth";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PATCH：
 * - { action: "share" }   → 生成/返回分享链接（幂等）
 * - { action: "unshare" } → 取消分享
 * - 其他字段 → 更新智能体内容
 */
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const uid = getUserFromRequest(req)?.id ?? null;
  const body = (await req.json()) as {
    action?: "share" | "unshare";
    name?: string;
    desc?: string;
    category?: string;
    emoji?: string;
    system?: string;
    starter?: string;
  };
  const cur = repo.getAgent(params.id);
  if (!cur) return Response.json({ error: "智能体不存在" }, { status: 404 });

  if (body.action === "share") {
    const isNew = !(cur.shareCode && cur.shared);
    const code = isNew ? `s-${randomUUID().replace(/-/g, "").slice(0, 12)}` : cur.shareCode!;
    repo.updateAgent(params.id, { shared: true, shareCode: code });
    if (isNew) repo.addCredits(3, "分享智能体", null, uid);
    return Response.json({ ok: true, shareCode: code });
  }
  if (body.action === "unshare") {
    repo.updateAgent(params.id, { shared: false, shareCode: null });
    return Response.json({ ok: true });
  }

  const name = (body.name ?? "").trim();
  if (body.name !== undefined && !name) {
    return Response.json({ error: "名称不能为空" }, { status: 400 });
  }
  repo.updateAgent(params.id, {
    name: body.name !== undefined ? name.slice(0, 40) : cur.name,
    desc: body.desc !== undefined ? (body.desc ?? "").trim().slice(0, 200) : cur.desc,
    category: body.category ?? cur.category,
    emoji: body.emoji !== undefined ? (body.emoji ?? "🤖").slice(0, 8) : cur.emoji,
    system: body.system !== undefined ? (body.system ?? "").trim() : cur.system,
    starter: body.starter !== undefined ? (body.starter ?? "").trim().slice(0, 200) : cur.starter,
  });
  return Response.json({ agent: repo.getAgent(params.id) });
}

/** DELETE：删除自定义智能体 */
export async function DELETE(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const cur = repo.getAgent(params.id);
  if (!cur) return Response.json({ error: "智能体不存在" }, { status: 404 });
  repo.deleteAgent(params.id);
  return Response.json({ ok: true });
}
