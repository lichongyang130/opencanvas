import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { getLocale } from "@/lib/i18n/server";
import { LEGAL } from "@/lib/i18n/legal";

export const metadata = {
  title: "用户协议 · OpenCanvas",
  description: "OpenCanvas 服务条款：使用规则、积分与付费、内容责任与免责声明。",
};

export default async function TermsPage() {
  const doc = LEGAL[await getLocale()].terms;
  return (
    <div className="min-h-screen bg-[var(--oc-bg)] text-stone-800">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-stone-500 transition hover:text-stone-700">
          <ArrowLeft className="h-4 w-4" /> {doc.back}
        </Link>
        <span className="text-[11px] text-stone-400">{doc.updated}</span>
      </header>
      <main className="mx-auto max-w-3xl px-6 pb-20">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-sm">
            <FileText className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">{doc.title}</h1>
            <p className="text-sm text-stone-500">{doc.sub}</p>
          </div>
        </div>

        <div className="space-y-5">
          {doc.sections.map((s) => (
            <section key={s.title} className="rounded-2xl border border-[var(--oc-border)] bg-white p-6 shadow-sm">
              <h2 className="text-[15px] font-semibold text-stone-800">{s.title}</h2>
              <ul className="mt-3 space-y-2">
                {s.body.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] leading-6 text-stone-500">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-300" />
                    {b}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-stone-400">
          © 2026 OpenCanvas · <Link href="/privacy" className="hover:text-stone-600">{LEGAL[await getLocale()].privacy.title}</Link>
        </p>
      </main>
    </div>
  );
}
