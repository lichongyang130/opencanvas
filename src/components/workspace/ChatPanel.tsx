"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, Copy, ImageIcon, Sparkles, Square } from "lucide-react";
import { useChatStore, MODE_LABELS, type WorkspaceMode, type UIMessage } from "@/lib/store/chat";
import { Markdown } from "./Markdown";
import { toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";

const EXAMPLES: Record<WorkspaceMode, string[]> = {
  chat: ["帮我写一封商务合作邮件", "解释一下什么是 RAG", "把这段话翻译成英文"],
  research: ["研究 2025 年 AI 搜索赛道的竞争格局", "调研美国精品咖啡市场规模与趋势"],
  slides: ["为「AI 写作助手产品发布会」生成一套 10 页 PPT", "做一份季度经营复盘 PPT 大纲"],
  image: [
    "一只戴宇航头盔的柯基在月球上，电影感海报",
    "新中式茶饮品牌的社媒宣传图，清新水彩风",
    "赛博朋克风格的未来城市夜景，霓虹灯",
  ],
  video: ["为新款降噪耳机写一条 15 秒带货短视频脚本", "生成咖啡品牌上市的短视频分镜"],
  docs: ["写一份 SaaS 产品商业计划书", "起草一份远程办公管理制度"],
};

const IMAGE_SIZES = [
  { id: "1024x1024", label: "方形 1:1" },
  { id: "1792x1024", label: "横版 16:9" },
  { id: "1024x1792", label: "竖版 9:16" },
];

const IMAGE_STYLES = [
  "电影感海报",
  "3D 渲染",
  "水彩手绘",
  "赛博朋克",
  "极简扁平",
  "新中式国风",
  "吉卜力动画风",
  "产品摄影",
];

function MessageBubble({ m }: { m: UIMessage }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(m.content).then(
      () => {
        setCopied(true);
        toast("已复制", "success");
        setTimeout(() => setCopied(false), 1500);
      },
      () => toast("复制失败", "error")
    );
  };
  const isUser = m.role === "user";

  return (
    <div className={cn("group/msg flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-brand-600 text-white"
            : m.error
              ? "border border-red-200 bg-red-50 text-red-700"
              : "border border-stone-200 bg-white text-stone-800",
          m.streaming && !m.content && "text-stone-400"
        )}
      >
        {m.streaming && !m.content ? (
          "正在思考…"
        ) : isUser ? (
          <div className="whitespace-pre-wrap">{m.content}</div>
        ) : (
          <div className="markdown-body">
            <Markdown content={m.content} />
            {m.streaming && <span className="streaming-cursor" />}
          </div>
        )}
        {!m.streaming && m.content && (
          <div
            className={cn(
              "mt-1.5 flex justify-end opacity-0 transition group-hover/msg:opacity-100",
              isUser && "justify-start"
            )}
          >
            <button
              onClick={copy}
              title="复制"
              className={cn(
                "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] transition",
                isUser ? "text-white/70 hover:bg-white/10" : "text-stone-400 hover:bg-stone-100"
              )}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "已复制" : "复制"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatPanel() {
  const { conversations, activeId, send, sending, stopGeneration } = useChatStore();
  const convo = conversations.find((c) => c.id === activeId);
  const [input, setInput] = useState("");
  const [imgSize, setImgSize] = useState("1024x1024");
  const [showJump, setShowJump] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 切换会话/新建时聚焦输入框
  useEffect(() => {
    if (messages.length === 0) inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const messages = convo?.messages ?? [];
  const mode: WorkspaceMode = convo?.mode ?? "chat";

  const scrollToBottom = (smooth = true) =>
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: smooth ? "smooth" : "auto" });

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // 流式更新时跟随 + 判断是否显示「回到底部」
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      setShowJump(!nearBottom);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (sending) scrollToBottom();
  }, [messages[messages.length - 1]?.content]);

  const submit = () => {
    if (!input.trim() || sending) return;
    const text = input;
    setInput("");
    if (mode === "image") {
      void useChatStore.getState().generateImage(text, imgSize);
    } else {
      void send(text);
    }
  };

  return (
    <div className="relative flex min-w-0 flex-1 flex-col bg-stone-50">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto w-full max-w-2xl">
          {messages.length === 0 ? (
            <div className="pt-10">
              <div className="mb-2 flex items-center gap-2 text-2xl font-semibold tracking-tight">
                {mode === "image" ? (
                  <ImageIcon className="h-6 w-6 text-brand-600" />
                ) : (
                  <Sparkles className="h-6 w-6 text-brand-600" />
                )}
                {MODE_LABELS[mode]}
              </div>
              <p className="mb-8 text-stone-500">
                {mode === "image"
                  ? "描述你想要的画面，AI 生成图像并展示在右侧画布。"
                  : "输入需求，AI 自动完成。产物（文档 / PPT / 图片 / 报告）会实时出现在右侧画布。"}
              </p>
              <div className="grid gap-2.5">
                {(EXAMPLES[mode] ?? EXAMPLES.chat).map((ex) => (
                  <button
                    key={ex}
                    onClick={() =>
                      mode === "image"
                        ? void useChatStore.getState().generateImage(ex, imgSize)
                        : void send(ex)
                    }
                    className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-left text-sm text-stone-700 transition hover:border-brand-300 hover:bg-brand-50/40"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((m) => (
                <MessageBubble key={m.id} m={m} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 回到底部 */}
      {showJump && messages.length > 0 && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-500 shadow-md transition hover:text-brand-600"
        >
          ↓ 回到底部
        </button>
      )}

      <div className="border-t border-stone-200 bg-white px-6 py-4">
        <div className="mx-auto w-full max-w-2xl">
          {mode === "image" && (
            <div className="mb-2 space-y-1.5">
              <div className="flex items-center gap-1.5">
                {IMAGE_SIZES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setImgSize(s.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition",
                      imgSize === s.id
                        ? "border-brand-500 bg-brand-50 font-medium text-brand-700"
                        : "border-stone-200 text-stone-500 hover:border-brand-300"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-stone-400">风格：</span>
                {IMAGE_STYLES.map((st) => (
                  <button
                    key={st}
                    onClick={() =>
                      setInput((v) => (v.trim() ? v.replace(/[，,。\s]*$/, "") + "，" + st : st))
                    }
                    className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] text-stone-600 transition hover:bg-brand-100 hover:text-brand-700"
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-end gap-2 rounded-2xl border border-stone-200 bg-white p-2 shadow-sm focus-within:border-brand-400">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
              placeholder={
                mode === "image"
                  ? "描述画面：主体 + 风格 + 构图，Enter 生成"
                  : `${MODE_LABELS[mode]}：描述你的需求，Enter 发送 / Shift+Enter 换行`
              }
              className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-stone-400"
            />
            {sending ? (
              <button
                onClick={stopGeneration}
                title="停止生成"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-700 text-white transition hover:bg-stone-800"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="mt-2 text-center text-xs text-stone-400">
            {mode === "image"
              ? "演示绘图为本地占位图 · 配置图像模型密钥后生成真实图片"
              : "Enter 发送 · Shift+Enter 换行 · 生成中可点停止"}
          </div>
        </div>
      </div>
    </div>
  );
}
