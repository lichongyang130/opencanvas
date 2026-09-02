"use client";

import React from "react";

/**
 * 轻量 Markdown 渲染（无第三方依赖）：
 * 支持代码围栏、标题、有序/无序列表、加粗、行内代码、引用、换行。
 */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // 按 **bold**、`code`、![alt](url) 图片、[text](url) 链接切分
  const parts: React.ReactNode[] = [];
  const regex = /(!\[[^\]]*\]\((?:[^()]|\([^()]*\))*\)|\[[^\]]*\]\((?:[^()]|\([^()]*\))*\)|\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("![")) {
      const mm = tok.match(/^!\[([^\]]*)\]\((.+)\)$/);
      if (mm) {
        const url = mm[2].trim();
        const isData = url.startsWith("data:");
        parts.push(
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${keyPrefix}-img${i}`}
            src={url}
            alt={mm[1]}
            className={isData ? "my-1.5 max-h-64 rounded-lg border border-stone-100 object-contain" : "max-h-64 rounded-lg"}
          />
        );
        last = m.index + tok.length;
        i++;
        continue;
      }
    } else if (tok.startsWith("[")) {
      const mm = tok.match(/^\[([^\]]*)\]\((.+)\)$/);
      if (mm) {
        parts.push(
          <a key={`${keyPrefix}-a${i}`} href={mm[2]} target="_blank" rel="noreferrer" className="text-brand-600 underline decoration-brand-300 underline-offset-2 hover:text-brand-700">
            {mm[1]}
          </a>
        );
        last = m.index + tok.length;
        i++;
        continue;
      }
    } else if (tok.startsWith("**")) {
      parts.push(<strong key={`${keyPrefix}-b${i}`} className="font-semibold">{tok.slice(2, -2)}</strong>);
    } else {
      parts.push(
        <code key={`${keyPrefix}-c${i}`} className="rounded bg-stone-100 px-1 py-0.5 text-[0.85em] text-brand-700">
          {tok.slice(1, -1)}
        </code>
      );
    }
    last = m.index + tok.length;
    i++;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function Markdown({ content }: { content: string }) {
  const blocks = content.split(/```(\w*)\n?/);
  // blocks: [text, lang, code, text, lang, code...]
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < blocks.length; i += 1) {
    if (i % 2 === 0) {
      const text = blocks[i];
      const lines = text.split("\n");
      let list: { ordered: boolean; items: string[] } | null = null;
      const flushList = (key: string) => {
        if (!list) return;
        const items = list.items;
        nodes.push(
          list.ordered ? (
            <ol key={key} className="my-1 list-decimal space-y-0.5 pl-5">
              {items.map((it, j) => <li key={j}>{renderInline(it, `${key}-${j}`)}</li>)}
            </ol>
          ) : (
            <ul key={key} className="my-1 list-disc space-y-0.5 pl-5">
              {items.map((it, j) => <li key={j}>{renderInline(it, `${key}-${j}`)}</li>)}
            </ul>
          )
        );
        list = null;
      };

      lines.forEach((raw, li) => {
        const line = raw;
        const ul = line.match(/^\s*[-*•]\s+(.*)$/);
        const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
        const heading = line.match(/^(#{1,4})\s+(.*)$/);
        const quote = line.match(/^>\s?(.*)$/);

        if (ul) {
          if (!list || list.ordered) {
            flushList(`l-${i}-${li}`);
            list = { ordered: false, items: [] };
          }
          list.items.push(ul[1]);
        } else if (ol) {
          if (!list || !list.ordered) {
            flushList(`l-${i}-${li}`);
            list = { ordered: true, items: [] };
          }
          list.items.push(ol[1]);
        } else {
          flushList(`l-${i}-${li}`);
          if (heading) {
            const level = heading[1].length;
            const cls =
              level <= 1 ? "text-base font-bold mt-2 mb-1" : level === 2 ? "text-sm font-bold mt-2 mb-1" : "text-[13px] font-semibold mt-1.5";
            nodes.push(<div key={`h-${i}-${li}`} className={cls}>{renderInline(heading[2], `h-${i}-${li}`)}</div>);
          } else if (quote) {
            nodes.push(
              <div key={`q-${i}-${li}`} className="my-1 border-l-2 border-stone-300 pl-2 text-stone-500">
                {renderInline(quote[1], `q-${i}-${li}`)}
              </div>
            );
          } else if (line.trim()) {
            nodes.push(<p key={`p-${i}-${li}`} className="my-0.5">{renderInline(line, `p-${i}-${li}`)}</p>);
          }
        }
      });
      flushList(`l-${i}-end`);
    } else {
      // 代码块：i 是语言，i+1 是代码。
      // split(/```(\w*)\n?/) 会把闭合围栏也捕获为一个空语言项，
      // 因此一个围栏块占 [lang, code, ""] 三格，需跳两格落回偶数（正文）位。
      const code = blocks[i + 1] ?? "";
      nodes.push(
        <pre key={`code-${i}`} className="my-2 overflow-x-auto rounded-lg bg-stone-900 p-3 text-xs text-stone-100">
          <code>{code.replace(/\n$/, "")}</code>
        </pre>
      );
      i += 2;
    }
  }

  return <div className="space-y-0.5">{nodes}</div>;
}
