import { logClientError, type ClientErrorInput } from "@/lib/db/repo";
import { getUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 前端运行时错误上报（脱敏：只保留路径，剥离查询串与 token） */
const scrubUrl = (u: string) => {
  try {
    const url = new URL(u, "http://local");
    return url.pathname.slice(0, 500);
  } catch {
    return u.slice(0, 500);
  }
};

/** POST /api/logs/client：window.onerror / unhandledrejection 上报 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<ClientErrorInput>;
  if (!body.message || typeof body.message !== "string") {
    return Response.json({ error: "message 必填" }, { status: 400 });
  }
  const user = getUserFromRequest(req);
  logClientError({
    message: body.message,
    source: body.source,
    stack: body.stack,
    url: scrubUrl(body.url ?? ""),
    userAgent: req.headers.get("user-agent") ?? "",
    userId: user?.id ?? null,
  });
  return Response.json({ ok: true });
}
