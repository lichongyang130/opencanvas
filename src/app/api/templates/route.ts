import { repo, type StoredTemplate } from "@/lib/db/repo";
import { getUserFromRequest } from "@/lib/auth";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 列表：GET /api/templates（用户提交的共享模板） */
export async function GET() {
  return Response.json({ templates: repo.listTemplates().map(toDto) });
}

/** 提交模板：POST { label, desc, category, mode, prompt } */
export async function POST(req: Request) {
  const uid = getUserFromRequest(req)?.id ?? null;
  const body = (await req.json()) as {
    label?: string;
    desc?: string;
    category?: string;
    mode?: string;
    prompt?: string;
  };
  const label = (body.label ?? "").trim();
  const prompt = (body.prompt ?? "").trim();
  if (!label || !prompt) {
    return Response.json({ error: "名称与提示词不能为空" }, { status: 400 });
  }
  if (prompt.length > 4000) {
    return Response.json({ error: "提示词过长（最多 4000 字）" }, { status: 400 });
  }
  const t: StoredTemplate = {
    id: `u-${Date.now()}-${randomUUID().slice(0, 8)}`,
    label: label.slice(0, 60),
    desc: (body.desc ?? "").trim().slice(0, 160),
    category: body.category ?? "productivity",
    mode: body.mode ?? "chat",
    prompt,
    author: "我",
    uses: 0,
    shared: false,
    shareCode: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  repo.createTemplate(t);
  repo.addNotification({
    type: "template",
    title: `模板「${label.slice(0, 40)}」已提交`,
    body: "已上架到共享模板库，可在模板中心使用",
    link: "/templates",
    userId: uid,
  });
  repo.addCredits(3, "提交模板", null, uid);
  return Response.json({ template: toDto(t) });
}

function toDto(t: StoredTemplate) {
  return {
    id: t.id,
    label: t.label,
    desc: t.desc,
    category: t.category,
    mode: t.mode,
    prompt: t.prompt,
    author: t.author,
    uses: t.uses,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}
