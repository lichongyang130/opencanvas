import { repo } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 公开分享页数据：GET /api/agents/share/:code */
export async function GET(_req: Request, props: { params: Promise<{ code: string }> }) {
  const params = await props.params;
  const agent = repo.getAgentByShareCode(params.code);
  if (!agent) return Response.json({ error: "分享不存在或已取消" }, { status: 404 });
  return Response.json({
    agent: {
      id: agent.id,
      name: agent.name,
      desc: agent.desc,
      category: agent.category,
      emoji: agent.emoji,
      system: agent.system,
      starter: agent.starter,
      shared: agent.shared,
      shareCode: agent.shareCode,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    },
  });
}
