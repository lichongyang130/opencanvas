"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Check,
  Copy,
  FileText,
  ImageIcon,
  Loader2,
  Mail,
  Presentation,
  Search,
  Send,
  Sparkles,
  Square,
  Video,
  Wand2,
} from "lucide-react";
import { useChatStore, MODE_LABELS, type WorkspaceMode, type UIMessage } from "@/lib/store/chat";
import { Markdown } from "./Markdown";
import { PersonaPicker } from "./PersonaPicker";
import { toast } from "@/lib/store/toast";
import { getOverrides } from "@/lib/settings";
import { SLASH_COMMANDS, matchSlash, TONE_CHIPS, LENGTH_CHIPS, AUDIENCE_CHIPS, type PromptChip } from "@/lib/slash";
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

/** 首页功能卡片（参照设计图 3 的宫格） */
const HOME_CARDS: {
  icon: typeof Mail;
  title: string;
  desc: string;
  mode: WorkspaceMode;
  prompt: string;
}[] = [
  { icon: Mail, title: "撰写邮件", desc: "起草清晰、有说服力的商务邮件", mode: "chat", prompt: "帮我写一封商务合作邮件" },
  { icon: FileText, title: "生成文档", desc: "商业计划书 / 制度 / 报告一键成稿", mode: "docs", prompt: "写一份 SaaS 产品商业计划书" },
  { icon: Presentation, title: "制作 PPT", desc: "输入主题，生成整套幻灯片", mode: "slides", prompt: "为产品发布会生成一套 10 页 PPT" },
  { icon: ImageIcon, title: "生成图片", desc: "描述画面，AI 立即出图", mode: "image", prompt: "一只戴宇航头盔的柯基在月球上，电影感海报" },
  { icon: Search, title: "深度研究", desc: "市场 / 竞品 / 行业调研报告", mode: "research", prompt: "研究 2025 年 AI 搜索赛道的竞争格局" },
  { icon: Video, title: "视频脚本", desc: "带货 / 分镜 / 口播脚本", mode: "video", prompt: "为新款降噪耳机写一条 15 秒带货短视频脚本" },
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
  const pendingInput = useChatStore((s) => s.pendingInput);
  const convo = conversations.find((c) => c.id === activeId);
  const [input, setInput] = useState("");
  const [imgSize, setImgSize] = useState("1024x1024");
  const [showJump, setShowJump] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [slashIdx, setSlashIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 斜杠命令菜单
  const slashMatches = matchSlash(input);
  useEffect(() => setSlashIdx(0), [input]);

  // 提示词库「真实案例」点击后：把内容填进输入框（不发送）
  useEffect(() => {
    if (pendingInput) {
      setInput(pendingInput.text);
      inputRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingInput?.nonce]);

  const applyChip = (chip: PromptChip) => {
    setInput((v) => {
      const has = v.includes(chip.suffix);
      if (has) {
        // 移除该约束
        return v.replace(new RegExp(`\\n?${chip.suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g"), "").trimEnd();
      }
      // 斜杠命令进行中时不打扰
      if (v.startsWith("/")) return v;
      return v.trim() ? v.replace(/\s*$/, "") + "\n" + chip.suffix : chip.suffix;
    });
  };
  const chipOn = (c: PromptChip) => input.includes(c.suffix);

  const runSlash = (cmd: (typeof SLASH_COMMANDS)[number]) => {
    if (cmd.kind === "action" && cmd.mode) {
      useChatStore.getState().setMode(cmd.mode);
      setInput("");
      toast(`已切换到${MODE_LABELS[cmd.mode]}工作台`, "info");
      return;
    }
    const raw = input.replace(/^\/[a-z]*\s*/i, "").trim();
    const text = (cmd.insert ?? "").replace("{q}", raw);
    setInput(text);
    // 光标定位到「」中间或末尾
    setTimeout(() => {
      const ta = inputRef.current;
      if (!ta) return;
      const pos = text.includes("「") ? text.indexOf("」") : text.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    }, 0);
  };

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

  /** 一键优化提示词：配置真实模型走 AI 改写，否则用结构化模板 */
  const enhancePrompt = async () => {
    const raw = input.trim();
    if (!raw || enhancing) return;
    setEnhancing(true);
    const ov = getOverrides();
    const hasModel = Object.values(ov).some((p) => p?.apiKey);
    try {
      if (hasModel && mode !== "image") {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: convo?.model ?? "demo",
            overrides: ov,
            messages: [
              {
                role: "system",
                content:
                  "你是提示词专家。把用户粗糙的需求改写成结构清晰、效果更好的中文提示词，包含：角色设定、具体任务、背景/受众、输出格式与约束。只输出改写后的提示词本身，不要解释、不要前后缀。",
              },
              { role: "user", content: raw },
            ],
          }),
        });
        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buf = "";
          let acc = "";
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";
            for (const line of lines) {
              const t = line.trim();
              if (!t.startsWith("data:")) continue;
              let evt: { type: string; delta?: string } | null = null;
              try {
                evt = JSON.parse(t.slice(5).trim()) as { type: string; delta?: string };
              } catch {
                continue;
              }
              if (evt.type === "token" && evt.delta) acc += evt.delta;
            }
          }
          if (acc.trim()) {
            setInput(acc.trim());
            toast("提示词已优化", "success");
            return;
          }
        }
      }
      // 本地模板兜底
      const modeHint: Record<string, string> = {
        image:
          "请输出一段英文绘图提示词，包含：主体细节、艺术风格、构图景别、光线氛围、画质词，用逗号分隔。",
        slides: "请输出一份幻灯片结构：标题、封面副标题、每页标题与 3-4 个要点。",
        research: "请从背景、现状、关键数据、主要玩家、趋势与结论几个方面展开。",
        docs: "请输出结构完整的文档：标题、导语、分小节（含小标题与要点）、结论。",
        video: "请输出分镜脚本：每个镜头含时长、画面、旁白、字幕。",
        chat: "请分点、有条理地回答，必要时给出步骤和示例。",
      };
      const improved = `# 角色
你是该领域的资深专家。

# 任务
${raw}

# 要求
- 面向：相关从业者 / 普通读者（按需）
- 语言：中文，专业且易懂
- 输出：${modeHint[mode] ?? modeHint.chat}
- 约束：内容准确、结构清晰、可直接使用，避免空话`;
      setInput(improved);
      toast(hasModel ? "已生成结构化提示词" : "已生成结构化提示词（配置模型后可 AI 智能改写）", "success");
    } catch {
      toast("优化失败，请重试", "error");
    } finally {
      setEnhancing(false);
    }
  };

  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

  const paramChips = (
    <>
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
                onClick={() => setInput((v) => (v.trim() ? v.replace(/[，,。\s]*$/, "") + "，" + st : st))}
                className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] text-stone-600 transition hover:bg-brand-100 hover:text-brand-700"
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      )}
      {mode !== "image" && !slashMatches && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-stone-400">语气</span>
          {TONE_CHIPS.map((c) => (
            <button
              key={c.id}
              onClick={() => applyChip(c)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] transition",
                chipOn(c) ? "border-brand-400 bg-brand-50 text-brand-700" : "border-stone-200 text-stone-500 hover:border-brand-300"
              )}
            >
              {c.label}
            </button>
          ))}
          <span className="ml-1 text-[11px] text-stone-400">长度</span>
          {LENGTH_CHIPS.map((c) => (
            <button
              key={c.id}
              onClick={() => applyChip(c)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] transition",
                chipOn(c) ? "border-brand-400 bg-brand-50 text-brand-700" : "border-stone-200 text-stone-500 hover:border-brand-300"
              )}
            >
              {c.label}
            </button>
          ))}
          <span className="ml-1 text-[11px] text-stone-400">受众</span>
          {AUDIENCE_CHIPS.map((c) => (
            <button
              key={c.id}
              onClick={() => applyChip(c)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] transition",
                chipOn(c) ? "border-brand-400 bg-brand-50 text-brand-700" : "border-stone-200 text-stone-500 hover:border-brand-300"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </>
  );

  const composer = (
    <div className="relative">
      {slashMatches && (
        <div className="absolute bottom-full left-0 z-20 mb-2 max-h-72 w-72 overflow-y-auto rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl">
          <div className="px-2 py-1 text-[11px] text-stone-400">快捷命令（↑↓ 选择，Enter 执行）</div>
          {slashMatches.length === 0 && (
            <div className="px-2 py-3 text-center text-xs text-stone-400">没有匹配的命令</div>
          )}
          {slashMatches.map((c, i) => (
            <button
              key={c.cmd}
              onMouseDown={(e) => {
                e.preventDefault();
                runSlash(c);
              }}
              onMouseEnter={() => setSlashIdx(i)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left",
                i === slashIdx ? "bg-brand-50" : "hover:bg-stone-50"
              )}
            >
              <span className="flex h-6 w-12 shrink-0 items-center justify-center rounded bg-stone-100 font-mono text-[11px] text-stone-500">
                /{c.cmd}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-medium text-stone-700">{c.label}</span>
                <span className="block truncate text-[11px] text-stone-400">{c.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="rounded-3xl border border-stone-200 bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus-within:border-brand-400 focus-within:shadow-md">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (slashMatches && slashMatches.length > 0) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSlashIdx((i) => (i + 1) % slashMatches.length);
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSlashIdx((i) => (i - 1 + slashMatches.length) % slashMatches.length);
                return;
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                runSlash(slashMatches[Math.min(slashIdx, slashMatches.length - 1)]);
                return;
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setInput("");
                return;
              }
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={
            mode === "image"
              ? "描述你想要的画面…"
              : mode === "chat"
                ? "分配任务，或问我任何事"
                : `${MODE_LABELS[mode]}：描述你的需求…`
          }
          className="max-h-[200px] w-full resize-none bg-transparent px-3 py-2 text-[15px] leading-relaxed outline-none placeholder:text-stone-400"
        />
        <div className="mt-1 flex items-center justify-between px-1.5 pb-0.5">
          <button
            onClick={() => void enhancePrompt()}
            disabled={!input.trim() || enhancing}
            title="优化提示词（结构化为更有效的指令）"
            className="flex h-8 items-center gap-1.5 rounded-full border border-stone-200 px-3 text-xs text-stone-500 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-30"
          >
            {enhancing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            优化
          </button>
          {sending ? (
            <button
              onClick={stopGeneration}
              title="停止生成"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-700 text-white transition hover:bg-stone-800"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!input.trim()}
              title="发送"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:bg-stone-100 disabled:text-stone-300"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative flex min-w-0 flex-1 flex-col bg-[#f9f5ec]">
      <div
        ref={scrollRef}
        className={cn(
          "flex-1 overflow-y-auto px-6",
          messages.length === 0 ? "bg-[#f6f1e9] py-10" : "py-8"
        )}
      >
        <div className={cn("mx-auto w-full", messages.length === 0 ? "max-w-4xl" : "max-w-2xl")}>
          {messages.length === 0 ? (
            <div className="pt-4 text-center">
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#4a2e1d] md:text-4xl">
                欢迎回来，今天想做点什么？
              </h1>
              <p className="mt-2 text-sm text-[#8a7a66]">用 AI 把想法变成现实。</p>

              {/* 唯一输入框：一个输入 + 一个发送，一眼即懂 */}
              <div className="mx-auto mt-8 max-w-xl rounded-3xl border border-[#e8ddca] bg-white p-2 text-left shadow-sm transition focus-within:border-[#c05f3c] focus-within:shadow-md">
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
                  rows={2}
                  placeholder="输入你的任务，回车即可生成。例如：帮我写一份产品发布会 PPT…"
                  className="w-full resize-none bg-transparent px-3 py-2 text-[15px] leading-relaxed text-[#3f2d1e] outline-none placeholder:text-[#b9a98f]"
                />
                <div className="flex items-center justify-end px-1 pb-1">
                  {sending ? (
                    <button
                      onClick={stopGeneration}
                      title="停止"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3f2d1e] text-white"
                    >
                      <Square className="h-4 w-4 fill-current" />
                    </button>
                  ) : (
                    <button
                      onClick={submit}
                      disabled={!input.trim()}
                      title="生成"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c05f3c] text-white transition hover:bg-[#a94f31] disabled:bg-[#eadfce] disabled:text-[#c0b193]"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-[#a8977f]">回车发送 · Shift+回车换行</p>

              {/* 少量示例，一键填入 */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <span className="text-sm text-[#8a7a66]">试试：</span>
                {HOME_CARDS.slice(0, 4).map((q) => (
                  <button
                    key={q.title}
                    onClick={() => {
                      useChatStore.getState().setMode(q.mode);
                      setInput(q.prompt);
                      setTimeout(() => inputRef.current?.focus(), 0);
                    }}
                    className="rounded-full border border-[#e3d8c6] bg-white px-3.5 py-1.5 text-sm text-[#6b5b48] transition hover:border-[#c05f3c] hover:text-[#c05f3c]"
                  >
                    {q.title}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {mode === "chat" && (
                <div className="flex justify-center">
                  <PersonaPicker
                    onStarter={(t) => {
                      setInput(t);
                      setTimeout(() => inputRef.current?.focus(), 0);
                    }}
                  />
                </div>
              )}
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

      {messages.length > 0 && (
      <div className="border-t border-[#e8ddca] bg-[#fdfaf3] px-6 py-4">
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
          {/* 语气 / 长度 / 受众 快捷参数（文字类模式） */}
          {mode !== "image" && !slashMatches && (
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-stone-400">语气</span>
              {TONE_CHIPS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => applyChip(c)}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px] transition",
                    chipOn(c)
                      ? "border-brand-400 bg-brand-50 text-brand-700"
                      : "border-stone-200 text-stone-500 hover:border-brand-300"
                  )}
                >
                  {c.label}
                </button>
              ))}
              <span className="ml-1 text-[11px] text-stone-400">长度</span>
              {LENGTH_CHIPS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => applyChip(c)}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px] transition",
                    chipOn(c)
                      ? "border-brand-400 bg-brand-50 text-brand-700"
                      : "border-stone-200 text-stone-500 hover:border-brand-300"
                  )}
                >
                  {c.label}
                </button>
              ))}
              <span className="ml-1 text-[11px] text-stone-400">受众</span>
              {AUDIENCE_CHIPS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => applyChip(c)}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px] transition",
                    chipOn(c)
                      ? "border-brand-400 bg-brand-50 text-brand-700"
                      : "border-stone-200 text-stone-500 hover:border-brand-300"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
          <div className="relative">
          {/* 斜杠命令菜单 */}
          {slashMatches && (
            <div className="absolute bottom-full left-0 z-20 mb-2 max-h-72 w-72 overflow-y-auto rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl">
              <div className="px-2 py-1 text-[11px] text-stone-400">快捷命令（↑↓ 选择，Enter 执行）</div>
              {slashMatches.length === 0 && (
                <div className="px-2 py-3 text-center text-xs text-stone-400">没有匹配的命令</div>
              )}
              {slashMatches.map((c, i) => (
                <button
                  key={c.cmd}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    runSlash(c);
                  }}
                  onMouseEnter={() => setSlashIdx(i)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left",
                    i === slashIdx ? "bg-brand-50" : "hover:bg-stone-50"
                  )}
                >
                  <span className="flex h-6 w-12 shrink-0 items-center justify-center rounded bg-stone-100 font-mono text-[11px] text-stone-500">
                    /{c.cmd}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-stone-700">{c.label}</span>
                    <span className="block truncate text-[11px] text-stone-400">{c.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="rounded-3xl border border-stone-200 bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus-within:border-brand-400 focus-within:shadow-md">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (slashMatches && slashMatches.length > 0) {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSlashIdx((i) => (i + 1) % slashMatches.length);
                    return;
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSlashIdx((i) => (i - 1 + slashMatches.length) % slashMatches.length);
                    return;
                  }
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    runSlash(slashMatches[Math.min(slashIdx, slashMatches.length - 1)]);
                    return;
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setInput("");
                    return;
                  }
                }
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
              placeholder={
                mode === "image"
                  ? "描述你想要的画面…"
                  : mode === "chat"
                    ? "有什么可以帮你的？"
                    : `${MODE_LABELS[mode]}：描述你的需求…`
              }
              className="max-h-[200px] w-full resize-none bg-transparent px-3 py-2 text-[15px] leading-relaxed outline-none placeholder:text-stone-400"
            />
            <div className="mt-1 flex items-center justify-between px-1.5 pb-0.5">
              <button
                onClick={() => void enhancePrompt()}
                disabled={!input.trim() || enhancing}
                title="优化提示词（结构化为更有效的指令）"
                className="flex h-8 items-center gap-1.5 rounded-full border border-stone-200 px-3 text-xs text-stone-500 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-30"
              >
                {enhancing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5" />
                )}
                优化
              </button>
              {sending ? (
                <button
                  onClick={stopGeneration}
                  title="停止生成"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-700 text-white transition hover:bg-stone-800"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={!input.trim()}
                  title="发送"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:bg-stone-100 disabled:text-stone-300"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          </div>
          <div className="mt-2 text-center text-xs text-stone-400">
            {mode === "image"
              ? "演示绘图为本地占位图 · 配置图像模型密钥后生成真实图片"
              : "输入 / 唤起快捷命令 · 语气/长度/受众一键叠加 · Enter 发送"}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
