import { repo } from "@/lib/db/repo";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 列表：GET /api/knowledge（含真实统计：文档数 / 大小） */
export async function GET() {
  const bases = repo.listKnowledgeBases();
  const totalSize = bases.reduce((a, b) => a + b.totalSize, 0);
  return Response.json({ bases, totalSize });
}

/** 创建：POST { name, desc?, tags? } */
export async function POST(req: Request) {
  const body = (await req.json()) as { name?: string; desc?: string; tags?: string[] };
  const name = (body.name ?? "").trim();
  if (!name) return Response.json({ error: "名称不能为空" }, { status: 400 });
  const id = `kb-${Date.now()}-${randomUUID().slice(0, 8)}`;
  repo.createKnowledgeBase({
    id,
    name: name.slice(0, 40),
    desc: (body.desc ?? "").trim().slice(0, 200),
    tags: Array.isArray(body.tags) ? body.tags.slice(0, 8).map((t) => String(t).trim().slice(0, 20)).filter(Boolean) : [],
    createdAt: Date.now(),
  });
  repo.addNotification({
    type: "kb",
    title: `知识库「${name.slice(0, 40)}」已创建`,
    body: "把文档添加进知识库，即可让 AI 基于它回答问题",
    link: "/knowledge",
  });
  repo.addCredits(3, "创建知识库");
  return Response.json({ base: repo.getKnowledgeBase(id) });
}
