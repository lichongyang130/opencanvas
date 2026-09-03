import { repo, type StoredAgent } from "@/lib/db/repo";
import { getUserFromRequest } from "@/lib/auth";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 列表：GET /api/agents（用户创建的智能体 + 各角色真实使用次数） */
export async function GET() {
  return Response.json({
    agents: repo.listAgents().map(toDto),
    personaUses: repo.personaUseCounts(),
  });
}

/** 创建智能体：POST { name, desc, category, emoji, system, starter } */
export async function POST(req: Request) {
  const uid = getUserFromRequest(req)?.id ?? null;
  const body = (await req.json()) as {
    name?: string;
    desc?: string;
    category?: string;
    emoji?: string;
    system?: string;
    starter?: string;
  };
  const name = (body.name ?? "").trim();
  if (!name) {
    return Response.json({ error: "名称不能为空" }, { status: 400 });
  }
  if ((body.system ?? "").length > 8000) {
    return Response.json({ error: "系统提示词过长（最多 8000 字）" }, { status: 400 });
  }
  const now = Date.now();
  const a: StoredAgent = {
    id: `a-${now}-${randomUUID().slice(0, 8)}`,
    name: name.slice(0, 40),
    desc: (body.desc ?? "").trim().slice(0, 200),
    category: body.category ?? "自定义",
    emoji: (body.emoji ?? "🤖").slice(0, 8),
    system: (body.system ?? "").trim(),
    starter: (body.starter ?? "").trim().slice(0, 200),
    shared: false,
    shareCode: null,
    createdAt: now,
    updatedAt: now,
  };
  repo.createAgent(a);
  repo.addNotification({
    type: "agent",
    title: `智能体「${a.name}」已创建`,
    body: "配置系统提示词即可开始对话，也支持分享给他人",
    link: "/agents",
    userId: uid,
  });
  repo.addCredits(3, "创建智能体", null, uid);
  return Response.json({ agent: toDto(a) });
}

function toDto(a: StoredAgent) {
  return {
    id: a.id,
    name: a.name,
    desc: a.desc,
    category: a.category,
    emoji: a.emoji,
    system: a.system,
    starter: a.starter,
    shared: a.shared,
    shareCode: a.shareCode,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}
