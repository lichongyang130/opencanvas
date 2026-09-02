"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, Sparkles, X } from "lucide-react";
import { useChatStore } from "@/lib/store/chat";
import { toast } from "@/lib/store/toast";
import { Toaster } from "@/components/Toaster";

interface SharedAgent {
  id: string;
  name: string;
  desc: string;
  category: string;
  emoji: string;
  system: string;
  starter: string;
  createdAt: number;
  updatedAt: number;
}

export default function ShareAgentPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const { startAgent, hydrated } = useChatStore();
  const [agent, setAgent] = useState<SharedAgent | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    fetch(`/api/agents/share/${params.code}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("missing");
        const data = (await r.json()) as { agent?: SharedAgent };
        if (!data.agent) throw new Error("missing");
        setAgent(data.agent);
        setState("ok");
      })
      .catch(() => setState("missing"));
  }, [params.code]);

  const handleUse = async () => {
    if (!agent) return;
    await startAgent({
      id: agent.id,
      name: agent.name,
      emoji: agent.emoji,
      system: agent.system,
      starter: agent.starter,
      builtin: false,
    });
    toast(`已载入「${agent.name}」，开始对话吧`, "success");
    router.push("/chat");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--oc-bg)] text-stone-800">
      {/* 顶栏 */}
      <header className="flex items-center justify-between border-b border-[var(--oc-border-soft)] bg-[var(--oc-bg)] px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500 text-[17px] text-white shadow-sm">
            {agent?.emoji ?? "🤖"}
          </span>
          <div>
            <p className="text-[15px] font-semibold text-stone-900">OpenCanvas</p>
            <p className="text-[11px] text-stone-400">共享智能体</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/agents")}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] text-stone-500 transition hover:bg-white hover:text-stone-700"
        >
          <ArrowLeft className="h-4 w-4" /> 返回智能体中心
        </button>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 py-10">
        {state === "loading" && (
          <div className="mt-20 flex flex-col items-center text-stone-400">
            <Sparkles className="h-6 w-6 animate-pulse text-[var(--oc-brand-border)]" />
            <p className="mt-3 text-[13px]">正在加载共享智能体…</p>
          </div>
        )}

        {state === "missing" && (
          <div className="mt-20 flex w-full max-w-md flex-col items-center rounded-2xl border border-[var(--oc-border)] bg-white px-8 py-14 text-center shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
              <X className="h-6 w-6" />
            </span>
            <p className="mt-4 text-[15px] font-semibold text-stone-700">分享不存在或已失效</p>
            <p className="mt-1.5 text-[12.5px] text-stone-400">该智能体可能已被作者删除或取消了分享</p>
            <button
              onClick={() => router.push("/agents")}
              className="mt-5 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 px-5 py-2 text-[13px] font-medium text-white shadow-sm transition hover:brightness-105"
            >
              去智能体中心看看
            </button>
          </div>
        )}

        {state === "ok" && agent && (
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--oc-border)] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
            {/* 头部 */}
            <div className="relative bg-gradient-to-br from-[var(--oc-brand-tint)] to-[var(--oc-bg)] px-7 pb-6 pt-7">
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[34px] shadow-sm">
                  {agent.emoji}
                </span>
                <div className="min-w-0">
                  <p className="text-[17px] font-semibold text-stone-900">{agent.name}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 已共享 · 随时可用
                  </p>
                  <span className="mt-1.5 inline-block rounded-md bg-[var(--oc-brand-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--oc-brand)]">
                    {agent.category}
                  </span>
                </div>
              </div>
              <p className="mt-4 text-[13px] leading-6 text-stone-600">{agent.desc || "一个被分享的 AI 智能体"}</p>
            </div>

            {/* 内容 */}
            <div className="space-y-4 px-7 py-5">
              {agent.system && (
                <div>
                  <p className="text-[12.5px] font-semibold text-stone-700">它如何工作</p>
                  <p className="mt-1.5 whitespace-pre-wrap rounded-xl border border-[var(--oc-border-soft)] bg-[var(--oc-hover)] px-3.5 py-3 text-[12.5px] leading-5 text-stone-500">
                    {agent.system}
                  </p>
                </div>
              )}
              {agent.starter && (
                <div>
                  <p className="text-[12.5px] font-semibold text-stone-700">开场白</p>
                  <p className="mt-1.5 rounded-xl border border-[var(--oc-border-soft)] bg-[var(--oc-hover)] px-3.5 py-3 text-[12.5px] text-stone-600">
                    “{agent.starter}”
                  </p>
                </div>
              )}
            </div>

            {/* 底部操作 */}
            <div className="flex items-center gap-2 border-t border-[var(--oc-border-soft)] bg-[var(--oc-bg)] px-7 py-4">
              <button
                onClick={() => router.push("/agents")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--oc-border)] bg-white py-2.5 text-[13px] font-medium text-stone-600 transition hover:border-[var(--oc-brand-border)]"
              >
                查看全部智能体
              </button>
              <button
                onClick={() => void handleUse()}
                disabled={!hydrated}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 py-2.5 text-[13px] font-medium text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
              >
                <MessageCircle className="h-4 w-4" /> 立即使用
              </button>
            </div>
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
}
