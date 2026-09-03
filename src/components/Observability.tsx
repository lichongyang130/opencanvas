"use client";

import { useEffect } from "react";

let lastCapture = 0;
const MIN_INTERVAL = 10_000;

/** 上报一次运行时错误（节流，避免错误风暴淹没日志） */
function report(payload: { message: string; source?: string; stack?: string; url?: string }) {
  const now = Date.now();
  if (now - lastCapture < MIN_INTERVAL) return;
  lastCapture = now;
  fetch("/api/logs/client", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    /* 上报失败静默 */
  });
}

/**
 * 可观测性开关注入：捕获全局 error / unhandledrejection，上报到服务端。
 * 挂在根 layout，覆盖所有页面。
 */
export default function Observability() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      report({
        message: e.message?.slice(0, 500) || "Unknown error",
        source: e.filename ? e.filename.split("/").pop()?.slice(0, 100) ?? "" : "",
        stack: e.error?.stack?.slice(0, 3000) ?? "",
        url: window.location.href,
      });
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const err = e.reason as { message?: string; stack?: string } | string | undefined;
      report({
        message: typeof err === "string" ? err.slice(0, 500) : (err?.message?.slice(0, 500) ?? "Unhandled rejection"),
        stack: typeof err !== "string" ? (err?.stack?.slice(0, 3000) ?? "") : "",
        url: window.location.href,
      });
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
