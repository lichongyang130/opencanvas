"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ShellSidebar } from "./ShellSidebar";
import { Markdown } from "@/components/workspace/Markdown";
import { ModelSelector } from "@/components/workspace/ModelSelector";
import { SettingsModal } from "@/components/workspace/SettingsModal";
import { ArtifactPanel } from "@/components/workspace/ArtifactPanel";
import { useChatStore, type UIMessage, type WorkspaceMode } from "@/lib/store/chat";
import { toast } from "@/lib/store/toast";
import { Toaster } from "@/components/Toaster";
import {
  ArrowUp,
  Bot,
  BrainCircuit,
  ChevronDown,
  Copy,
  Database,
  FileText,
  Globe,
  Home,
  LayoutGrid,
  LayoutTemplate,
  MessageSquare,
  Paperclip,
  PanelRight,
  RefreshCw,
  Settings,
  Share2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Wrench,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import CreditsBadge from "@/components/CreditsBadge";

/* ────────────────────────────────────────────────
 *  AI 对话工作台（保持设计稿 1:1 视觉，接真实数据流）
 *  - 左侧最近对话来自真实会话 store
 *  - 消息流来自 /api/chat（SSE 流式）
 * ──────────────────────────────────────────────── */

const NAV_ITEMS = [
  { icon: Home, label: "首页", route: "/" },
  { icon: MessageSquare, label: "AI 对话", route: "/chat" },
  { icon: Bot, label: "智能体", route: "/agents" },
  { icon: Database, label: "知识库", route: "/knowledge" },
  { icon: FileText, label: "文档中心", route: "/chat" },
  { icon: LayoutTemplate, label: "模板中心", route: "/chat" },
  { icon: Wrench, label: "工具箱", route: "/chat" },
  { icon: LayoutGrid, label: "更多应用", route: "/chat" },
];

const QUICK_SUGGESTIONS = [
  "帮我写一篇关于时间管理的文章",
  "分析一下这个文件的内容",
  "生成一个营销活动的创意方案",
  "解释这个概念：区块链技术",
];

function AILogo() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-blue-500 text-white">
      <Sparkles className="h-3 w-3" />
    </span>
  );
}

function UserBubble({ msg }: { msg: UIMessage }) {
  const time = new Date(Number(msg.id.split("-")[0]) || Date.now()).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="flex items-start justify-end gap-3">
      <div className="max-w-[640px]">
        <p className="mb-1 text-right text-[11px] text-stone-400">{time}</p>
        <div className="rounded-xl rounded-tr-sm bg-[var(--oc-brand-tint)] px-4 py-3 text-[14px] leading-6 text-stone-800">
          {msg.content}
        </div>
      </div>
      <Image
        src="/avatar.png"
        alt="Alex Chen"
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 rounded-full object-cover"
      />
    </div>
  );
}

