# 网关计费端到端验证（无凭据也能跑 / 有凭据一键复验）

## 为什么需要这一步
A3 已实现真实用量落库（`gateway_usage`）与积分扣减，但此前只在 demo（免费）路径下验证过。
本批用 **本地兼容 Mock** 把 openai / deepseek / dashscope / anthropic 四个供应商的
**真实代码路径**（流式适配 → 用量估算 → 成本换算 → 落库 → 扣分 → 成本看板）全部跑通，
并修复了隔离引入的「今日签到」判定 bug。

## 一键复验（无需真实 Key）
```bash
node scripts/openai-mock.mjs &          # 本地 mock（默认 9091）
npm run dev -- -p 3007 &                # 应用
BASE=http://localhost:3007 node scripts/e2e-billing.mjs

# 切换供应商/模型
BASE=http://localhost:3007 MODEL=deepseek-chat      PROVIDER=deepseek  node scripts/e2e-billing.mjs
BASE=http://localhost:3007 MODEL=qwen-max           PROVIDER=dashscope node scripts/e2e-billing.mjs
BASE=http://localhost:3007 MODEL=claude-3-5-sonnet-20241022 PROVIDER=anthropic node scripts/e2e-billing.mjs
```

脚本断言（10 项）：
1. `/api/health` 200
2. 注册
3. 签到 +10
4. 流式对话返回 token
5. usage 事件含 credits/costUsd
6. 余额按 usage.credits 扣减
7. `gateway_usage` 成功落库（scope=me）
8. 成本看板 costUsd>0 / credits>0
9. input/output token 已统计
10. 删除测试账号（清理）

## 拿到真实 Key 后
把 Mock baseUrl 换成真实端点即可（或直接填 `.env` 后在浏览器对话，看「设置 → 模型设置 → 用量与成本看板」）：
- OpenAI：`https://api.openai.com/v1`
- DeepSeek：`https://api.deepseek.com/v1`
- 阿里云百炼：`https://dashscope.aliyuncs.com/compatible-mode/v1`
- Anthropic：`https://api.anthropic.com`

## 本次修复
- `repo.checkedInToday(userId)`：隔离改造时用了「本人+本地」合并可见性范围，导致匿名签到后
  登录用户被误判为「今日已签到」（反之亦然）→ 改为按身份精确匹配（登录只看本人，未登录只看本地）。
  已由 E2E 第 3 步回归覆盖。
