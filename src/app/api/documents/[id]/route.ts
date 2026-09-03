import { repo } from "@/lib/db/repo";
import { getUserFromRequest } from "@/lib/auth";
import { mimeOf, readUploadFile } from "@/lib/docs/files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 详情 / 预览 / 下载 */
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const uid = getUserFromRequest(req)?.id ?? null;
  const doc = repo.getDocument(params.id, uid);
  if (!doc) return Response.json({ error: "文档不存在" }, { status: 404 });

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode");

  // 下载原文件（本地磁盘 / S3-R2 统一）
  if (mode === "download") {
    const buf = doc.filePath ? await readUploadFile(doc.filePath) : null;
    if (buf) {
      return new Response(new Uint8Array(buf), {
        headers: {
          "Content-Type": mimeOf(doc.ext),
          "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.name)}"`,
        },
      });
    }
    // 无原文件则回退为纯文本下载
    return new Response(doc.content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.name.replace(/\.[^.]+$/, "") + ".md")}"`,
      },
    });
  }

  return Response.json({ document: { ...dto(doc), content: doc.content, fileName: doc.name } });
}

/** PATCH：改内容 / 重命名 / 收藏 / 恢复（也支持直接编辑正文保存） */
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const uid = getUserFromRequest(req)?.id ?? null;
  const body = (await req.json()) as {
    name?: string;
    content?: string;
    favorite?: boolean;
    tags?: string[];
    restore?: boolean;
  };
  const cur = repo.getDocument(params.id, uid);
  if (!cur) return Response.json({ error: "文档不存在" }, { status: 404 });
  repo.updateDocument(
    params.id,
    {
      name: body.name ?? cur.name,
      content: body.content ?? cur.content,
      favorite: body.favorite ?? cur.favorite,
      tags: body.tags ?? cur.tags,
      deleted: body.restore ? false : cur.deleted,
    },
    uid
  );
  return Response.json({ document: dto(repo.getDocument(params.id, uid)!) });
}

/** DELETE：?hard=1 彻底删除（默认进回收站） */
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const uid = getUserFromRequest(req)?.id ?? null;
  const doc = repo.getDocument(params.id, uid);
  if (!doc) return Response.json({ error: "文档不存在" }, { status: 404 });
  const hard = new URL(req.url).searchParams.get("hard") === "1";
  repo.deleteDocument(params.id, hard, uid);
  return Response.json({ ok: true, hard });
}

function dto(d: Awaited<ReturnType<typeof repo.getDocument>> & { content?: string }) {
  return {
    id: d.id,
    name: d.name,
    type: d.type,
    size: d.size,
    ext: d.ext,
    tags: d.tags,
    favorite: d.favorite,
    deleted: d.deleted,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    content: d.content ?? "",
  };
}
