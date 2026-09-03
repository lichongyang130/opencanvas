"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clapperboard,
  Download,
  Film,
  Loader2,
  RefreshCw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { ShellSidebar } from "@/components/mockup/ShellSidebar";
import { useI18n } from "@/lib/i18n";
import { toast } from "@/lib/store/toast";
import { Toaster } from "@/components/Toaster";
import NotificationBell from "@/components/NotificationBell";
import CreditsBadge from "@/components/CreditsBadge";

interface VideoResult {
  ok?: boolean;
  url: string;
  mock: boolean;
  model: string;
  provider: string;
  durationSec: number;
  width: number;
  height: number;
  error?: string;
}

interface VideoModelInfo {
  id: string;
  label: string;
  provider: string;
  providerLabel: string;
  region: string;
  creditsPerVideo: number;
  maxDurationSec: number;
}

const PRESETS = [
  "赛博朋克城市夜景，霓虹灯在雨幕中流动",
  "极简几何图形在纯色背景上律动，柔和渐变",
  "深海世界，光斑与气泡缓缓上升",
  "金色粒子汇聚成漩涡，梦幻氛围",
];

export default function VideoStudioPage() {
  const { tt } = useI18n();
  const router = useRouter();
  const [prompt, setPrompt] = useState(PRESETS[0]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VideoResult | null>(null);
  const [error, setError] = useState("");
  const [models, setModels] = useState<VideoModelInfo[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/video/status");
      if (res.ok) {
        const data = (await res.json()) as { models: VideoModelInfo[] };
        setModels(data.models ?? []);
      }
    } catch {
      /* 状态加载失败不阻塞使用 */
    }
  }, []);

  useEffect(() => {
    void loadStatus();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loadStatus]);

  const stopProgress = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const generate = async () => {
    const p = prompt.trim();
    if (!p) {
      toast(tt("请先输入视频描述"), "info");
      return;
    }
    if (loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    setProgress(0);
    stopProgress();
    timerRef.current = setInterval(() => {
      setProgress((v) => Math.min(92, v + 2 + Math.random() * 6));
    }, 160);

    try {
      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: p, model: "demo-video" }),
      });
      const data = (await res.json()) as VideoResult;
      if (!res.ok || data.error) throw new Error(data.error || tt("生成失败"));
      setProgress(100);
      setResult(data);
      toast(tt("视频生成完成（演示模式，免费）"), "success");
    } catch (e) {
      setError(e instanceof Error ? e.message : tt("生成失败"));
      toast(e instanceof Error ? e.message : tt("生成失败"), "error");
    } finally {
      stopProgress();
      setLoading(false);
    }
  };

  const download = async () => {
    if (!result) return;
    try {
      const blobRes = await fetch(result.url);
      const blob = await blobRes.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `opencanvas-${result.model}-${Date.now()}.gif`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      toast(tt("已开始下载 GIF"), "success");
    } catch {
      toast(tt("下载失败"), "error");
    }
  };

  const mockModel = models.find((m) => m.id === "demo-video");

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--oc-bg)] text-stone-800">
      <ShellSidebar active="tools" />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--oc-border-soft)] bg-[var(--oc-bg)] px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/tools")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--oc-border)] bg-white text-stone-500 transition hover:bg-[var(--oc-hover)]"
              aria-label={tt("返回工具中心")}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="flex items-center gap-2 text-[18px] font-semibold text-stone-900">
                <Clapperboard className="h-5 w-5 text-[var(--oc-brand)]" />
                {tt("AI 视频生成")}
              </h1>
              <p className="mt-0.5 text-[12.5px] text-stone-400">
                {tt("输入描述生成 3 秒可循环短片；当前为内置演示引擎（零密钥可用），真实模型接入后可切换")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <CreditsBadge />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-5">
          <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
            {/* 参数面板 */}
            <div className="flex flex-col gap-4">
              <section className="rounded-2xl border border-[var(--oc-border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                <label className="text-[13px] font-semibold text-stone-700">{tt("视频描述")}</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  maxLength={500}
                  rows={5}
                  placeholder={tt("例如：海浪拍打礁石，金色夕阳下，4K 电影感")}
                  className="mt-2 w-full resize-none rounded-xl border border-[var(--oc-border)] bg-white px-3.5 py-3 text-[13px] leading-6 text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-[var(--oc-brand-border)]"
                />
                <div className="mt-1 flex items-center justify-between text-[11px] text-stone-400">
                  <span>{tt("支持画面风格、主体、氛围、镜头描述")}</span>
                  <span>{prompt.length}/500</span>
                </div>

                <p className="mt-3 text-[11.5px] font-medium text-stone-400">{tt("试试：")}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPrompt(p)}
                      className={`max-w-full truncate rounded-full border px-2.5 py-1 text-[11px] transition ${
                        prompt === p
                          ? "border-[var(--oc-brand-border)] bg-[var(--oc-brand-faint,var(--oc-brand-hover))] text-[var(--oc-brand)]"
                          : "border-[var(--oc-border)] bg-white text-stone-500 hover:bg-[var(--oc-hover)]"
                      }`}
                    >
                      {tt(p)}
                    </button>
                  ))}
                </div>

                <button
                  onClick={generate}
                  disabled={loading}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--oc-brand)] px-4 py-2.5 text-[13.5px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> 生成中 {Math.round(progress)}%
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> {tt("生成视频（免费演示）")}
                    </>
                  )}
                </button>

                {loading && (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-[var(--oc-brand)] transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-[var(--oc-border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                <h2 className="flex items-center gap-1.5 text-[13px] font-semibold text-stone-700">
                  <Film className="h-4 w-4 text-stone-400" /> {tt("生成引擎")}
                </h2>
                <ul className="mt-3 space-y-2">
                  {models.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between rounded-xl border border-[var(--oc-border-soft)] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-medium text-stone-700">{m.label}</p>
                        <p className="text-[11px] text-stone-400">
                          {m.providerLabel}
                          {m.creditsPerVideo > 0 ? ` · ${m.creditsPerVideo} 积分/次` : ` · ${tt("免费")}`}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          m.provider === "demo"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-stone-100 text-stone-400"
                        }`}
                      >
                        {m.provider === "demo" ? tt("可用") : tt("待接入")}
                      </span>
                    </li>
                  ))}
                  {models.length === 0 && (
                    <li className="text-[12px] text-stone-400">{tt("引擎状态加载中…")}</li>
                  )}
                </ul>
                <p className="mt-3 text-[11px] leading-5 text-stone-400">
                  {tt("演示引擎在本机合成程序化动画，无需任何外部 Key；FAL / 万相视频将复用同一前端与计费通道。")}
                </p>
              </section>
            </div>

            {/* {tt("预览")}面板 */}
            <section className="flex min-h-[420px] flex-col rounded-2xl border border-[var(--oc-border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-stone-700">{tt("预览")}</h2>
                {result && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-600">
                    {result.mock ? tt("演示视频") : tt("真实视频")}
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-1 items-center justify-center overflow-hidden rounded-xl bg-[#0e1116] p-4">
                {loading && (
                  <div className="text-center text-stone-500">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    <p className="mt-3 text-[12.5px]">{tt("正在合成动画帧…")}</p>
                  </div>
                )}
                {!loading && !result && !error && (
                  <div className="text-center text-stone-500">
                    <Clapperboard className="mx-auto h-10 w-10 text-stone-600" />
                    <p className="mt-3 text-[13px]">{tt("生成后可在此预览并下载")}</p>
                    <p className="mt-1 text-[11.5px] text-stone-600">
                      {tt("输入描述后点击「生成视频」")}
                    </p>
                  </div>
                )}
                {!loading && result && (
                  <div className="w-full">
                    <img
                      src={result.url}
                      alt={prompt}
                      className="mx-auto max-h-[440px] w-auto max-w-full rounded-lg shadow-2xl"
                      style={{ imageRendering: "auto" }}
                    />
                    <p className="mt-3 text-center text-[11.5px] text-stone-400">
                      自动循环播放 · {result.width}×{result.height} · {result.durationSec}s ·{" "}
                      {result.model}
                    </p>
                    <div className="mt-3 flex justify-center gap-2">
                      <button
                        onClick={() => setResult(null)}
                        className="flex items-center gap-1.5 rounded-xl border border-[var(--oc-border)] bg-white px-4 py-2 text-[12.5px] font-medium text-stone-600 transition hover:bg-[var(--oc-hover)]"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> {tt("换一个描述")}
                      </button>
                      <button
                        onClick={download}
                        className="flex items-center gap-1.5 rounded-xl bg-[var(--oc-brand)] px-4 py-2 text-[12.5px] font-semibold text-white transition hover:opacity-90"
                      >
                        <Download className="h-3.5 w-3.5" /> {tt("下载 GIF")}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[12.5px] text-red-600">
                  <TriangleAlert className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <p className="mt-4 text-[11px] leading-5 text-stone-400">
                {tt("演示模式为程序化动画（GIF），无外部生成成本；真实视频模型接入后将在此展示 MP4 并扣除对应积分。")}
              </p>
            </section>
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
