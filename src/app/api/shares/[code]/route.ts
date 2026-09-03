import { getArtifactShare, getCaseShare, repo } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 分享码统一解析：GET /api/shares/:code
 * 依序探测：智能体 → 产物（PPT/文档/图片/报告）→ 提示词模板 → 案例（legacy）
 * 返回 { kind, ...payload }，前端 /s/:code 只调这一个接口。
 */
export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const agent = repo.getAgentByShareCode(params.code);
  if (agent) {
    return Response.json({
      kind: "agent",
      agent: {
        id: agent.id,
        name: agent.name,
        desc: agent.desc,
        category: agent.category,
        emoji: agent.emoji,
        system: agent.system,
        starter: agent.starter,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      },
    });
  }

  const artifact = getArtifactShare(params.code);
  if (artifact) {
    return Response.json({ kind: artifact.kind, data: artifact.data });
  }

  const template = repo.getTemplateByShareCode(params.code);
  if (template) {
    return Response.json({
      kind: "template",
      template: {
        id: template.id,
        label: template.label,
        desc: template.desc,
        category: template.category,
        mode: template.mode,
        prompt: template.prompt,
        author: template.author,
      },
    });
  }

  const caseShare = getCaseShare(params.code);
  if (caseShare) {
    return Response.json({ kind: "case", case: caseShare });
  }

  return Response.json({ error: "分享不存在或已取消" }, { status: 404 });
}
