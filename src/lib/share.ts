import { getArtifactShare, getCaseShare, repo } from "@/lib/db/repo";
import type { SlideDeck } from "@/lib/slides/types";
import type { ResearchReport } from "@/lib/research/types";
import type { UIDoc, UIImage } from "@/lib/store/chat";

import { KIND_LABEL, type SharePayload } from "./share-types";
export { KIND_LABEL };
export type { SharePayload };

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

/** 按分享码解析任意类型分享（与 /api/shares/:code 同构） */
export function resolveShare(code: string): SharePayload | null {
  const agent = repo.getAgentByShareCode(code);
  if (agent) {
    return {
      kind: "agent",
      title: agent.name,
      description: truncate(agent.desc || "一个被分享的 AI 智能体", 120),
      data: {
        id: agent.id,
        name: agent.name,
        desc: agent.desc,
        category: agent.category,
        emoji: agent.emoji,
        system: agent.system,
        starter: agent.starter,
      },
    };
  }

  const artifact = getArtifactShare(code);
  if (artifact) {
    const d = artifact.data;
    if (artifact.kind === "slides") {
      const deck = d.deck as SlideDeck | undefined;
      return {
        kind: "slides",
        title: deck?.title ?? "PPT 演示文稿",
        description: truncate(
          deck ? `共 ${deck.slides.length} 页的演示文稿，可在线预览并下载 PPTX。` : "分享的演示文稿",
          120
        ),
        data: d,
      };
    }
    if (artifact.kind === "docs") {
      const doc = d.doc as UIDoc | undefined;
      return {
        kind: "docs",
        title: doc?.title ?? "文档产物",
        description: truncate((doc?.content ?? "").replace(/\s+/g, " ").slice(0, 100) || "分享的文档产物", 120),
        data: d,
      };
    }
    if (artifact.kind === "image") {
      const imgs = d.images as UIImage[] | undefined;
      return {
        kind: "image",
        title: (d.title as string) ?? "图片作品",
        description: `${imgs?.length ?? 0} 张 AI 生成图片`,
        data: d,
      };
    }
    if (artifact.kind === "report") {
      const report = d.report as ResearchReport | undefined;
      return {
        kind: "report",
        title: report?.topic ?? "研究报告",
        description: truncate(report?.summary ?? "", 120),
        data: d,
      };
    }
  }

  const template = repo.getTemplateByShareCode(code);
  if (template) {
    return {
      kind: "template",
      title: template.label,
      description: truncate(template.desc || template.prompt, 120),
      data: {
        id: template.id,
        label: template.label,
        desc: template.desc,
        category: template.category,
        mode: template.mode,
        prompt: template.prompt,
        author: template.author,
      },
    };
  }

  const caseShare = getCaseShare(code);
  if (caseShare) {
    return {
      kind: "case",
      title: caseShare.label || "真实案例",
      description: truncate(caseShare.output ?? "", 120),
      data: {
        code: caseShare.code,
        templateId: caseShare.templateId,
        label: caseShare.label,
        prompt: caseShare.prompt,
        values: caseShare.values,
        output: caseShare.output,
        image: caseShare.image,
        source: caseShare.source,
      },
    };
  }

  return null;
}
