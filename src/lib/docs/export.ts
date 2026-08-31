/** 文档导出：Markdown 与 Word(.doc) */

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  let h = esc(s);
  h = h.replace(/`([^`]+)`/g, "<code>$1</code>");
  h = h.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  h = h.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return h;
}

/** 轻量 Markdown → HTML（用于 Word 导出与预览可复用） */
export function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const html: string[] = [];
  let list: "ul" | "ol" | null = null;
  const closeList = () => {
    if (list) {
      html.push(`</${list}>`);
      list = null;
    }
  };
  for (const raw of lines) {
    const line = raw;
    if (/^\s*[-*•]\s+/.test(line)) {
      if (list !== "ul") {
        closeList();
        html.push("<ul>");
        list = "ul";
      }
      html.push(`<li>${inline(line.replace(/^\s*[-*•]\s+/, ""))}</li>`);
    } else if (/^\s*\d+[.)]\s+/.test(line)) {
      if (list !== "ol") {
        closeList();
        html.push("<ol>");
        list = "ol";
      }
      html.push(`<li>${inline(line.replace(/^\s*\d+[.)]\s+/, ""))}</li>`);
    } else {
      closeList();
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        const level = h[1].length;
        html.push(`<h${level}>${inline(h[2])}</h${level}>`);
      } else if (line.trim() === "") {
        // 空行忽略（段落间距由样式控制）
      } else {
        html.push(`<p>${inline(line)}</p>`);
      }
    }
  }
  closeList();
  return html.join("\n");
}

export function downloadMarkdown(title: string, md: string) {
  const name = (title || "document").replace(/[\\/:*?"<>|]/g, "_").slice(0, 60);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/** 导出为 Word 可打开的 .doc（HTML 内核） */
export function downloadWord(title: string, md: string) {
  const name = (title || "document").replace(/[\\/:*?"<>|]/g, "_").slice(0, 60);
  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
body{font-family:'Microsoft YaHei',sans-serif;line-height:1.8;color:#1c1917;}
h1{font-size:24px;} h2{font-size:19px;margin-top:18px;} h3{font-size:16px;}
p{margin:6px 0;} code{background:#f5f5f4;padding:1px 4px;border-radius:3px;}
</style></head>
<body>${markdownToHtml(md)}</body></html>`;
  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
