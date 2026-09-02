import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

/** 文档类型识别（按扩展名） */
export function docTypeOf(ext: string): string {
  const e = ext.toLowerCase();
  if (e === "md" || e === "markdown") return "markdown";
  if (e === "txt" || e === "csv" || e === "json" || e === "log") return e === "csv" ? "csv" : "text";
  if (e === "pdf") return "pdf";
  if (e === "docx" || e === "doc") return "word";
  if (e === "xlsx" || e === "xls" || e === "csv") return "excel";
  if (e === "pptx" || e === "ppt") return "ppt";
  return "other";
}

/** 从文件 Buffer 提取纯文本（docx/pdf 用解析库；其余文本型直接 utf-8） */
export async function extractText(
  buf: Buffer,
  ext: string,
  mime: string
): Promise<{ text: string; supported: boolean }> {
  const e = ext.toLowerCase();

  // 文本类：直接解码
  if (["md", "markdown", "txt", "csv", "json", "log", "html", "htm", "xml", "yml", "yaml"].includes(e)) {
    return { text: buf.toString("utf-8"), supported: true };
  }

  // Word (.docx)
  if (e === "docx") {
    try {
      const mammoth = (await import("mammoth")).default;
      const res = await mammoth.extractRawText({ buffer: buf });
      return { text: res.value ?? "", supported: true };
    } catch {
      return { text: "", supported: false };
    }
  }

  // PDF
  if (e === "pdf") {
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const res = await pdfParse(buf);
      const text = (res.text ?? "").trim();
      return { text, supported: text.length > 0 };
    } catch {
      return { text: "", supported: false };
    }
  }

  // Excel / PPT / 其他：暂不解析
  if (mime.startsWith("text/")) return { text: buf.toString("utf-8"), supported: true };
  return { text: "", supported: false };
}

/** 保存上传文件本体到 data/uploads，返回路径（相对 data/） */
export function saveUploadFile(name: string, buf: Buffer): string {
  const dir = path.join(process.cwd(), "data", "uploads");
  mkdirSync(dir, { recursive: true });
  const safe = name.replace(/[^\w.\-\u4e00-\u9fa5]/g, "_").slice(0, 80);
  const file = `${Date.now()}-${randomUUID().slice(0, 8)}-${safe}`;
  writeFileSync(path.join(dir, file), buf);
  return `uploads/${file}`;
}

/** 通过扩展名推断真实 MIME（下载时用） */
export function mimeOf(ext: string): string {
  const m: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ppt: "application/vnd.ms-powerpoint",
    md: "text/markdown; charset=utf-8",
    txt: "text/plain; charset=utf-8",
    csv: "text/csv; charset=utf-8",
    json: "application/json",
  };
  return m[ext.toLowerCase()] ?? "application/octet-stream";
}

export function uploadExists(relPath: string): boolean {
  return existsSync(path.join(process.cwd(), "data", relPath));
}
