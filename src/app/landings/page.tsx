import type { Metadata } from "next";
import Link from "next/link";
import { LANDINGS } from "@/lib/landings";
import { getLocale } from "@/lib/i18n/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://opencanvas.example.com";
  const url = `${base}/landings`;
  return {
    title: locale === "en" ? "AI Use Cases — OpenCanvas AI" : "AI 应用场景大全 — OpenCanvas AI",
    description:
      locale === "en"
        ? "Explore OpenCanvas AI use cases: writing, PPT, video, image, documents and agents."
        : "OpenCanvas AI 应用场景：AI 写作、PPT、视频、图片、文档与智能体——打开浏览器即可免费使用。",
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "OpenCanvas AI",
      locale: locale === "en" ? "en_US" : "zh_CN",
      url,
      title: locale === "en" ? "AI Use Cases — OpenCanvas AI" : "AI 应用场景大全 — OpenCanvas AI",
      description: locale === "en"
        ? "Explore OpenCanvas AI use cases: writing, PPT, video, image, documents and agents."
        : "OpenCanvas AI 应用场景：AI 写作、PPT、视频、图片、文档与智能体——打开浏览器即可免费使用。",
    },
  };
}

export default async function LandingsIndex() {
  const locale = await getLocale();
  const t = (zh: string, en: string) => (locale === "en" ? en : zh);

  return (
    <div className="min-h-screen bg-[var(--oc-bg)] text-stone-800">
      <header className="border-b border-[var(--oc-border-soft)] bg-[var(--oc-bg)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500 text-[15px] font-bold text-white shadow-sm">
              O
            </span>
            <span className="text-[15px] font-semibold text-stone-800">OpenCanvas AI</span>
          </Link>
          <Link
            href="/chat"
            className="rounded-xl bg-gradient-to-r from-orange-400 to-red-500 px-4 py-2 text-[13px] font-medium text-white shadow-sm transition hover:brightness-105"
          >
            {t("免费开始", "Start free")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-16">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--oc-brand)]">
          {t("SEARCH · USE · CREATE", "SEARCH · USE · CREATE")}
        </p>
        <h1 className="mt-4 text-center text-[32px] font-bold tracking-tight text-stone-900 sm:text-[40px]">
          {t("一个工作台，覆盖 AI 高频场景", "One workspace for every AI use case")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[14.5px] leading-7 text-stone-500">
          {t(
            "写作、PPT、视频、图片、文档与智能体——每个入口都有专属工具页，打开即可免费体验，无需安装。",
            "Writing, decks, video, images, docs and agents — each has a dedicated page, free in the browser, no install."
          )}
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LANDINGS.map((l) => {
            const c = locale === "en" ? l.en : l.zh;
            return (
              <Link
                key={l.slug}
                href={`/landings/${l.slug}`}
                className="group rounded-2xl border border-[var(--oc-border)] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:-translate-y-0.5 hover:border-[var(--oc-brand-border)] hover:shadow-md"
              >
                <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--oc-brand)]">
                  {l.keyword}
                </p>
                <h2 className="mt-2 text-[16px] font-semibold text-stone-800 group-hover:text-[var(--oc-brand)]">
                  {c.h1}
                </h2>
                <p className="mt-2 text-[12.5px] leading-6 text-stone-500">{c.sub}</p>
                <span className="mt-4 inline-block text-[12.5px] font-medium text-stone-400 transition group-hover:text-[var(--oc-brand)]">
                  {t("查看详情 →", "Learn more →")}
                </span>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
