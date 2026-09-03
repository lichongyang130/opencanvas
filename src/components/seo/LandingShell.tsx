import Link from "next/link";
import type { LandingCopy } from "@/lib/landings";

/** SEO 落地页统一版式：hero + 功能 + 三步 + FAQ + CTA + 站内互链（服务端渲染，无客户端脚本） */
export function LandingShell({
  copy,
  locale,
  related,
}: {
  copy: LandingCopy;
  locale: "zh" | "en";
  related: { slug: string; keyword: string }[];
}) {
  const t = (zh: string, en: string) => (locale === "en" ? en : zh);
  return (
    <div className="min-h-screen bg-[var(--oc-bg)] text-stone-800">
      {/* 顶栏 */}
      <header className="sticky top-0 z-10 border-b border-[var(--oc-border-soft)] bg-[var(--oc-bg)]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500 text-[15px] font-bold text-white shadow-sm">
              O
            </span>
            <span className="text-[15px] font-semibold text-stone-800">OpenCanvas AI</span>
          </Link>
          <nav className="hidden items-center gap-6 text-[13px] text-stone-500 sm:flex">
            <Link href="/landings" className="transition hover:text-stone-800">
              {t("全部场景", "All use cases")}
            </Link>
            <Link href="/templates" className="transition hover:text-stone-800">
              {t("模板中心", "Templates")}
            </Link>
            <Link href="/tools" className="transition hover:text-stone-800">
              {t("工具箱", "Tools")}
            </Link>
          </nav>
          <Link
            href="/chat"
            className="rounded-xl bg-gradient-to-r from-orange-400 to-red-500 px-4 py-2 text-[13px] font-medium text-white shadow-sm transition hover:brightness-105"
          >
            {copy.cta}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-14 pt-20 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--oc-brand)]">
          {t("OpenCanvas · 一站式 AI 工作台", "OpenCanvas · One-stop AI workspace")}
        </p>
        <h1 className="mt-4 text-[34px] font-bold leading-[1.25] tracking-tight text-stone-900 sm:text-[44px]">
          {copy.h1}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-7 text-stone-500">{copy.sub}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/chat"
            className="rounded-2xl bg-gradient-to-r from-orange-400 to-red-500 px-7 py-3 text-[14.5px] font-semibold text-white shadow-[0_8px_24px_rgba(240,122,63,0.25)] transition hover:brightness-105"
          >
            {copy.cta}
          </Link>
          <Link
            href="/mockup"
            className="rounded-2xl border border-[var(--oc-border)] bg-white px-7 py-3 text-[14.5px] font-medium text-stone-600 transition hover:border-[var(--oc-brand-border)] hover:text-stone-800"
          >
            {t("先看演示", "See the demo")}
          </Link>
        </div>
        <p className="mt-4 text-[11.5px] text-stone-400">
          {t("免费开始 · 无需信用卡 · 中英文界面", "Free to start · No credit card · Chinese & English UI")}
        </p>
      </section>

      {/* 功能 */}
      <section className="mx-auto max-w-6xl px-6 pb-14">
        <div className="grid gap-4 sm:grid-cols-2">
          {copy.features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-[var(--oc-border)] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:border-[var(--oc-brand-border-soft)]"
            >
              <h2 className="text-[15.5px] font-semibold text-stone-800">{f.title}</h2>
              <p className="mt-2 text-[13px] leading-6 text-stone-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 三步 */}
      <section className="mx-auto max-w-6xl px-6 pb-14">
        <h2 className="text-center text-[22px] font-bold text-stone-900">
          {t("三步开始，无需学习成本", "Three steps, zero learning curve")}
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {copy.steps.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-[var(--oc-border)] bg-white p-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--oc-brand-hover)] text-[13px] font-bold text-[var(--oc-brand)]">
                {i + 1}
              </span>
              <h3 className="mt-3 text-[14.5px] font-semibold text-stone-800">{s.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-6 text-stone-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <h2 className="text-center text-[22px] font-bold text-stone-900">
          {t("常见问题", "Frequently asked questions")}
        </h2>
        <div className="mt-8 space-y-3">
          {copy.faq.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-[var(--oc-border)] bg-white px-6 py-5 open:shadow-[0_1px_6px_rgba(0,0,0,0.05)]"
            >
              <summary className="cursor-pointer list-none text-[14px] font-semibold text-stone-800">
                <span className="mr-2 text-[var(--oc-brand)]">Q</span>
                {f.q}
              </summary>
              <p className="mt-3 pl-6 text-[13px] leading-7 text-stone-500">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-[var(--oc-brand-tint)] to-[var(--oc-bg)] px-8 py-12 text-center">
          <h2 className="text-[24px] font-bold text-stone-900">
            {t("现在就开始，免费体验全部能力", "Start now — try everything free")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[13.5px] text-stone-500">
            {t("无需安装，打开浏览器即可使用；支持多模型、多语言与本地/私有化部署。", "No install, works in the browser; multi-model, multilingual, self-hostable.")}
          </p>
          <Link
            href="/chat"
            className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-400 to-red-500 px-8 py-3 text-[14.5px] font-semibold text-white shadow-[0_8px_24px_rgba(240,122,63,0.25)] transition hover:brightness-105"
          >
            {copy.cta} →
          </Link>
        </div>
      </section>

      {/* 站内互链矩阵 */}
      {related.length > 0 && (
        <section className="border-t border-[var(--oc-border-soft)] bg-white">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              {t("更多 AI 能力", "More AI capabilities")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/landings/${r.slug}`}
                  className="rounded-full border border-[var(--oc-border)] bg-white px-3.5 py-1.5 text-[12px] text-stone-500 transition hover:border-[var(--oc-brand-border)] hover:text-[var(--oc-brand)]"
                >
                  {r.keyword}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-[var(--oc-border-soft)] bg-[var(--oc-bg)] py-8 text-center text-[11.5px] text-stone-400">
        <p>OpenCanvas AI · {t("一站式 AI 工作台", "One-stop AI workspace")}</p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <Link href="/privacy" className="hover:text-stone-600">{t("隐私政策", "Privacy")}</Link>
          <Link href="/terms" className="hover:text-stone-600">{t("服务条款", "Terms")}</Link>
          <Link href="/sitemap.xml" className="hover:text-stone-600">Sitemap</Link>
        </div>
      </footer>
    </div>
  );
}
