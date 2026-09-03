#!/usr/bin/env node
/**
 * AI 视频生成（演示模式）端到端验证：
 *  - 应用需已启动（BASE，默认 http://localhost:3007）
 *  - 全程零外部凭据：内置 demo 引擎在本机合成 GIF 动画
 *
 * 断言：health → /api/video/status → 匿名生成（GIF 字节校验）→ 注册 → 登录态生成
 *      → gateway_usage 归属（scope=me 可见 demo-video 记录）→ 审核拦截 → 删号清理。
 *
 * 用法：
 *   npm run dev -- -p 3007 &
 *   BASE=http://localhost:3007 node scripts/e2e-video.mjs
 */
const BASE = process.env.BASE ?? "http://localhost:3007";

let failed = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "  ✅" : "  ❌"} ${name}${extra ? ` (${extra})` : ""}`);
  if (!ok) failed++;
};

async function api(path, opts = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
  });
  return { res, json: () => res.json().catch(() => ({})) };
}

const cookieJar = [];
const cookieHeader = () => cookieJar.map((c) => c.split(";")[0]).join("; ");
const setCookies = (res) => {
  for (const c of res.headers.getSetCookie?.() ?? []) cookieJar.push(c);
};

console.log(`── AI 视频生成 E2E（BASE=${BASE}，demo 引擎，零凭据）──`);

// 0) 健康检查
const h = await api("/api/health");
const hd = await h.json();
check("应用健康", h.res.status === 200 && hd.ok === true);

// 1) 引擎状态
const st = await api("/api/video/status");
const stBody = await st.json();
check(
  "引擎状态：demo 可用且列出 3 个模型",
  st.res.status === 200 &&
    stBody.providers?.demo === true &&
    Array.isArray(stBody.models) &&
    stBody.models.length === 3 &&
    stBody.models.some((m) => m.id === "demo-video"),
  `models=${stBody.models?.length}`
);

// 2) 匿名生成：校验 GIF 字节（GIF89a 头 / 尺寸 480x270 / trailer）
const anon = await api("/api/video", {
  method: "POST",
  body: JSON.stringify({ prompt: "赛博朋克城市夜景，霓虹灯在雨幕中流动", model: "demo-video" }),
});
const anonBody = await anon.json();
let gifOk = false;
let gifLen = 0;
if (anon.res.status === 200 && anonBody.ok && anonBody.mock && /^data:image\/gif;base64,/.test(anonBody.url)) {
  const buf = Buffer.from(anonBody.url.split(",")[1], "base64");
  gifLen = buf.length;
  gifOk =
    buf.subarray(0, 6).toString("latin1") === "GIF89a" &&
    buf.readUInt16LE(6) === 480 &&
    buf.readUInt16LE(8) === 270 &&
    buf[buf.length - 1] === 0x3b;
}
check(
  "匿名生成成功且为有效 GIF（480×270）",
  anon.res.status === 200 && gifOk,
  `${anonBody.model ?? anonBody.error} bytes=${gifLen}`
);

// 3) 注册登录
const email = `e2e-video-${Date.now()}@example.com`;
const reg = await api("/api/auth/register", {
  method: "POST",
  body: JSON.stringify({ email, name: "E2E视频", password: "test123456" }),
});
setCookies(reg.res);
check("注册账号", reg.res.status === 200);

// 4) 登录态生成（应计入本人 gateway_usage）
const gen = await api("/api/video", {
  method: "POST",
  headers: { Cookie: cookieHeader() },
  body: JSON.stringify({ prompt: "深海世界，光斑与气泡缓缓上升", model: "demo-video" }),
});
const genBody = await gen.json();
check(
  "登录态生成成功（demo，免费）",
  gen.res.status === 200 && genBody.ok === true && genBody.mock === true && genBody.provider === "demo"
);

// 5) 用量归属：scope=me 应能看到 demo-video 记录
const stats = await api("/api/gateway/stats?scope=me", { headers: { Cookie: cookieHeader() } });
const stBody2 = await stats.json();
const videoRow = stBody2.stats?.byModel?.find?.((r) => r.modelId === "demo-video");
check(
  "gateway_usage：demo-video 已归属当前用户（calls≥1, costUsd=0）",
  stats.res.status === 200 && !!videoRow && videoRow.calls >= 1 && (videoRow.costUsd ?? -1) === 0,
  videoRow ? `calls=${videoRow.calls} cost=${videoRow.costUsd}` : "未找到记录"
);

// 6) 审核：违规描述应被 400 拦截
const bad = await api("/api/video", {
  method: "POST",
  headers: { Cookie: cookieHeader() },
  body: JSON.stringify({ prompt: "出售枪支 广告" }),
});
check("违规描述被拦截（400）", bad.res.status === 400, (await bad.json()).error ?? "");

// 7) 删除测试账号
const del = await api("/api/account/delete", {
  method: "POST",
  headers: { Cookie: cookieHeader() },
  body: JSON.stringify({ confirm: "DELETE" }),
});
check("删除测试账号", del.res.status === 200);

console.log("");
if (failed === 0) {
  console.log(`🎉 视频生成 E2E 全部通过（7/7）`);
  process.exit(0);
} else {
  console.log(`❌ ${failed} 项断言失败`);
  process.exit(1);
}
