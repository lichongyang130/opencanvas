import { getUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 当前登录用户：GET → { user } | { user: null } */
export async function GET(req: Request) {
  const user = getUserFromRequest(req);
  return Response.json({ user });
}
