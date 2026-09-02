import { repo } from "@/lib/db/repo";
import { createSession, hashPassword, newUserId, sessionCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 注册：POST { email, name?, password } */
export async function POST(req: Request) {
  const body = (await req.json()) as { email?: string; name?: string; password?: string };
  const email = (body.email ?? "").trim().toLowerCase();
  const name = (body.name ?? "").trim().slice(0, 30);
  const password = body.password ?? "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "邮箱格式不正确" }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json({ error: "密码至少 6 位" }, { status: 400 });
  }
  if (repo.findUserByEmail(email)) {
    return Response.json({ error: "该邮箱已注册，请直接登录" }, { status: 409 });
  }

  const id = newUserId();
  repo.createUser({ id, email, name: name || email.split("@")[0], passwordHash: hashPassword(password) });
  const token = createSession(id);
  const user = repo.findUserById(id)!;
  const res = Response.json({ user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt } });
  res.headers.set("Set-Cookie", sessionCookie(token));
  return res;
}
