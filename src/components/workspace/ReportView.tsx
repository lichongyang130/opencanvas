"use client";

import { useState } from "react";
import { Check, Copy, Download, ExternalLink, FileOutput, FileText, Info } from "lucide-react";
import type { ResearchReport } from "@/lib/research/types";
import { useChatStore } from "@/lib/store/chat";
import { toast } from "@/lib/store/toast";
import { useI18n } from "@/lib/i18n";

/** 将正文中的 [n] 引用渲染为可点角标 */
function withCitations(text: string) {
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((p, i) => {
    const m = p.match(/^\[(\d+)\]$/);
    if (m) {
      return (
        <sup key={i} className="mx-0.5 rounded bg-brand-100 px-1 text-[10px] font-medium text-brand-700">
          {m[1]}
        </sup>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

export function ReportView({ report }: { report: ResearchReport }) {
  const { tt } = useI18n();
  const { reportToSlides, reportToDoc, sending } = useChatStore();
  const [copied, setCopied] = useState(false);

  const toMarkdown = () => {
    const lines = [
      `# ${report.topic}`,
      "",
      report.summary,
      "",
      ...report.sections.flatMap((s) => [`## ${s.heading}`, "", s.body, ""]),
      tt("## 关键结论"),
      "",
      ...report.takeaways.map((t) => `- ${t}`),
      "",
      tt("## 参考来源"),
      "",
      ...report.sources.map((s, i) => `${i + 1}. [${s.title}](${s.url})`),
    ];
    return lines.join("\n");
  };

  const copyAll = async () => {
    await navigator.clipboard?.writeText(toMarkdown());
    setCopied(true);
    toast(tt("报告已复制（Markdown）"), "success");
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const blob = new Blob([toMarkdown()], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.topic || "research-report"}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast(tt("已导出 Markdown"), "success");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-stone-200 px-4 py-2.5">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{tt("深度研究报告")}</div>
          <div className="text-xs text-stone-400">
            {report.sections.length} 小节 · {report.sources.length} 个来源
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => void copyAll()}
            title={tt("复制为 Markdown")}
            className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs text-stone-600 transition hover:border-brand-300 hover:text-brand-600"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={download}
            title={tt("导出 Markdown")}
            className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs text-stone-600 transition hover:border-brand-300 hover:text-brand-600"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => reportToDoc()}
            disabled={sending}
            className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs text-stone-600 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-40"
          >
            <FileText className="h-3.5 w-3.5" /> 转文档
          </button>
          <button
            onClick={() => void reportToSlides()}
            disabled={sending}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700 disabled:opacity-40"
          >
            <FileOutput className="h-3.5 w-3.5" /> 一键转 PPT
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {report.demo && (
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              当前为<b>{tt("演示模式")}</b>：未配置 Tavily 搜索密钥，来源为示例。在「模型设置」填入
              Tavily API Key 后将真实联网检索。
            </span>
          </div>
        )}

        <div>
          <h1 className="text-lg font-bold leading-snug">{report.topic}</h1>
          <p className="mt-2 rounded-xl bg-stone-50 p-3 text-sm leading-6 text-stone-700">
            {withCitations(report.summary)}
          </p>
        </div>

        {report.sections.map((s, i) => (
          <section key={i}>
            <h2 className="mb-1.5 text-sm font-semibold text-stone-800">{s.heading}</h2>
            <p className="whitespace-pre-wrap text-sm leading-7 text-stone-600">
              {withCitations(s.body)}
            </p>
          </section>
        ))}

        <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-brand-800">{tt("关键结论")}</h3>
          <ul className="space-y-1.5">
            {report.takeaways.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-stone-800">{tt("参考来源")}</h3>
          <ol className="space-y-1.5">
            {report.sources.map((src, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-stone-200 text-[10px] font-medium text-stone-600">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-medium text-brand-700 hover:underline"
                  >
                    <span className="truncate">{src.title}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                  <p className="mt-0.5 line-clamp-2 text-stone-400">{src.snippet}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
