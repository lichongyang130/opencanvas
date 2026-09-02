/** 代码沙箱工具：从 AI 回复中提取可运行的 HTML 页面 */

export interface CodeBlockResult {
  html: string;
  lang: string;
}

/** 提取 markdown 中第一个完整页面代码块（```html / ```jsx / 或含 <html 的块） */
export function extractPageHtml(markdown: string): CodeBlockResult | null {
  const fenceRe = /```([\w+-]*)\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  const candidates: CodeBlockResult[] = [];
  while ((m = fenceRe.exec(markdown)) !== null) {
    const lang = (m[1] || "").toLowerCase();
    const code = m[2].replace(/\n$/, "");
    if (
      lang === "html" ||
      lang === "htm" ||
      lang === "jsx" ||
      lang === "react" ||
      lang === "tsx" ||
      /<html[\s>]/i.test(code) ||
      /<!doctype html>/i.test(code)
    ) {
      candidates.push({ html: code, lang });
    }
  }
  if (candidates.length > 0) return candidates[0];

  // 无围栏时尝试整段提取 <html ...> ... </html>
  const raw = markdown.match(/<html[\s\S]*?<\/html>/i);
  if (raw) return { html: raw[0], lang: "html" };
  return null;
}

/** 把（可能只有 body 内容的）代码补全为完整 HTML 文档，保证 iframe 可独立渲染 */
export function toFullDocument(html: string): string {
  if (/<html[\s>]/i.test(html) || /<!doctype html>/i.test(html)) return html;
  const bodyMatch = html.match(/<body[\s\S]*?<\/body>/i);
  const body = bodyMatch ? bodyMatch[0] : html;
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;margin:0;padding:16px;color:#292524;background:#fff}</style></head><body>${body}</body></html>`;
}
