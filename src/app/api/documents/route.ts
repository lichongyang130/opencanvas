import { repo, type StoredDocument } from "@/lib/db/repo";
import { getUserFromRequest } from "@/lib/auth";
import { docTypeOf, extractText, mimeOf, saveUploadFile, uploadExists } from "@/lib/docs/files";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 列表：GET /api/documents?q=&deleted=1 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const includeDeleted = url.searchParams.get("deleted") === "1";
  const uid = getUserFromRequest(req)?.id ?? null;
  const docs = repo.listDocuments(q, includeDeleted, uid);
  return Response.json({ documents: docs.map(toDto) });
}

/** 上传：POST multipart/form-data（files: File[]，多文件） */
export async function POST(req: Request) {
  const uid = getUserFromRequest(req)?.id ?? null;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "请使用 multipart/form-data 上传" }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return Response.json({ error: "未选择文件" }, { status: 400 });

  const MAX = 30 * 1024 * 1024; // 单文件 30MB
  const saved: StoredDocument[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (file.size > MAX) {
      errors.push(`${file.name}：超过 30MB 限制`);
      continue;
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
    const { text, supported } = await extractText(buf, ext, file.type);

    const doc: StoredDocument = {
      id: `${Date.now()}-${randomUUID().slice(0, 8)}`,
      name: file.name,
      type: docTypeOf(ext),
      size: file.size,
      ext,
      content: supported ? text : "",
      filePath: supported ? saveUploadFile(file.name, buf) : null,
      tags: [],
      favorite: false,
      deleted: false,
      userId: uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    repo.createDocument(doc);
    saved.push(doc);
    if (!supported) errors.push(`${file.name}：已登记，暂不支持正文预览（可外部打开）`);
  }

  if (saved.length > 0) {
    repo.addNotification({
      type: "doc",
      title: `已上传 ${saved.length} 个文档`,
      body: saved.map((d) => d.name).join("、").slice(0, 60),
      link: "/docs",
      userId: uid,
    });
    repo.addCredits(5 * saved.length, "上传文档", null, uid);
  }

  return Response.json({
    documents: saved.map(toDto),
    errors: errors.length ? errors : undefined,
  });
}

/** 详情：GET /api/documents/[id] 在动态路由处理；此处仅作为占位返回 404 语义 */
export async function PATCH(req: Request) {
  const uid = getUserFromRequest(req)?.id ?? null;
  const body = (await req.json()) as { id?: string; name?: string; favorite?: boolean; tags?: string[]; restore?: boolean };
  if (!body.id) return Response.json({ error: "缺少 id" }, { status: 400 });
  const cur = repo.getDocument(body.id, uid);
  if (!cur) return Response.json({ error: "文档不存在" }, { status: 404 });
  repo.updateDocument(
    body.id,
    {
      name: body.name ?? cur.name,
      favorite: body.favorite ?? cur.favorite,
      tags: body.tags ?? cur.tags,
      deleted: body.restore ? false : cur.deleted,
    },
    uid
  );
  return Response.json({ document: toDto(repo.getDocument(body.id, uid)!) });
}

function toDto(d: StoredDocument) {
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
  };
}
