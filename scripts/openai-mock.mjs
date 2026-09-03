#!/usr/bin/env node
/**
 * 最小「OpenAI Chat Completions 兼容 + Anthropic Messages 兼容」Mock。
 * 仅用于沙箱验证网关真实计费链路（无真实凭据时），走与真实供应商完全相同的代码路径：
 *   - POST /v1/chat/completions  → OpenAI 流式 SSE（openai/deepseek/dashscope 适配器）
 *   - POST /v1/messages          → Anthropic SSE（content_block_delta）
 *   - POST /v1/embeddings        → 固定向量（embedding 网关）
 * 要求 Bearer / x-api-key 头存在；x-mock-fail: 1 触发 500（错误路径测试）。
 *
 * 用法：node scripts/openai-mock.mjs [--port 9091] [--fail-status N]
 */
import { createServer } from "node:http";

const args = process.argv.slice(2);
const portIdx = args.indexOf("--port");
const PORT = portIdx >= 0 ? Number(args[portIdx + 1]) : 9091;
const FAIL_STATUS = Number(args[args.indexOf("--fail-status") + 1] ?? "0") || 0;
let failCount = 0;

const REPLIES = [
  "这是一条来自本地兼容 Mock 的流式回复。",
  "它用于验证 OpenCanvas 网关的真实计费链路：",
  "token 用量估算、成本换算、积分扣减与成本看板落库。",
];
const EMB_DIM = 16;

const server = createServer((req, res) => {
  if (req.method !== "POST" || !req.url) {
    res.writeHead(404); res.end();
    return;
  }
  const pathname = new URL(req.url, "http://127.0.0.1").pathname;

  // Anthropic：x-api-key；OpenAI：Bearer
  const authed =
    pathname.endsWith("/messages")
      ? (req.headers["x-api-key"] ?? "").length > 0
      : (req.headers.authorization ?? "").startsWith("Bearer ");
  if (!authed) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "missing credential" }));
    return;
  }

  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    let parsed = {};
    try { parsed = JSON.parse(body || "{}"); } catch { /* ignore */ }

    if (req.headers["x-mock-fail"] === "1") {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "mock upstream failure" }));
      return;
    }
    if (FAIL_STATUS > 0 && failCount < 1) {
      failCount++;
      res.writeHead(FAIL_STATUS, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `mock status ${FAIL_STATUS}` }));
      return;
    }

    if (pathname.endsWith("/embeddings")) {
      const n = Array.isArray(parsed.input) ? parsed.input.length : 1;
      const data = Array.from({ length: n }, (_, i) => ({
        object: "embedding",
        index: i,
        embedding: Array.from({ length: EMB_DIM }, (_, j) => Math.sin(i * 10 + j) / 3),
      }));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ object: "list", model: parsed.model ?? "text-embedding-3-small", data, usage: { prompt_tokens: 10, total_tokens: 10 } }));
      return;
    }

    const model = parsed.model ?? "gpt-4o-mini";
    const text = REPLIES.join(" ");

    if (pathname.endsWith("/messages")) {
      // Anthropic SSE
      res.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      const sse = (event, payload) => `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
      res.write(sse("message_start", { type: "message_start", message: { id: "msg_1", model, content: [], usage: { input_tokens: 8, output_tokens: 0 } } }));
      res.write(sse("content_block_start", { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } }));
      let i = 0;
      const step = 2;
      const timer = setInterval(() => {
        if (i >= text.length) {
          clearInterval(timer);
          res.write(sse("content_block_stop", { type: "content_block_stop", index: 0 }));
          res.write(sse("message_delta", { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 25 } }));
          res.write(sse("message_stop", { type: "message_stop" }));
          res.end();
          return;
        }
        res.write(sse("content_block_delta", { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: text.slice(i, i + step) } }));
        i += step;
      }, 12);
      return;
    }

    // OpenAI /chat/completions 流式
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(`data: ${JSON.stringify({ id: "chatcmpl-1", object: "chat.completion.chunk", model, choices: [{ index: 0, delta: { role: "assistant" } }] })}\n\n`);
    let i = 0;
    const step = 2;
    const timer = setInterval(() => {
      if (i >= text.length) {
        clearInterval(timer);
        res.write(`data: ${JSON.stringify({ id: "chatcmpl-1", object: "chat.completion.chunk", model, choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n`);
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
      res.write(`data: ${JSON.stringify({ id: "chatcmpl-1", object: "chat.completion.chunk", model, choices: [{ index: 0, delta: { content: text.slice(i, i + step) } }] })}\n\n`);
      i += step;
    }, 12);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`OPENAI_MOCK_READY http://127.0.0.1:${PORT}/v1 (fail_status=${FAIL_STATUS}, anthropic=on)`);
});
