import { repo } from "@/lib/db/repo";
import { createSession, sessionCookie, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 登录：POST { email, password } */
export async function POST(req: Request) {
  const body = (await req.json()) as { email?: string; password?: string };
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const user = repo.findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return Response.json({ error: "邮箱或密码错误" }, { status: 401 });
  }
  const token = createSession(user.id);
  const res = Response.json({
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
  });
  res.headers.set("Set-Cookie", sessionCookie(token));
  return res;
}
