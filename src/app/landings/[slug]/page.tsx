import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LANDINGS, getLanding } from "@/lib/landings";
import { LandingShell } from "@/components/seo/LandingShell";
import { getLocale } from "@/lib/i18n/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = "OpenCanvas AI";

function jsonLd(copy: { h1: string; sub: string; faq: { q: string; a: string }[] }, locale: "zh" | "en") {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: `${SITE} — ${copy.h1}`,
        description: copy.sub,
        applicationCategory: "WebApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" },
        inLanguage: locale === "en" ? "en" : "zh-CN",
      },
      {
        "@type": "FAQPage",
        mainEntity: copy.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
}

export function generateStaticParams() {
  return LANDINGS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  const landing = getLanding(slug);
  if (!landing) return {};
  const locale = await getLocale();
  const c = locale === "en" ? landing.en : landing.zh;
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://opencanvas.example.com";
  const url = `${base}/landings/${landing.slug}`;
  return {
    title: c.metaTitle,
    description: c.metaDesc,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE,
      locale: locale === "en" ? "en_US" : "zh_CN",
      url,
      title: c.metaTitle,
      description: c.metaDesc,
    },
    twitter: {
      card: "summary",
      title: c.metaTitle,
      description: c.metaDesc,
    },
  };
}

export default async function LandingPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const landing = getLanding(slug);
  if (!landing) notFound();
  const locale = await getLocale();
  const copy = locale === "en" ? landing.en : landing.zh;
  const related = LANDINGS.filter((l) => l.slug !== slug).map((l) => ({ slug: l.slug, keyword: l.keyword }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(copy, locale)) }}
      />
      <LandingShell copy={copy} locale={locale} related={related} />
    </>
  );
}
