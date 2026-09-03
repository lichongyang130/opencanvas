import { repo } from "@/lib/db/repo";
import { getUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_COOKIE = "oc_session";

/**
 * 删除账号（不可撤销）：POST /api/account/delete { confirm: "DELETE" }
 * 删除：用户资料、登录会话、其名下会话与消息、模型用量记录；积分全局账本保留。
 */
export async function POST(req: Request) {
  const user = getUserFromRequest(req);
  if (!user) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { confirm?: string };
  if (body.confirm !== "DELETE") {
    return Response.json({ error: "请输入 DELETE 确认删除" }, { status: 400 });
  }

  const id = user.id;
  repo.deleteUserAccount(id);

  // 清除当前会话 cookie
  const res = Response.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  return res;
}
