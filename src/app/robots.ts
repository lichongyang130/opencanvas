import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://opencanvas.example.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/chat", "/s/000000000000"], // 分享页本身允许（公开）；示例占位防呆
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
