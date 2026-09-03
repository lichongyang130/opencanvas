#!/usr/bin/env node
/**
 * i18n-tt 包裹器：把文件里的「静态中文 UI 文案」包成 tt()。
 * 规则：
 *  1. 只处理指定文件（参数），跳过注释行与已含 tt(/t( 的行
 *  2. JSX 属性：placeholder="中文" / title="中文" / aria-label="中文" → {tt("中文")}
 *  3. 字符串字面量（纯中文、无插值、长度<=60）→ tt("中文")
 *  4. JSX 文本节点 >中文< → {tt("中文")}
 *  5. 使用次数>0 时自动补 useI18n import / const { tt } 声明
 * 用法：node scripts/i18n-wrap.mjs <file> [file...]
 */
import { readFileSync, writeFileSync, existsSync } from "fs";

const FILES = process.argv.slice(2);
const isComment = (line) =>
  /^\s*(\/\/|\/\*|\*|\*\/|<!--)/.test(line) || /^\s*import /.test(line);

/** 清理双重包裹 + 自动补 useI18n 入门 */
function ensureI18n(text) {
  text = text.replace(/tt\(\s*tt\(\s*(("(?:[^"\\]|\\.)*"))\s*\)\s*\)/g, "tt($1)");
  if (/\btt\s*\(/.test(text) && !text.includes("useI18n")) {
    const lines = text.split("\n");
    let lastImport = -1;
    lines.forEach((l, i) => {
      if (/^\s*import .*from .*;/.test(l)) lastImport = i;
    });
    if (lastImport >= 0) {
      lines.splice(lastImport + 1, 0, 'import { useI18n } from "@/lib/i18n";');
      text = lines.join("\n");
    }
  }
  if (/\btt\s*\(/.test(text)) {
    const hasCall = /useI18n\(\)/.test(text);
    if (hasCall) {
      if (!/const\s*\{\s*[^}]*\btt\b[^}]*\}\s*=\s*useI18n\(\)/.test(text)) {
        text = text.replace(
          /(const\s*\{\s*)([^}]*?)(\}\s*=\s*useI18n\(\))/,
          (m, a, b, c) => `${a}${b}${b.trim() ? ", " : ""}tt${c}`
        );
      }
    } else {
      const lines = text.split("\n");
      let idx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (/^(export (default )?function\s+\w|function\s+\w|const\s+\w+\s*=)/.test(lines[i])) {
          idx = i;
          break;
        }
      }
      if (idx >= 0) {
        for (let j = idx; j < lines.length; j++) {
          if (/\{\s*$/.test(lines[j])) {
            idx = j;
            break;
          }
        }
        if (!lines.slice(idx + 1, idx + 8).some((l) => /useI18n\(\)/.test(l))) {
          lines.splice(idx + 1, 0, "  const { tt } = useI18n();");
          text = lines.join("\n");
        }
      }
    }
  }
  return text;
}

let wrappedFiles = 0;
let wrappedCount = 0;

for (const f of FILES) {
  if (!existsSync(f)) continue;
  const src = readFileSync(f, "utf8");
  const lines = src.split("\n");
  const out = [];
  let fileCount = 0;

  for (const line of lines) {
    if (isComment(line) || /\btt\s*\(/.test(line)) {
      out.push(line);
      continue;
    }
    let l = line;

    // 1) JSX 属性：xxx="中文" → xxx={tt("中文")}
    l = l.replace(/(\b[\w-]+=)"([^"\n]*[\u4e00-\u9fff][^"\n]*)"(?![^=]*=)/g, (m, attr, val) => {
      if (val.includes("${") || val.length > 60) return m;
      wrappedCount++;
      fileCount++;
      return `${attr}{tt(${JSON.stringify(val)})}`;
    });

    // 2) 字符串字面量（单/双引号，纯中文无插值）
    l = l.replace(/(['"])((?:(?!\1)[\s\S])*?[\u4e00-\u9fff](?:(?!\1)[\s\S])*?)\1/g, (m, q, val) => {
      if (val.includes("${") || val.length > 60) return m;
      if (!/[\u4e00-\u9fff]/.test(val)) return m;
      wrappedCount++;
      fileCount++;
      return `tt(${JSON.stringify(val)})`;
    });

    // 3) JSX 文本节点 >中文< 或 >中文 </
    l = l.replace(/>([^<>{}\n]*[\u4e00-\u9fff][^<>{}\n]*)</g, (m, val) => {
      if (val.includes("$") || val.length > 60) return m;
      wrappedCount++;
      fileCount++;
      return `>{tt(${JSON.stringify(val.trim())})}<`;
    });

    out.push(l);
  }

  let text = ensureI18n(out.join("\n"));
  writeFileSync(f, text);
  if (fileCount > 0) {
    wrappedFiles++;
    console.log(`wrapped ${fileCount} in ${f}`);
  }
}
console.log(`\nDONE: files=${wrappedFiles} occurrences=${wrappedCount}`);
