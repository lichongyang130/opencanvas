import type { Metadata, Viewport } from "next";
import "./globals.css";
import ThemeSync from "@/components/ThemeSync";
import Observability from "@/components/Observability";
import { LocaleProvider } from "@/lib/i18n";
import { getDict, getLocale } from "@/lib/i18n/server";

const SITE_NAME = "OpenCanvas AI";

/** 按请求 cookie 生成语言感知 metadata（不能在模块顶层求值） */
export async function generateMetadata(): Promise<Metadata> {
  const loc = await getDict();
  const locale = await getLocale();
  return {
    title: {
      default: `${SITE_NAME} — ${loc.home.heroTitle}`,
      template: `%s · ${SITE_NAME}`,
    },
    description: loc.home.heroSub,
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: locale === "en" ? "en_US" : "zh_CN",
      title: `${SITE_NAME} — ${loc.home.heroTitle}`,
      description: loc.home.heroSub,
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} — ${loc.home.heroTitle}`,
      description: loc.home.heroSub,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://opencanvas.example.com"),
    alternates: {
      canonical: "/",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#c05f3c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale === "en" ? "en" : "zh-CN"}>
      <body>
        <LocaleProvider initialLocale={locale}>
          <ThemeSync />
          <Observability />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
