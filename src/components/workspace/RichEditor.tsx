"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { marked } from "marked";
import TurndownService from "turndown";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Markdown → HTML（只用于把历史 markdown 载入编辑器） */
const mdToHtml = (md: string) => marked.parse(md, { async: false }) as string;

/** HTML → Markdown（编辑后回写，保持下游 AI/导出链路不变） */
const htmlToMd = (html: string) => {
  const td = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
  });
  // 代码块标记被 turndown 当作 pre>code，fenced 模式输出正确
  return td.turndown(html).replace(/\n{3,}/g, "\n\n").trim();
};

/**
 * 富文本 Markdown 编辑器（TipTap 所见即所得）。
 * 对外契约仍是 Markdown 字符串：进入时 md→html，编辑后 html→md 回写。
 */
export function RichEditor({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  className?: string;
}) {
  // 每次外部内容变化（AI 续写/切换会话）重新载入；编辑中收到的外部变更也接受（以外部为准）
  const lastEmitted = useRef("");
  // 仅初始载入一次（外部更新走下方 useEffect setContent）
  const [initHtml] = useState(() => mdToHtml(value || ""));
  const editor = useEditor({
    extensions: [StarterKit],
    content: initHtml,
    editorProps: {
      attributes: {
        class:
          "prose-doc min-h-[240px] w-full px-5 py-4 text-[13.5px] leading-7 text-stone-700 outline-none",
        placeholder: placeholder ?? "用富文本编辑，或在左侧对话里让 AI 生成…",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const md = htmlToMd(ed.getHTML());
      lastEmitted.current = md;
      onChange(md);
    },
  });

  // 外部价值变化：跳过自身回写
  useEffect(() => {
    if (!editor) return;
    if (value === lastEmitted.current) return;
    editor.commands.setContent(mdToHtml(value || ""));
    lastEmitted.current = value;
  }, [value, editor]);

  if (!editor) return null;

  const btn = (active: boolean) =>
    cn(
      "flex h-7 items-center gap-1 rounded-md px-2 text-[11px] transition",
      active ? "bg-brand-600 text-white" : "text-stone-500 hover:bg-stone-100"
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      {/* 工具栏 */}
      <div className="flex shrink-0 flex-wrap items-center gap-0.5 border-b border-stone-100 px-2 py-1.5">
        <button
          className={btn(editor.isActive("heading", { level: 1 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="标题 1"
        >
          <Heading1 className="h-3.5 w-3.5" />
        </button>
        <button
          className={btn(editor.isActive("heading", { level: 2 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="标题 2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </button>
        <span className="mx-1 h-4 w-px bg-stone-200" />
        <button
          className={btn(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="加粗"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          className={btn(editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="斜体"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          className={btn(editor.isActive("strike"))}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="删除线"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </button>
        <span className="mx-1 h-4 w-px bg-stone-200" />
        <button
          className={btn(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="无序列表"
        >
          <List className="h-3.5 w-3.5" />
        </button>
        <button
          className={btn(editor.isActive("orderedList"))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="有序列表"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>
        <button
          className={btn(editor.isActive("blockquote"))}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="引用"
        >
          <Quote className="h-3.5 w-3.5" />
        </button>
        <button
          className={btn(editor.isActive("codeBlock"))}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="代码块"
        >
          <Code className="h-3.5 w-3.5" />
        </button>
        <span className="mx-1 h-4 w-px bg-stone-200" />
        <button
          className={btn(false)}
          onClick={() => editor.chain().focus().undo().run()}
          title="撤销"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </button>
        <button
          className={btn(false)}
          onClick={() => editor.chain().focus().redo().run()}
          title="重做"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </button>
        <span className="ml-auto pr-1 text-[10px] text-stone-300">Markdown 保存</span>
      </div>

      {/* 编辑区 */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <EditorContent editor={editor} className={className} />
      </div>
    </div>
  );
}
