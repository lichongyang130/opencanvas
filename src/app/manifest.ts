import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OpenCanvas AI — 一站式 AI 智能体工作空间",
    short_name: "OpenCanvas",
    description: "对话、深度研究、PPT、图片、视频、文档，一个工作空间全部完成。",
    start_url: "/",
    display: "standalone",
    background_color: "#fdfaf6",
    theme_color: "#c05f3c",
    lang: "zh-CN",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
