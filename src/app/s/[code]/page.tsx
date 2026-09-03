import type { Metadata } from "next";
import { resolveShare, KIND_LABEL } from "@/lib/share";
import ShareView from "./ShareView";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 分享页 SEO：标题/描述按分享内容动态生成（公开只读页，便于搜索引擎收录） */
export async function generateMetadata(props: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const params = await props.params;
  const s = resolveShare(params.code);
  if (!s) {
    return {
      title: "分享不存在 · OpenCanvas",
      robots: { index: false, follow: false },
    };
  }
  const label = KIND_LABEL[s.kind] ?? "共享内容";
  return {
    title: `${s.title} · ${label}`,
    description: s.description || `在 OpenCanvas 查看这个${label}`,
    openGraph: {
      title: `${s.title} · ${label}`,
      description: s.description || `在 OpenCanvas 查看这个${label}`,
      type: "website",
      locale: "zh_CN",
      siteName: "OpenCanvas",
    },
    twitter: {
      card: "summary",
      title: `${s.title} · ${label}`,
      description: s.description || `在 OpenCanvas 查看这个${label}`,
    },
  };
}

/** 服务端解析一次（metadata 与首屏共用），客户端组件复用；未命中时由客户端兜底刷新 */
export default async function SharePage(props: { params: Promise<{ code: string }> }) {
  const params = await props.params;
  const initial = resolveShare(params.code);
  return <ShareView code={params.code} initial={initial} />;
}
