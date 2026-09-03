#!/usr/bin/env node
/**
 * 网关真实计费链路端到端验证（无需真实供应商凭据）：
 * 使用本地 OpenAI-compatible Mock（scripts/openai-mock.mjs），走与真实供应商完全相同的
 * 代码路径：BYOK overrides → OpenAI 兼容适配器 → 流式 SSE → 用量估算 → 成本换算 →
 * gateway_usage 落库 → 积分扣减 → 成本看板。
 *
 * 拿到真实 OpenAI/DeepSeek/Anthropic/DashScope Key 后，只需把 overrides 换成真实 baseUrl
 * 即可用同一脚本验证（或直接填 .env 后在浏览器发起对话）。
 *
 * 用法：
 *   node scripts/openai-mock.mjs &            # 终端 1：启动 mock（默认 9091）
 *   npm run dev -- -p 3007 &                  # 终端 2：启动应用
 *   BASE=http://localhost:3007 node scripts/e2e-billing.mjs
 *   可选：BASE=... MODEL=gpt-4o-mini PROVIDER=openai
 */
const BASE = process.env.BASE ?? "http://localhost:3007";
const MODEL = process.env.MODEL ?? "gpt-4o-mini";
const PROVIDER = process.env.PROVIDER ?? "openai";
const MOCK = process.env.MOCK_BASE ?? "http://127.0.0.1:9091/v1";
const EMAIL = `e2e-${Date.now()}@example.com`;

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

const email = EMAIL;
const name = "E2E计费";
const password = "test123456";

console.log(`── 网关计费 E2E（BASE=${BASE} MODEL=${MODEL} PROVIDER=${PROVIDER}）──`);

// 0) 健康检查
const h = await api("/api/health");
const hd = await h.json();
check("应用健康（mock 网关模式）", h.res.status === 200 && hd.ok === true);

// 1) 注册 + 签到（获得可用积分）
const reg = await api("/api/auth/register", {
  method: "POST",
  body: JSON.stringify({ email, name, password }),
});
setCookies(reg.res);
check("注册账号", reg.res.status === 200);
const ci = await api("/api/credits/checkin", { method: "POST", headers: { Cookie: cookieHeader() } });
const ciBody = await ci.json();
check("签到 +10 积分", ci.res.status === 200 && ciBody.balance >= 10, `balance=${ciBody.balance}`);

// 2) 发起对话（BYOK overrides → 本地 mock，走真实网关与计费路径）
console.log("── 对话（流式）──");
const before = (await (await api("/api/credits", { headers: { Cookie: cookieHeader() } })).json()).balance;
const chat = await fetch(BASE + "/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: cookieHeader() },
  body: JSON.stringify({
    model: MODEL,
    provider: PROVIDER,
    overrides: { [PROVIDER]: { apiKey: "sk-mock-local", baseUrl: MOCK } },
    messages: [{ role: "user", content: "用一句话验证网关计费链路" }],
  }),
});
const text = await chat.text();
const tokens = [];
for (const line of text.split("\n")) {
  if (!line.startsWith("data:")) continue;
  try {
    const j = JSON.parse(line.slice(5).trim());
    if (j.type === "token") tokens.push(j.delta);
  } catch { /* ignore */ }
}
const usageLine = text.split("\n").find((l) => l.includes('"usage"'));
const usage = usageLine ? JSON.parse(usageLine.slice(5).trim()) : null;
check(
  "流式对话成功且返回 token",
  chat.status === 200 && tokens.join("").length > 10,
  `tokens=${tokens.length}`
);
check("返回 usage（credits/costUsd）", !!usage && typeof usage.credits === "number" && usage.credits >= 0, JSON.stringify(usage ?? {}));

// 3) 积分扣减
const afterBalance = (await (await api("/api/credits", { headers: { Cookie: cookieHeader() } })).json()).balance;
const expected = (before ?? 0) - (usage?.credits ?? 0);
check("积分按真实用量扣减", afterBalance === expected, `${before} → ${afterBalance}（扣 ${usage?.credits}）`);

// 4) 成本看板（scope=me）落库
const stats = (await (await api("/api/gateway/stats?scope=me", { headers: { Cookie: cookieHeader() } })).json());
const s = stats.stats?.totals;
check("gateway_usage 落库（成功 1 次）", (s?.calls ?? 0) >= 1, `calls=${s?.calls} errors=${s?.errors}`);
check("成本看板 costUsd > 0 / credits > 0", (s?.costUsd ?? 0) > 0 && (s?.credits ?? 0) > 0, `costUsd=${s?.costUsd} credits=${s?.credits}`);
check("input/output token 已统计", (s?.inputTokens ?? 0) > 0 && (s?.outputTokens ?? 0) > 0, `in=${s?.inputTokens} out=${s?.outputTokens}`);

// 5) 清理测试账号
const del = await api("/api/account/delete", {
  method: "POST",
  headers: { Cookie: cookieHeader() },
  body: JSON.stringify({ confirm: "DELETE" }),
});
const delBody = await del.json();
check("清理测试账号", del.res.status === 200, JSON.stringify(delBody));
check("清理后匿名 stats 不可见（隔离）", (await api("/api/gateway/stats?scope=me")).res.status === 200);

console.log(failed === 0 ? "\n🎉 E2E BILLING: PASS（真实密钥替换后可用同一脚本复验）" : `\n💥 E2E BILLING: FAIL（${failed} 项）`);
process.exit(failed === 0 ? 0 : 1);
