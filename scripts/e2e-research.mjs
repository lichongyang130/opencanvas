#!/usr/bin/env node
/**
 * 深度研究（演示模式）端到端验证：
 *  - 应用需已启动（BASE，默认 http://localhost:3007）
 *  - 无 Tavily Key / 无模型 Key 也能跑：走内置演示研究引擎（带 [n] 引用角标与示例来源）
 *
 * 断言：health → demo 研究 SSE（进度+报告结构+引用角标+来源示例标记）
 *      → 注册 → 登录态研究 → gateway_usage 归属（research-demo 可见，cost=0）
 *      → 违规 topic 400 → 删号清理。
 *
 * 用法：
 *   npm run dev -- -p 3007 &
 *   BASE=http://localhost:3007 node scripts/e2e-research.mjs
 */
const BASE = process.env.BASE ?? "http://localhost:3007";
const TOPIC = "E2E 验证：AI Agent 赛道竞争格局";

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

/** 调用 /api/research（SSE），返回全部事件 */
async function runResearch(topic, headers = {}) {
  const res = await fetch(BASE + "/api/research", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ topic, model: "demo", depth: "advanced", maxResults: 6 }),
  });
  const text = await res.text();
  const events = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^data: (.+)$/);
    if (m) {
      try {
        events.push(JSON.parse(m[1]));
      } catch {
        /* 忽略非 JSON 行 */
      }
    }
  }
  return { res, events };
}

console.log(`── 深度研究 E2E（BASE=${BASE}，demo 引擎，零凭据）──`);

// 0) 健康检查
const h = await api("/api/health");
const hd = await h.json();
check("应用健康", h.res.status === 200 && hd.ok === true);

// 1) 匿名演示研究：SSE 进度 + 报告结构
const run1 = await runResearch(TOPIC);
const statuses = run1.events.filter((e) => e.type === "status");
const report = run1.events.find((e) => e.type === "report")?.report;
check("研究 SSE 成功且有多条进度", run1.res.status === 200 && statuses.length >= 3, `status=${statuses.length}`);
check(
  "报告结构完整（demo + 摘要 + ≥5 小节 + ≥4 来源 + 4 要点）",
  !!report &&
    report.demo === true &&
    report.topic.includes("AI Agent") &&
    typeof report.summary === "string" &&
    report.summary.length > 20 &&
    report.sections.length >= 5 &&
    report.sources.length >= 4 &&
    report.takeaways.length === 4,
  report ? `sections=${report.sections.length} sources=${report.sources.length}` : "无报告"
);
check(
  "正文带 [n] 引用角标且来源标注「示例」",
  !!report &&
    report.sections.every((s) => /\d+/g.test(s.body)) &&
    report.sources.every((s) => s.demo === true && s.url.includes("example.com")),
  report ? `[n]样例=${String(report.sections[0]?.body).match(/\[\d+\]/g)?.join(",")}` : ""
);

// 2) 注册登录
const email = `e2e-research-${Date.now()}@example.com`;
const reg = await api("/api/auth/register", {
  method: "POST",
  body: JSON.stringify({ email, name: "E2E研究", password: "test123456" }),
});
setCookies(reg.res);
check("注册账号", reg.res.status === 200);

// 3) 登录态研究：应计入本人 gateway_usage（research-demo，cost=0）
const run2 = await runResearch("深海经济市场规模与趋势（登录态）", { Cookie: cookieHeader() });
const report2 = run2.events.find((e) => e.type === "report")?.report;
check("登录态研究成功", run2.res.status === 200 && !!report2?.demo);

const stats = await api("/api/gateway/stats?scope=me", { headers: { Cookie: cookieHeader() } });
const statsBody = await stats.json();
const row = statsBody.stats?.byModel?.find?.((r) => r.modelId === "research-demo");
check(
  "gateway_usage：research-demo 归属当前用户（calls≥1, costUsd=0）",
  stats.res.status === 200 && !!row && row.calls >= 1 && (row.costUsd ?? -1) === 0,
  row ? `calls=${row.calls} cost=${row.costUsd}` : "未找到记录"
);

// 4) 违规 topic 拦截
const bad = await api("/api/research", {
  method: "POST",
  headers: { Cookie: cookieHeader() },
  body: JSON.stringify({ topic: "出售枪支 市场调研", model: "demo" }),
});
check("违规 topic 被拦截（400）", bad.res.status === 400, (await bad.json()).error ?? "");

// 5) 删除测试账号
const del = await api("/api/account/delete", {
  method: "POST",
  headers: { Cookie: cookieHeader() },
  body: JSON.stringify({ confirm: "DELETE" }),
});
check("删除测试账号", del.res.status === 200);

console.log("");
if (failed === 0) {
  console.log("🎉 深度研究 E2E 全部通过（8/8）");
  process.exit(0);
} else {
  console.log(`❌ ${failed} 项断言失败`);
  process.exit(1);
}
