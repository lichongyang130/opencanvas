import type { MetadataRoute } from "next";
import { listShareCodes } from "@/lib/db/repo";

export const dynamic = "force-dynamic";

const STATIC_PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/chat", priority: 0.9, changeFrequency: "weekly" },
  { path: "/docs", priority: 0.8, changeFrequency: "weekly" },
  { path: "/templates", priority: 0.8, changeFrequency: "weekly" },
  { path: "/agents", priority: 0.8, changeFrequency: "weekly" },
  { path: "/knowledge", priority: 0.7, changeFrequency: "weekly" },
  { path: "/tools", priority: 0.7, changeFrequency: "weekly" },
  { path: "/apps", priority: 0.7, changeFrequency: "weekly" },
  { path: "/membership", priority: 0.6, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://opencanvas.example.com";
  const now = new Date();

  const statics: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: `${base}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  // 公开分享页：产物 / 案例 / 共享智能体 / 共享模板
  const shares: MetadataRoute.Sitemap = listShareCodes().map((s) => ({
    url: `${base}/s/${s.code}`,
    lastModified: new Date(s.updatedAt),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...statics, ...shares];
}
