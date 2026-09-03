import { getVideoProviderStatus, VIDEO_MODELS } from "@/lib/gateway/video";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 视频供应商/模型清单：GET /api/video/status */
export async function GET() {
  return Response.json({
    providers: getVideoProviderStatus(),
    models: VIDEO_MODELS.map((m) => ({
      id: m.id,
      label: m.label,
      provider: m.provider,
      providerLabel: m.providerLabel,
      region: m.region,
      pricePerVideo: m.pricePerVideo,
      creditsPerVideo: m.creditsPerVideo,
      maxDurationSec: m.maxDurationSec,
    })),
  });
}
