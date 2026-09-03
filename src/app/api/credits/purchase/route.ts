import { repo } from "@/lib/db/repo";
import { getUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 充值包：价格（人民币）+ 到账积分（赠送额外积分） */
export const PACKS = [
  { id: "small", credits: 100, bonus: 0, price: 6, label: "小包" },
  { id: "medium", credits: 1000, bonus: 120, price: 56, label: "畅享包" },
  { id: "large", credits: 5000, bonus: 800, price: 266, label: "大包" },
] as const;

export type PackId = (typeof PACKS)[number]["id"];

/**
 * 购买充值包：POST /api/credits/purchase { packId }
 * 演示环境：无真实支付通道，调用即模拟支付成功并立即到账（流水 reason = 充值：{label}）。
 * 未来接入 Stripe / 微信 / 支付宝时，仅需在到账前替换为「支付回调 → 幂等入账」。
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { packId?: string };
  const uid = getUserFromRequest(req)?.id ?? null;
  const pack = PACKS.find((p) => p.id === body.packId);
  if (!pack) {
    return Response.json({ error: "未知充值包" }, { status: 400 });
  }
  const total = pack.credits + pack.bonus;
  repo.addCredits(total, `充值：${pack.label}`, `pack:${pack.id}`, uid);
  return Response.json({
    ok: true,
    packId: pack.id,
    credits: pack.credits,
    bonus: pack.bonus,
    total,
    balance: repo.creditBalance(uid),
  });
}
