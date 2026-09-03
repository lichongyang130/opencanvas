#!/usr/bin/env node
/**
 * 最小 S3 兼容 Mock（仅沙箱验证 S3 存储驱动链路）：
 * 监听 127.0.0.1:9090，接受 /<bucket>/<key> 的 PUT/GET/HEAD/DELETE，
 * 内存保存对象，不做签名校验（AWS SDK 请求可正常发出并处理响应）。
 * 用法：node scripts/s3-mock.mjs
 */
import { createServer } from "node:http";

const PORT = 9090;
const objects = new Map();

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  const key = decodeURIComponent(url.pathname.replace(/^\//, "")); // bucket/key...
  const method = req.method ?? "";

  if (method === "PUT") {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      objects.set(key, Buffer.concat(chunks));
      res.writeHead(200, { "ETag": `"${Buffer.from(key).toString("hex").slice(0, 16)}"` });
      res.end();
    });
    return;
  }
  if (method === "HEAD") {
    if (objects.has(key)) {
      res.writeHead(200, { "Content-Length": objects.get(key).length });
    } else {
      res.writeHead(404);
    }
    res.end();
    return;
  }
  if (method === "GET") {
    if (objects.has(key)) {
      const buf = objects.get(key);
      res.writeHead(200, { "Content-Type": "application/octet-stream", "Content-Length": buf.length });
      res.end(buf);
    } else {
      res.writeHead(404);
      res.end();
    }
    return;
  }
  if (method === "DELETE") {
    objects.delete(key);
    res.writeHead(204);
    res.end();
    return;
  }
  res.writeHead(405);
  res.end();
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`S3_MOCK_READY http://127.0.0.1:${PORT} (objects=${objects.size})`);
});
