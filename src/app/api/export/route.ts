import { repo } from "@/lib/db/repo";
import { getUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 数据导出：按当前登录用户导出（未登录 = 本机匿名会话）。
 * 登录用户走账号级导出（含资料与用量）；未登录导出本地 NULL 会话。
 * 历史全量接口在账号体系下会泄漏他人会话，已收窄为按用户可见范围。
 */
export async function GET(req: Request) {
  const user = getUserFromRequest(req);

  if (user) {
    const payload = repo.getUserAccountExport(user.id);
    if (!payload) return Response.json({ error: "账号不存在" }, { status: 404 });
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="opencanvas-account-${user.id.slice(0, 8)}-${Date.now()}.json"`,
      },
    });
  }

  const conversations = repo.listConversations(undefined, null).map((c) => ({
    ...c,
    messages: repo.getMessages(c.id),
  }));
  return new Response(
    JSON.stringify(
      {
        app: "opencanvas",
        schema: "local-export-v1",
        exportedAt: new Date().toISOString(),
        conversations,
        note: "未登录导出：仅包含本机匿名会话。登录后导出将包含账号资料与模型用量记录。",
      },
      null,
      2
    ),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="opencanvas-local-backup-${Date.now()}.json"`,
      },
    }
  );
}
