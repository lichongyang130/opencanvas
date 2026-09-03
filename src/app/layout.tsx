import type { Metadata, Viewport } from "next";
import "./globals.css";
import ThemeSync from "@/components/ThemeSync";
import Observability from "@/components/Observability";

const SITE_NAME = "OpenCanvas AI";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — 一站式 AI 智能体工作空间`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "对话、深度研究、PPT、图片、视频、文档，一个工作空间全部完成。聚合国内外主流大模型。",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "zh_CN",
    title: `${SITE_NAME} — 一站式 AI 智能体工作空间`,
    description: "对话、深度研究、PPT、图片、视频、文档，一个工作空间全部完成。",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — 一站式 AI 智能体工作空间`,
    description: "对话、深度研究、PPT、图片、视频、文档，一个工作空间全部完成。",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://opencanvas.example.com"),
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: "#c05f3c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <ThemeSync />
        <Observability />
        {children}
      </body>
    </html>
  );
}
