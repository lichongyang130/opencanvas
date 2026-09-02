import { repo } from "@/lib/db/repo";
import { clearSessionCookie, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 登出：POST（删除会话 + 清 cookie） */
export async function POST(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(/(?:^|;\s*)oc_session=([^;]+)/);
  if (m) repo.deleteSession(decodeURIComponent(m[1]));
  const res = Response.json({ ok: true });
  res.headers.set("Set-Cookie", clearSessionCookie());
  return res;
}
