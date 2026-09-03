import { createArtifactShare, type ArtifactShareKind } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS: ArtifactShareKind[] = ["slides", "docs", "image", "report"];

/** 创建产物公开分享：POST /api/shares { kind, data } -> { code, url } */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    kind?: string;
    data?: unknown;
  };
  if (!body.kind || !KINDS.includes(body.kind as ArtifactShareKind)) {
    return Response.json({ error: "不支持的分享类型" }, { status: 400 });
  }
  if (typeof body.data !== "object" || body.data === null) {
    return Response.json({ error: "分享内容无效" }, { status: 400 });
  }
  const code = createArtifactShare(body.kind as ArtifactShareKind, body.data as Record<string, unknown>);
  return Response.json({ code, url: `/s/${code}` });
}
