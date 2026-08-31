import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenCanvas AI — 一站式 AI 智能体工作空间",
  description:
    "对话、深度研究、PPT、图片、视频、文档，一个工作空间全部完成。聚合国内外主流大模型。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
