import { repo } from "@/lib/db/repo";
import { getUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 积分概览：GET /api/credits?limit=N（余额 + 最近流水 + 今日任务状态，N 默认 50，最大 500） */
export async function GET(req: Request) {
  const uid = getUserFromRequest(req)?.id ?? null;
  const today0 = new Date();
  today0.setHours(0, 0, 0, 0);
  const t0 = today0.getTime();
  const limit = Math.min(500, Math.max(1, Number(new URL(req.url).searchParams.get("limit") ?? 50)));
  const ledger = repo.creditLedger(limit, uid);
  const deltaToday = (reason: string) =>
    ledger.filter((l) => l.reason === reason && l.createdAt >= t0).reduce((a, b) => a + b.delta, 0);
  return Response.json({
    balance: repo.creditBalance(uid),
    ledger,
    tasks: {
      checkin: { title: "每日签到", reward: 10, done: repo.checkedInToday(uid) },
      upload: { title: "上传文档", reward: 5, done: deltaToday("上传文档") >= 5 },
      share: { title: "分享智能体", reward: 3, done: deltaToday("分享智能体") >= 3 },
    },
  });
}
