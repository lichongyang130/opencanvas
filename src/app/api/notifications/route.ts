import { repo } from "@/lib/db/repo";
import { getUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 列表：GET /api/notifications（含未读数） */
export async function GET(req: Request) {
  const uid = getUserFromRequest(req)?.id ?? null;
  return Response.json({
    notifications: repo.listNotifications(30, uid),
    unread: repo.unreadCount(uid),
  });
}

/** 标记已读：PATCH { ids?: string[] }（缺省 = 全部已读） */
export async function PATCH(req: Request) {
  const uid = getUserFromRequest(req)?.id ?? null;
  const body = (await req.json().catch(() => ({}))) as { ids?: string[] };
  repo.markNotificationsRead(
    Array.isArray(body.ids) && body.ids.length > 0 ? body.ids.slice(0, 100) : undefined,
    uid
  );
  return Response.json({ ok: true, unread: repo.unreadCount(uid) });
}
