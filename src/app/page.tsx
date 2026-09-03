"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUp,
  BarChart3,
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code2,
  Database,
  FileText,
  FileUp,
  Globe,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  LayoutTemplate,
  Lightbulb,
  Dices,
  MessageSquare,
  PanelRight,
  Presentation,
  Scan,
  Settings,
  SlidersHorizontal,
  X,
  Share2,
  Sparkles,
  Wrench,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import CreditsBadge from "@/components/CreditsBadge";
import AuthBadge from "@/components/AuthBadge";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import type { WorkspaceMode } from "@/lib/store/chat";
import { ModelSelector } from "@/components/workspace/ModelSelector";
import { SettingsModal } from "@/components/workspace/SettingsModal";
import { useChatStore } from "@/lib/store/chat";
import { cn } from "@/lib/utils";

/* ---------------- 数据 ---------------- */





interface RecentConvo {
  id: string;
  title: string;
}

/* ---------------- 页面 ---------------- */

export default function HomePage() {
  const router = useRouter();
  const { t , tt} = useI18n();
  const RECENT_USE = [
    { icon: Presentation, label: tt("季度汇报 PPT"), color: "text-orange-500", mode: "slides" as WorkspaceMode, prompt: tt("生成一份季度工作汇报 PPT，包含业绩回顾、问题复盘、下季度计划") },
    { icon: FileText, label: tt("竞品分析报告"), color: "text-blue-500", mode: "docs" as WorkspaceMode, prompt: tt("写一份竞品分析报告，对比核心功能、定价与市场策略") },
    { icon: Lightbulb, label: tt("营销文案"), color: "text-amber-500", mode: "chat" as WorkspaceMode, prompt: tt("为新品上市写 5 条小红书风格的营销文案：") },
    { icon: BarChart3, label: tt("周报助手"), color: "text-violet-500", mode: "chat" as WorkspaceMode, prompt: tt("根据以下工作要点，帮我整理一份结构清晰的周报：\\n") },
    { icon: ImageIcon, label: tt("海报设计"), color: "text-pink-500", mode: "image" as WorkspaceMode, prompt: tt("设计一张暖色调的活动宣传海报，主题：") },
  ];
  const RECOMMEND_CARDS: Array<{
    icon: typeof FileText;
    title: string;
    desc: string;
    tile: string;
    bg: string;
    mode: WorkspaceMode;
    prompt?: string;
  }> = [
    {
      icon: Presentation,
      title: tt("PPT 生成"),
      desc: tt("一键生成专业演示文稿"),
      tile: "from-orange-400 to-red-400",
      bg: "bg-orange-50/60",
      mode: "slides",
    },
    {
      icon: FileText,
      title: tt("文档写作"),
      desc: tt("撰写各类专业文档"),
      tile: "from-blue-400 to-sky-400",
      bg: "bg-blue-50/60",
      mode: "docs",
    },
    {
      icon: Share2,
      title: tt("思维导图"),
      desc: tt("可视化你的思维与创意"),
      tile: "from-emerald-400 to-green-400",
      bg: "bg-emerald-50/60",
      mode: "chat",
      prompt: tt("请以思维导图的结构（多级列表）帮我梳理这个主题："),
    },
    {
      icon: BarChart3,
      title: tt("数据分析"),
      desc: tt("智能分析，洞察数据价值"),
      tile: "from-violet-400 to-purple-400",
      bg: "bg-violet-50/60",
      mode: "chat",
      prompt: tt("帮我分析以下数据，输出关键结论、趋势与建议：\\n"),
    },
    {
      icon: Code2,
      title: tt("代码助手"),
      desc: tt("编写、调试各类代码"),
      tile: "from-indigo-400 to-blue-500",
      bg: "bg-indigo-50/60",
      mode: "chat",
      prompt: tt("你是资深工程师，请帮我："),
    },
    {
      icon: ImageIcon,
      title: tt("AI 绘图"),
      desc: tt("描述想法，生成精美图片"),
      tile: "from-pink-400 to-rose-400",
      bg: "bg-pink-50/60",
      mode: "image",
    },
  ];
  const QUICK_ACTIONS: Array<{
    icon: typeof FileText;
    label: string;
    color: string;
    mode: WorkspaceMode;
    prompt?: string;
  }> = [
    { icon: FileText, label: tt("写文档"), color: "text-blue-500", mode: "docs" },
    { icon: Presentation, label: tt("做PPT"), color: "text-orange-500", mode: "slides" },
    { icon: ImageIcon, label: tt("生成图片"), color: "text-emerald-500", mode: "image" },
    { icon: BarChart3, label: tt("数据分析"), color: "text-violet-500", mode: "chat", prompt: tt("帮我分析以下数据，给出关键洞察和图表建议：\\n") },
    { icon: Lightbulb, label: tt("头脑风暴"), color: "text-amber-500", mode: "chat", prompt: tt("围绕以下主题做一次头脑风暴，给出 10 个有创意的想法：") },
    { icon: Scan, label: tt("更多"), color: "text-stone-500", mode: "chat" },
  ];
  const NAV_ITEMS = [
    { icon: Home, label: tt("首页"), active: true },
    { icon: MessageSquare, label: tt("AI 对话"), href: "/chat" },
    { icon: Bot, label: tt("智能体"), href: "/chat" },
    { icon: Database, label: tt("知识库"), href: "/chat" },
    { icon: FileText, label: tt("文档中心"), href: "/chat", mode: "docs" as WorkspaceMode },
    { icon: LayoutTemplate, label: tt("模板中心"), href: "/chat" },
    { icon: Wrench, label: tt("工具箱"), href: "/chat" },
    { icon: LayoutGrid, label: tt("更多应用"), href: "/chat" },
  ];
  const { model, setModel, settingsOpen, setSettingsOpen } = useChatStore();
  const [input, setInput] = useState("");
  const [greeting, setGreeting] = useState<"night" | "morning" | "afternoon" | "evening">("morning");
  const [shuffleKey, setShuffleKey] = useState(0); // 随机灵感：每次点击换一个提示
  const [recent, setRecent] = useState<RecentConvo[]>([]);
  const [featureOpen, setFeatureOpen] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [onboardStep, setOnboardStep] = useState<number | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const featureRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // 首次访问 3 步新手引导
  useEffect(() => {
    try {
      if (!localStorage.getItem("oc:onboarded")) setOnboardStep(0);
    } catch {}
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (featureRef.current && !featureRef.current.contains(e.target as Node)) setFeatureOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 6 ? "night" : h < 12 ? "morning" : h < 18 ? "afternoon" : "evening");
    // 拉取最近对话
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d: { conversations?: Array<{ id: string; title: string; archived?: boolean }> }) => {
        const list = (d.conversations ?? []).filter((c) => !c.archived).slice(0, 4);
        setRecent(list.map((c) => ({ id: c.id, title: c.title })));
      })
      .catch(() => {});
  }, []);

  /** 把意图写入 sessionStorage，交给 /chat 工作区消费 */
  const goChat = (intent?: Record<string, unknown>) => {
    if (intent) {
      try {
        sessionStorage.setItem("oc:homeIntent", JSON.stringify({ ...intent, ts: Date.now() }));
      } catch {}
    }
    router.push("/chat");
  };

  const submit = () => {
    const text = input.trim();
    if (!text) return goChat();
    goChat({ type: "send", mode: "chat", text });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--oc-bg)] text-stone-800">
      {/* ============ 左侧导航 ============ */}
      <aside className="hidden w-[256px] shrink-0 flex-col border-r border-stone-100 bg-white md:flex">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 pb-2 pt-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-lg font-bold text-white shadow-sm">
            O
          </div>
          <span className="text-[17px] font-semibold tracking-tight">{tt("AI 对话")}</span>
        </div>

        {/* 导航 */}
        <nav className="mt-3 flex flex-col gap-0.5 px-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={tt(item.label)}
              onClick={() =>
                item.active
                  ? undefined
                  : item.mode
                    ? goChat({ type: "mode", mode: item.mode })
                    : goChat()
              }
              className={
                item.active
                  ? "flex items-center gap-3 rounded-xl bg-orange-50 px-3.5 py-2.5 text-[14px] font-medium text-orange-600"
                  : "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] text-stone-600 transition hover:bg-stone-50 hover:text-stone-900"
              }
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={item.active ? 2.2 : 1.8} />
              {tt(item.label)}
            </button>
          ))}
        </nav>

        {/* 最近对话 */}
        <div className="mt-5 flex-1 overflow-y-auto px-5">
          <p className="mb-2 text-xs font-medium text-stone-400">{tt("最近对话")}</p>
          <div className="flex flex-col gap-0.5 -mx-2">
            {recent.length === 0 && (
              <p className="px-2 py-1 text-xs text-stone-300">{tt("暂无历史对话")}</p>
            )}
            {recent.map((c) => (
              <button
                key={c.id}
                onClick={() => goChat({ type: "convo", id: c.id })}
                className="flex items-center gap-2 truncate rounded-lg px-2 py-1.5 text-left text-[13px] text-stone-500 transition hover:bg-stone-50 hover:text-stone-800"
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-stone-300" />
                <span className="truncate">{c.title}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => goChat()}
            className="mt-2 flex items-center gap-1 text-xs text-stone-400 transition hover:text-orange-600"
          >
            {tt("查看全部历史记录")} <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* 用户卡片（真实登录态） */}
        <AuthBadge variant="card" />
      </aside>

      {/* ============ 主区域 ============ */}
      <main className="relative flex-1 overflow-y-auto">
        {/* 背景光晕 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(255,183,148,0.18),rgba(244,114,182,0.07)_55%,transparent_100%)]" />

        {/* 顶栏 */}
        <header className="relative z-10 flex items-center justify-end gap-2 px-8 pt-5">
          <NotificationBell />
          <CreditsBadge />
          <LanguageSwitcher />
          <AuthBadge />
          <button
            onClick={() => setSettingsOpen(true)}
            title={t("common.settings")}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition hover:bg-white hover:text-stone-800"
          >
            <Settings className="h-[18px] w-[18px]" />
          </button>
          <button
            onClick={() => goChat({ type: "preview" })}
            title={t("home.openPreview")}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition hover:bg-white hover:text-stone-800"
          >
            <PanelRight className="h-[18px] w-[18px]" />
          </button>
          <button
            onClick={() => goChat({ type: "new" })}
            className="ml-2 rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-600 shadow-sm transition hover:border-orange-300 hover:bg-orange-50"
          >
            {t("home.newChat")}
          </button>
        </header>

        <div className="relative z-10 mx-auto max-w-[1080px] px-8 pb-16">
          {/* 问候 */}
          <div className="mt-10 text-center">
            <h1 className="text-[40px] font-bold leading-tight tracking-tight text-stone-900">
              {t(`home.greeting${greeting[0].toUpperCase()}${greeting.slice(1)}`)}，Alex 👋
            </h1>
            <p className="mt-1 bg-gradient-to-r from-orange-500 via-pink-500 to-violet-500 bg-clip-text text-[34px] font-bold tracking-tight text-transparent">
              {t("home.ctaIdea")}
            </p>
            <p className="mt-3 text-[15px] text-stone-500">
              {t("home.ideaSub")}<span className="font-medium text-stone-700">{t("home.ideaSubHighlight")}</span>
            </p>
          </div>

          {/* 输入舱 */}
          <div className="mt-8 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={3}
              placeholder={t("home.inputPlaceholder")}
              className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-stone-800 outline-none placeholder:text-stone-400"
            />
            {attachedFile && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-stone-100 px-2.5 py-1.5 text-[13px] text-stone-600">
                <FileUp className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                <span className="min-w-0 truncate">{attachedFile}</span>
                <button
                  onClick={() => setAttachedFile(null)}
                  aria-label={tt("移除附件")}
                  className="ml-auto text-stone-400 transition hover:text-stone-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between">
              <div ref={featureRef} className="relative">
                <button
                  onClick={() => setFeatureOpen((v) => !v)}
                  className={cn(
                    "flex h-[38px] items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition",
                    featureOpen
                      ? "border-orange-300 bg-orange-50 text-orange-600"
                      : "border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50"
                  )}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {tt("功能")}
                  <span className="text-stone-400">
                    {[thinking && tt("深度"), webSearch && tt("联网")].filter(Boolean).join(" · ") || tt("未开启")}
                  </span>
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 text-stone-400 transition-transform", featureOpen && "rotate-180")}
                  />
                </button>

                {featureOpen && (
                  <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-[248px] overflow-hidden rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl">
                    <button
                      onClick={() => setThinking((v) => !v)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-orange-50"
                    >
                      <BrainCircuit className={cn("h-4 w-4", thinking ? "text-orange-500" : "text-stone-400")} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] text-stone-800">{tt("深度思考")}</span>
                        <span className="block text-[11px] text-stone-400">{tt("慢速逐点推理，更适合复杂问题")}</span>
                      </span>
                      <Toggle on={thinking} />
                    </button>
                    <button
                      onClick={() => setWebSearch((v) => !v)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-orange-50"
                    >
                      <Globe className={cn("h-4 w-4", webSearch ? "text-orange-500" : "text-stone-400")} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] text-stone-800">{tt("联网搜索")}</span>
                        <span className="block text-[11px] text-stone-400">{tt("检索互联网最新信息回答")}</span>
                      </span>
                      <Toggle on={webSearch} />
                    </button>

                    <div className="my-1 border-t border-stone-100" />

                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-orange-50"
                    >
                      <FileUp className="h-4 w-4 text-stone-400" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] text-stone-800">{tt("上传文件")}</span>
                        <span className="block text-[11px] text-stone-400">{tt("PDF / Word / 图片等附件")}</span>
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-stone-300" />
                    </button>
                    <button
                      onClick={() => {
                        setFeatureOpen(false);
                        goChat();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-orange-50"
                    >
                      <Bot className="h-4 w-4 text-stone-400" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] text-stone-800">{tt("选择智能体")}</span>
                        <span className="block text-[11px] text-stone-400">{tt("指定擅长某个领域的 AI")}</span>
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-stone-300" />
                    </button>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setAttachedFile(f.name);
                  setFeatureOpen(false);
                  e.currentTarget.value = "";
                }}
              />
              <div className="flex shrink-0 items-center gap-2">
                <ModelSelector value={model} onChange={(id, provider) => setModel(id, provider)} />
                <button
                  onClick={submit}
                  aria-label={tt("发送")}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md shadow-orange-200 transition hover:brightness-105 active:scale-95"
                >
                  <ArrowUp className="h-5 w-5" strokeWidth={2.4} />
                </button>
              </div>
            </div>
          </div>

          {/* 快捷操作 */}
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={tt(a.label)}
                onClick={() =>
                  a.prompt
                    ? goChat({ type: "fill", mode: a.mode, text: a.prompt })
                    : goChat({ type: "mode", mode: a.mode })
                }
                className="flex items-center justify-center gap-2 rounded-xl border border-stone-200/80 bg-white py-3 text-[13.5px] font-medium text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow"
              >
                <a.icon className={`h-4 w-4 ${a.color}`} />
                {tt(a.label)}
              </button>
            ))}
          </div>

          {/* 为你推荐 */}
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold text-stone-800">
                <Sparkles className="h-4 w-4 text-orange-500" /> {tt("为你推荐")}
              </h2>
              <div className="flex items-center gap-1.5">
                <button className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-400 transition hover:text-stone-700">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition hover:text-stone-900">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
              {RECOMMEND_CARDS.map((c) => (
                <div
                  key={c.title}
                  className={`group flex flex-col rounded-2xl border border-stone-200/70 ${c.bg} p-4 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-stone-200/60`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${c.tile} text-white shadow-sm`}
                  >
                    <c.icon className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-[14.5px] font-semibold text-stone-800">{c.title}</p>
                  <p className="mt-1 min-h-[36px] text-xs leading-relaxed text-stone-500">
                    {tt(c.desc)}
                  </p>
                  <button
                    onClick={() =>
                      c.prompt
                        ? goChat({ type: "fill", mode: c.mode, text: c.prompt })
                        : goChat({ type: "mode", mode: c.mode })
                    }
                    className="mt-3 self-start rounded-lg border border-stone-300/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-stone-600 transition group-hover:border-orange-300 group-hover:text-orange-600"
                  >
                    {tt("立即使用")}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 最近使用 */}
          <div className="mt-10">
            <h2 className="text-[15px] font-semibold text-stone-800">{tt("最近使用")}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {RECENT_USE.map((r, i) => (
                <button
                  key={`${r.label}-${i}`}
                  onClick={() => goChat({ type: "fill", mode: r.mode, text: r.prompt })}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border border-stone-200/80 bg-white px-4 py-3.5 text-left text-[13.5px] font-medium text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow",
                    i === shuffleKey % RECENT_USE.length && "border-orange-300 ring-2 ring-orange-100"
                  )}
                >
                  <r.icon className={`h-[18px] w-[18px] shrink-0 ${r.color}`} />
                  <span className="truncate">{r.label}</span>
                </button>
              ))}
              <button
                onClick={() => setShuffleKey((v) => v + 1)}
                title={tt("随机一个灵感")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-stone-300 bg-white/60 px-4 py-3.5 text-[13px] text-stone-400 transition hover:border-orange-300 hover:text-orange-600"
              >
                <Dices className="h-4 w-4" />
                {t("home.randomIdea")}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 设置中心（可从首页顶栏直接打开） */}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* 页脚：合规链接 */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-4 border-t border-stone-100 bg-white/70 py-2 text-[11px] text-stone-400 backdrop-blur">
        <span>© 2026 OpenCanvas</span>
        <Link href="/privacy" className="transition hover:text-stone-600">{t("home.privacy")}</Link>
        <Link href="/terms" className="transition hover:text-stone-600">{t("home.terms")}</Link>
        <Link href="/api/export" className="transition hover:text-stone-600">{t("home.exportData")}</Link>
      </footer>

      {/* 首次访问新手引导 */}
      {onboardStep !== null && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wide text-orange-500">
                第 {onboardStep + 1} / 3 步
              </span>
              <button
                onClick={() => setOnboardStep(null)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100"
                title={t("home.skip")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {onboardStep === 0 && (
              <div className="mt-3">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-xl font-bold text-white">O</div>
                <h3 className="text-lg font-semibold text-stone-800">{t("home.onboardWelcome")}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-500">
                                    {t("home.onboardDesc")}
                </p>
              </div>
            )}
            {onboardStep === 1 && (
              <div className="mt-3">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-stone-800">{t("home.onboardIdea")}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-500">
                  回车发送、Shift+回车换行；还可粘贴图片、添加文档，AI 会基于它们回答。
                </p>
              </div>
            )}
            {onboardStep === 2 && (
              <div className="mt-3">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-500">
                  <PanelRight className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-stone-800">{tt("产物实时呈现在右侧画布")}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-500">
                  PPT、文档、代码预览与研究报告都会出现在右侧，可编辑、导出与一键转 PPT。
                </p>
              </div>
            )}
            <div className="mt-5 flex items-center justify-between">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={cn("h-1.5 w-1.5 rounded-full", i === onboardStep ? "bg-orange-500" : "bg-stone-200")}
                  />
                ))}
              </div>
              {onboardStep < 2 ? (
                <button
                  onClick={() => setOnboardStep((v) => (v ?? 0) + 1)}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
                >
                  下一步
                </button>
              ) : (
                <button
                  onClick={() => {
                    try { localStorage.setItem("oc:onboarded", "1"); } catch {}
                    setOnboardStep(null);
                  }}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
                >
                  开始使用
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition",
        on ? "bg-orange-500" : "bg-stone-200"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
          on ? "left-[18px]" : "left-0.5"
        )}
      />
    </span>
  );
}
