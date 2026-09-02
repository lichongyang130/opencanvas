import { repo } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 每日签到：POST /api/credits/checkin（每日一次 +10） */
export async function POST() {
  if (repo.checkedInToday()) {
    return Response.json({ ok: false, error: "今天已签到，明天再来吧" }, { status: 400 });
  }
  repo.addCredits(10, "每日签到");
  return Response.json({ ok: true, delta: 10, balance: repo.creditBalance() });
}
