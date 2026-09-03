"use client";

import { useEffect, useState } from "react";
import { Copy, Download, Star, Trash2, X } from "lucide-react";
import { formatSize, relativeTime, updateDocument, type DocRow } from "@/lib/documents";
import { downloadMarkdown, downloadWord } from "@/lib/docs/export";
import { toast } from "@/lib/store/toast";

const TYPE_LABEL: Record<string, string> = {
  word: "Word 文档",
  pdf: "PDF",
  excel: "表格",
  ppt: "演示文稿",
  image: "图片",
  text: "文本",
};

/** 文档详情 / 文本预览与编辑 / 导出 */
export function DocViewerModal({
  doc,
  folders,
  onChange,
  onClose,
}: {
  doc: DocRow | null;
  folders: string[];
  onChange: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setName(doc?.name ?? "");
    setContent(doc?.content ?? "");
    setEditing(false);
  }, [doc]);

  if (!doc) return null;

  const saveContent = () => {
    updateDocument(doc.id, { content });
    setEditing(false);
    onChange();
    toast("已保存", "success");
  };

  const saveName = () => {
    const n = name.trim();
    if (!n || n === doc.name) return;
    updateDocument(doc.id, { name: n });
    onChange();
    toast("已重命名", "success");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="w-full truncate rounded-lg px-1 py-0.5 text-[15px] font-semibold text-stone-800 outline-none hover:bg-stone-50 focus:bg-stone-50"
            />
            <p className="mt-0.5 px-1 text-[11.5px] text-stone-400">
              {TYPE_LABEL[doc.type]} · {formatSize(doc.sizeKb)} · {doc.owner} · {relativeTime(doc.updatedAt)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => {
                updateDocument(doc.id, { favorite: !doc.favorite });
                onChange();
                toast(doc.favorite ? "已取消收藏" : "已收藏", "success");
              }}
              title={doc.favorite ? "取消收藏" : "收藏"}
              className={`rounded-lg p-1.5 transition hover:bg-stone-100 ${doc.favorite ? "text-amber-400" : "text-stone-400"}`}
            >
              <Star className={`h-4 w-4 ${doc.favorite ? "fill-current" : ""}`} />
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="px-1 text-[12.5px] text-stone-500">{doc.desc}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2 px-1 text-[12px]">
          <span className="text-stone-400">文件夹</span>
          <select
            value={doc.folder}
            onChange={(e) => {
              updateDocument(doc.id, { folder: e.target.value });
              onChange();
              toast(`已移动到「${e.target.value}」`, "success");
            }}
            className="rounded-lg border border-stone-200 px-2 py-1 text-stone-600 outline-none"
          >
            {[...new Set([doc.folder, ...folders])].map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          {doc.tags.length > 0 && (
            <span className="flex flex-wrap gap-1">
              {doc.tags.map((t) => (
                <span key={t} className="rounded-md bg-[#fbf3ec] px-1.5 py-0.5 text-[11px] text-[#c05f3c]">
                  {t}
                </span>
              ))}
            </span>
          )}
        </div>

        {/* 正文 */}
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {doc.content !== undefined ? (
            editing ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={14}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 font-mono text-[12.5px] leading-6 outline-none focus:border-[#e0b79c]"
              />
            ) : (
              <pre className="whitespace-pre-wrap rounded-xl border border-stone-100 bg-[#fbf8f4] p-3.5 text-[12.5px] leading-6 text-stone-700">
                {doc.content || "（空文件）"}
              </pre>
            )
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-stone-200 px-4 py-10 text-center">
              <p className="text-[13px] text-stone-500">该文件类型暂不支持在线预览正文</p>
              <p className="text-[11.5px] text-stone-400">
                上传 .md / .txt / .csv / .json 等文本文件即可在此查看与编辑
              </p>
            </div>
          )}
        </div>

        {/* 操作 */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {doc.content !== undefined && (
              <>
                {editing ? (
                  <button
                    onClick={saveContent}
                    className="rounded-lg bg-stone-800 px-3.5 py-2 text-[12.5px] font-medium text-white hover:bg-stone-900"
                  >
                    保存修改
                  </button>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="rounded-lg border border-stone-200 px-3.5 py-2 text-[12.5px] text-stone-600 hover:bg-stone-50"
                  >
                    编辑正文
                  </button>
                )}
                <button
                  onClick={() => {
                    downloadWord(doc.name.replace(/\.[^.]+$/, ""), doc.content ?? "");
                    toast("已导出 Word", "success");
                  }}
                  className="flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-2 text-[12.5px] text-stone-600 hover:bg-stone-50"
                >
                  <Download className="h-3.5 w-3.5" /> Word
                </button>
                <button
                  onClick={() => {
                    downloadMarkdown(doc.name.replace(/\.[^.]+$/, ""), doc.content ?? "");
                    toast("已导出 Markdown", "success");
                  }}
                  className="flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-2 text-[12.5px] text-stone-600 hover:bg-stone-50"
                >
                  <Download className="h-3.5 w-3.5" /> MD
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(doc.content ?? "").then(
                      () => toast("已复制正文", "success"),
                      () => toast("复制失败", "error")
                    );
                  }}
                  className="flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-2 text-[12.5px] text-stone-600 hover:bg-stone-50"
                >
                  <Copy className="h-3.5 w-3.5" /> 复制
                </button>
              </>
            )}
          </div>
          <button
            onClick={() => {
              updateDocument(doc.id, { trashed: true });
              onChange();
              onClose();
              toast("已移入回收站", "info");
            }}
            className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-[12.5px] text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> 删除
          </button>
        </div>
      </div>
    </div>
  );
}