function AIBubble({ msg }: { msg: UIMessage }) {
  const [copied, setCopied] = useState(false);
  const time = new Date(Number(msg.id.split("-")[0]) || Date.now()).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const copy = () => {
    navigator.clipboard?.writeText(msg.content).then(() => {
      setCopied(true);
      toast("已复制", "success");
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="flex items-start gap-3">
      <AILogo />
      <div className="min-w-0 max-w-[840px] flex-1">
        <div className="rounded-xl rounded-tl-sm border border-[var(--oc-border-strong)] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="mb-2 text-xs text-stone-400">AI 助手 {time}</p>
          {msg.error ? (
            <p className="text-[13px] text-red-600">{msg.content}</p>
          ) : (
            <div className="markdown-body text-[14px] leading-7 text-stone-800">
              <Markdown content={msg.content} />
              {msg.streaming && <span className="streaming-cursor" />}
            </div>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-3 px-1 text-stone-300">
          <button
            onClick={copy}
            title="复制"
            className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-stone-100 hover:text-stone-500"
          >
            {copied ? <ThumbsUp className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-stone-100 hover:text-stone-500">
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-stone-100 hover:text-stone-500">
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-stone-100 hover:text-stone-500">
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceMockChat() {
  const {
    hydrated,
    hydrate,
    conversations,
    activeId,
    sending,
    send,
    stopGeneration,
    newConversation,
    selectConversation,
    model,
    setModel,
    settingsOpen,
    setSettingsOpen,
    artifactOpen,
    setArtifactOpen,
    sendKey,
  } = useChatStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const convo = conversations.find((c) => c.id === activeId);
  const messages = convo?.messages ?? [];
  const list = conversations.filter((c) => !c.archived).slice(0, 5);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // 消费首页带来的意图（sessionStorage 传递，避免 URL 泄漏长文本）
  useEffect(() => {
    if (!hydrated) return;
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem("oc:homeIntent");
      if (raw) sessionStorage.removeItem("oc:homeIntent");
    } catch {}
    if (!raw) return;
    try {
      const intent = JSON.parse(raw) as {
        type: "send" | "fill" | "mode" | "new" | "convo" | "preview";
        mode?: WorkspaceMode;
        text?: string;
        id?: string;
        ts?: number;
      };
      // 超过 30 秒的意图视为过期
      if (intent.ts && Date.now() - intent.ts > 30_000) return;
      const store = useChatStore.getState();
      switch (intent.type) {
        case "send":
          if (intent.text) void store.runTemplate({ mode: intent.mode ?? "chat", prompt: intent.text });
          break;
        case "fill":
          void store.fillTemplate({ mode: intent.mode ?? "chat", prompt: intent.text ?? "" });
          break;
        case "mode":
          void store.newConversation(intent.mode ?? "chat").then((id) => store.selectConversation(id));
          break;
        case "new":
          void store.newConversation().then((id) => store.selectConversation(id));
          break;
        case "convo":
          if (intent.id) void store.selectConversation(intent.id);
          break;
        case "preview":
          store.setArtifactOpen(true);
          break;
      }
    } catch {}
  }, [hydrated]);

  const lastContent = messages[messages.length - 1]?.content;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !sending) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [lastContent, sending]);

  const startNew = () => {
    void newConversation().then((id) => selectConversation(id));
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text) {
      toast("请先输入你的问题或需求", "info");
      return;
    }
    setInput("");
    void send(text);
  };

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--oc-bg)]">
        <Sparkles className="h-6 w-6 animate-pulse text-[var(--oc-brand)]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--oc-bg)] text-stone-800">
      <ShellSidebar active="chat" />

      {/* 主区域 */}
      <main className="relative flex min-w-0 flex-1 flex-col">
        {/* 顶栏 */}
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--oc-border-soft)] bg-[var(--oc-bg)] px-6 py-4">
          <div>
            <h1 className="text-[18px] font-semibold text-stone-900">AI 对话</h1>
            <p className="mt-0.5 text-[12.5px] text-stone-400">
              {convo ? `与 AI 助手的智能对话 · ${convo.title}` : "与 AI 助手的智能对话"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <CreditsBadge />
            <button
              onClick={() => setSettingsOpen(true)}
              title="设置"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white hover:text-stone-700"
            >
              <Settings className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={() => setArtifactOpen(!artifactOpen)}
              title={artifactOpen ? "隐藏右侧产物预览" : "开启右侧产物预览"}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                artifactOpen
                  ? "bg-white text-[var(--oc-brand)] shadow-sm"
                  : "text-stone-400 hover:bg-white hover:text-stone-700"
              }`}
            >
              <PanelRight className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={startNew}
              className="ml-2 rounded-xl px-4 py-2 text-[13.5px] font-medium text-[var(--oc-brand)] transition hover:bg-[var(--oc-brand-hover)]"
            >
              新建任务
            </button>
          </div>
        </header>

        {/* 对话流 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-10 py-6">
          <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-7">
            {messages.length === 0 ? (
              <>
                {/* 欢迎 */}
                <AIBubble
                  msg={{
                    id: `welcome-0`,
                    role: "assistant",
                    content: "你好，Alex! 👋\n\n我是你的 AI 助手，有什么可以帮你的吗？你可以问我任何问题，或者让我帮你完成各种任务。",
                  }}
                />
              </>
            ) : (
              messages.map((m) =>
                m.role === "user" ? <UserBubble key={m.id} msg={m} /> : <AIBubble key={m.id} msg={m} />
              )
            )}
            {sending && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex items-start gap-3">
                <AILogo />
                <div className="rounded-xl rounded-tl-sm border border-[var(--oc-border-strong)] bg-white px-4 py-3 text-[14px] text-stone-400 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  正在思考…
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 快捷建议 + 输入舱 */}
        <div className="shrink-0 px-10 pb-6">
          <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-4">
            {/* 快捷建议 */}
            <div className="flex flex-wrap items-center gap-2">
              {QUICK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="rounded-full border border-[var(--oc-border)] bg-white px-3.5 py-1.5 text-[12.5px] text-stone-500 shadow-sm transition hover:border-[var(--oc-brand-border)] hover:text-[var(--oc-brand)]"
                >
                  {s}
                </button>
              ))}
              <button className="ml-1 flex items-center gap-1 rounded-full px-2 py-1.5 text-[12px] text-stone-400 transition hover:text-[var(--oc-brand)]">
                换一批 <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* 输入舱 */}
            <div className="rounded-2xl border border-[var(--oc-border)] bg-white p-4 shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  const isSend =
                    sendKey === "ctrlEnter"
                      ? e.key === "Enter" && !e.shiftKey && (e.ctrlKey || e.metaKey)
                      : e.key === "Enter" && !e.shiftKey;
                  if (isSend) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                rows={2}
                placeholder="输入你的问题或需求，按 Enter 发送，Shift + Enter 换行"
                className="w-full resize-none bg-transparent text-[14px] leading-7 text-stone-800 outline-none placeholder:text-stone-400"
              />
              <div className="mt-1 flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <button className="flex items-center gap-1.5 rounded-full border border-[var(--oc-border)] px-3.5 py-2 text-[13px] text-stone-600 transition hover:border-[var(--oc-brand-border)] hover:text-[var(--oc-brand)]">
                    <BrainCircuit className="h-4 w-4" /> 深度思考 <ChevronDown className="h-3 w-3 text-stone-400" />
                  </button>
                  <button className="flex items-center gap-1.5 rounded-full border border-[var(--oc-border)] px-3.5 py-2 text-[13px] text-stone-600 transition hover:border-[var(--oc-brand-border)] hover:text-[var(--oc-brand)]">
                    <Globe className="h-4 w-4" /> 联网搜索
                  </button>
                  <button className="flex items-center gap-1.5 rounded-full border border-[var(--oc-border)] px-3.5 py-2 text-[13px] text-stone-600 transition hover:border-[var(--oc-brand-border)] hover:text-[var(--oc-brand)]">
                    <FileText className="h-4 w-4" /> 上传文件
                  </button>
                  <button className="flex items-center gap-1.5 rounded-full border border-[var(--oc-border)] px-3.5 py-2 text-[13px] text-stone-600 transition hover:border-[var(--oc-brand-border)] hover:text-[var(--oc-brand)]">
                    <Bot className="h-4 w-4" /> 选择智能体
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <ModelSelector
                    value={model}
                    onChange={(id, provider) => setModel(id, provider)}
                  />
                  <button
                    onClick={() => setSettingsOpen(true)}
                    title="配置模型 API Key"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100"
                  >
                    <Paperclip className="h-[18px] w-[18px]" />
                  </button>
                  {sending ? (
                    <button
                      onClick={stopGeneration}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-700 text-white shadow-md transition hover:bg-stone-800"
                    >
                      <span className="block h-3.5 w-3.5 rounded-sm bg-white" />
                    </button>
                  ) : (
                    <button
                      onClick={sendMessage}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-md shadow-orange-200 transition hover:brightness-105 active:scale-95"
                    >
                      <ArrowUp className="h-5 w-5" strokeWidth={2.4} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 右侧产物预览（AI 创作画布） */}
      <ArtifactPanel />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Toaster />
    </div>
  );
}
