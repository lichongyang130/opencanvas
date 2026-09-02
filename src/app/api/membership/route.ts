import { membershipRepo, type MembershipPlan } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLAN_AMOUNT: Record<MembershipPlan, number> = {
  free: 0,
  pro: 39,
  team: 99,
};

/** 读取当前会员、统计数据与订单列表 */
export async function GET() {
  const m = membershipRepo.get();
  return Response.json({
    membership: m,
    stats: membershipRepo.stats(),
    orders: membershipRepo.listOrders(),
  });
}

/** 升级 / 续费：body = { plan } */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { plan?: MembershipPlan };
  const plan = body.plan;
  if (!plan || !(plan in PLAN_AMOUNT)) {
    return Response.json({ error: "未知套餐" }, { status: 400 });
  }
  const amount = PLAN_AMOUNT[plan];
  const result = membershipRepo.upgrade(plan, amount);
  return Response.json({ ok: true, ...result });
}

/** 取消自动续费 */
export async function DELETE() {
  const membership = membershipRepo.cancelAutoRenew();
  return Response.json({ ok: true, membership });
}
