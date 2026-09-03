"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Check,
  ChevronDown,
  ClipboardList,
  Copy,
  Cpu,
  Database,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode2,
  FileText,
  Github,
  Globe,
  History,
  Image as ImageIcon,
  Info,
  KeyRound,
  LayoutPanelTop,
  Loader2,
  MessageSquare,
  Monitor,
  Moon,
  PanelRight,
  Presentation,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Server,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Video,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  loadSettings,
  saveSettings,
  PROVIDER_META,
  TAVILY_KEY,
  loadDynamicModels,
  saveDynamicModels,
  clearLocalConfig,
  type ProviderSettings,
} from "@/lib/settings";
import { MODELS } from "@/lib/gateway/models";
import {
  useChatStore,
  MODE_LABELS,
  type SettingsTab,
  type WorkspaceMode,
} from "@/lib/store/chat";
import type { ProviderId } from "@/lib/gateway";
import { useAuthStore } from "@/lib/store/auth";
import type { SettingsProviderId } from "@/lib/settings";
import { toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";
import { ProviderLogo } from "./ProviderLogo";

/** Google 官方四色 G 图标（内联 SVG） */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a12.01 12.01 0 0 0 0 10.76l3.98-3.09Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}

type TestState = Record<string, "idle" | "testing" | "ok" | "fail">;

const TABS: Array<{ id: SettingsTab; label: string; desc: string; icon: LucideIcon }> = [
  { id: "general", label: "通用", desc: "界面与发送行为", icon: Settings2 },
  { id: "models", label: "模型设置", desc: "API Key / 中转地址", icon: Cpu },
  { id: "network", label: "联网搜索", desc: "深度研究来源", icon: Globe },
  { id: "data", label: "数据管理", desc: "统计 / 导出 / 清理", icon: Database },
  { id: "about", label: "关于", desc: "版本、日志与帮助", icon: Info },
];

/** 供应商能力标签（用于设置页分组展示） */
const PROVIDER_CAPS: Record<string, string[]> = {
  openai: ["对话", "图像生成"],
  anthropic: ["对话"],
  deepseek: ["对话"],
  dashscope: ["对话", "图像生成"],
  fal: ["图像生成", "图生图"],
};

const MODE_OPTIONS: Array<{ id: WorkspaceMode; icon: LucideIcon; desc: string }> = [
  { id: "chat", icon: MessageSquare, desc: "通用问答与创作" },
  { id: "research", icon: Search, desc: "联网深度研究报告" },
  { id: "slides", icon: Presentation, desc: "PPT 一键生成" },
  { id: "image", icon: ImageIcon, desc: "AI 图片设计" },
  { id: "video", icon: Video, desc: "视频脚本与分镜" },
  { id: "docs", icon: FileText, desc: "Markdown 文档写作" },
];

const CANVAS_OPTIONS: Array<{ id: "narrow" | "standard" | "wide"; label: string; desc: string }> = [
  { id: "narrow", label: "紧凑", desc: "24rem · 让聊天区更宽" },
  { id: "standard", label: "标准", desc: "30rem · 默认宽度" },
  { id: "wide", label: "宽敞", desc: "38rem · 大页内容更舒展" },
];

const HISTORY_OPTIONS = [20, 50, 100] as const;

const ABOUT_FEATURES = [
  { icon: MessageSquare, label: "多模型流式对话", tint: "text-orange-500 bg-orange-50" },
  { icon: Search, label: "深度研究 + 一键转 PPT", tint: "text-sky-500 bg-sky-50" },
  { icon: Presentation, label: "PPT 在线编辑与导出", tint: "text-rose-500 bg-rose-50" },
  { icon: ImageIcon, label: "AI 绘图与画廊", tint: "text-emerald-500 bg-emerald-50" },
  { icon: FileText, label: "文档写作 / 导出 Word", tint: "text-blue-500 bg-blue-50" },
  { icon: Sparkles, label: "右侧 AI 创作画布", tint: "text-violet-500 bg-violet-50" },
];

const TECH_STACK = [
  { icon: FileCode2, label: "Next.js 14", tint: "text-stone-500 bg-stone-100" },
  { icon: Zap, label: "React 18 + TypeScript", tint: "text-sky-500 bg-sky-50" },
  { icon: LayoutPanelTop, label: "Tailwind CSS", tint: "text-cyan-500 bg-cyan-50" },
  { icon: Database, label: "SQLite 数据持久化", tint: "text-emerald-500 bg-emerald-50" },
  { icon: Wand2, label: "Zustand 状态管理", tint: "text-amber-500 bg-amber-50" },
  { icon: Presentation, label: "pptxgenjs 导出 PPTX", tint: "text-rose-500 bg-rose-50" },
];

const CHANGELOG = [
  {
    tag: "当前版本",
    date: "2026-09",
    items: ["设置中心全新改版：5 大分页", "右侧产物画布支持宽度调节", "深度研究支持搜索深度与来源数量配置"],
  },
  {
    tag: "v0.1",
    date: "2026-08",
    items: ["多模型网关（GPT / Claude / DeepSeek / 通义）", "PPT、绘图、文档、深度研究全链路", "SQLite 会话持久化与历史管理"],
  },
];

/* ─────────────────────────── 基础小部件 ─────────────────────────── */

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition",
        checked ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-stone-200",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-5"
        )}
      />
    </button>
  );
}

function StatusPill({
  text,
  kind,
  icon,
}: {
  text: string;
  kind: "ok" | "info" | "fail";
  icon?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        kind === "ok" && "bg-emerald-50 text-emerald-600",
        kind === "info" && "bg-stone-100 text-stone-500",
        kind === "fail" && "bg-red-50 text-red-600"
      )}
    >
      {icon}
      {text}
    </span>
  );
}

function SectionCard({
  icon,
  iconBg,
  title,
  desc,
  children,
  className,
}: {
  icon: LucideIcon;
  iconBg: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = icon;
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm", className)}>
      <header className="flex items-center gap-3 border-b border-stone-100 px-5 py-4">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm", iconBg)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-stone-800">{title}</h3>
          {desc && <p className="mt-0.5 text-xs leading-relaxed text-stone-400">{desc}</p>}
        </div>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** 分段选项（单选按钮组） */
function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string; desc?: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 rounded-xl border px-3 py-2.5 text-left transition sm:flex-none",
              active
                ? "border-orange-300 bg-orange-50 shadow-sm"
                : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50"
            )}
          >
            <span className={cn("block text-[13px] font-medium", active ? "text-orange-700" : "text-stone-700")}>
              {o.label}
            </span>
            {o.desc && <span className="mt-0.5 block text-[11px] text-stone-400">{o.desc}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** 设置行：左文案 + 右控件 */
function SettingRow({
  title,
  desc,
  children,
  divider = true,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
  divider?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-3.5", divider && "border-b border-stone-100")}>
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium text-stone-700">{title}</div>
        {desc && <p className="mt-0.5 text-xs leading-relaxed text-stone-400">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* ─────────────────────────── 供应商配置卡 ─────────────────────────── */

function ProviderCard({
  meta,
  setting,
  serverConfigured,
  testState,
  models,
  fetchingModels,
  fetchError,
  showKey,
  onToggleShow,
  onChange,
  onTest,
  onFetch,
  onClear,
}: {
  meta: (typeof PROVIDER_META)[number];
  setting: { apiKey: string; baseUrl: string };
  serverConfigured: boolean;
  testState: TestState[SettingsProviderId];
  /** 已保存的动态模型列表 */
  models: string[];
  fetchingModels: boolean;
  fetchError: string;
  showKey: boolean;
  onToggleShow: () => void;
  onChange: (field: "apiKey" | "baseUrl", value: string) => void;
  onTest: () => void;
  onFetch: () => void;
  onClear: () => void;
}) {
  const configured = Boolean(setting.apiKey) || serverConfigured;
  const st = testState ?? "idle";
  const [modelsOpen, setModelsOpen] = useState(models.length > 0);

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm transition hover:border-stone-300">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <ProviderLogo provider={meta.id} className="h-10 w-10 rounded-xl" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] font-semibold text-stone-800">{meta.label}</span>
              <StatusPill text={meta.region} kind="info" />
              {configured && <StatusPill text="已配置" kind="ok" icon={<Check className="h-3 w-3" />} />}
              {serverConfigured && <StatusPill text="服务端密钥" kind="info" />}
              {st === "ok" && <StatusPill text="连接正常" kind="ok" icon={<Check className="h-3 w-3" />} />}
              {st === "fail" && <StatusPill text="连接失败" kind="fail" />}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {PROVIDER_CAPS[meta.id]?.map((c) => (
                <span key={c} className="rounded-md bg-stone-100 px-1.5 py-px text-[10px] font-medium text-stone-500">
                  {c}
                </span>
              ))}
              {models.length > 0 && (
                <span className="rounded-md bg-sky-50 px-1.5 py-px text-[10px] font-medium text-sky-600">
                  已获取 {models.length} 个模型
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={onFetch}
            disabled={fetchingModels || !configured}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {fetchingModels ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            获取模型列表
          </button>
          <button
            onClick={onTest}
            disabled={st === "testing" || !configured}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {st === "testing" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            测试连接
          </button>
          <button
            onClick={onClear}
            title="清除此供应商的本地配置"
            className="rounded-lg border border-stone-200 p-1.5 text-stone-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <label className="mb-1 block text-xs font-medium text-stone-500">API Key {serverConfigured && "（可选，服务端已配置）"}</label>
      <div className="relative mb-3">
        <input
          type={showKey ? "text" : "password"}
          value={setting.apiKey}
          placeholder="sk-..."
          onChange={(e) => onChange("apiKey", e.target.value)}
          className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-stone-800 shadow-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 transition hover:text-stone-600"
          title={showKey ? "隐藏" : "显示"}
        >
          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <label className="mb-1 block text-xs font-medium text-stone-500">
        Base URL <span className="font-normal text-stone-400">（可选，默认官方地址；中转填中转地址）</span>
      </label>
      <input
        type="text"
        value={setting.baseUrl}
        placeholder={meta.defaultBaseUrl}
        onChange={(e) => onChange("baseUrl", e.target.value)}
        className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-800 shadow-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
      />

      {/* 模型列表 */}
      <div className="mt-4 border-t border-stone-100 pt-3">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setModelsOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-stone-500 transition hover:text-orange-600"
          >
            <Sparkles className="h-3.5 w-3.5 text-stone-400" />
            可用模型{models.length > 0 && `（${models.length}）`}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", modelsOpen && "rotate-180")} />
          </button>
          {models.length > 0 && (
            <button
              onClick={onFetch}
              disabled={fetchingModels}
              className="text-[11px] text-stone-400 transition hover:text-sky-600 disabled:opacity-40"
            >
              {fetchingModels ? "获取中…" : "刷新"}
            </button>
          )}
        </div>

        {modelsOpen && (
          <div className="mt-2.5">
            {fetchingModels ? (
              <div className="flex items-center gap-2 rounded-xl bg-stone-50 px-3.5 py-3 text-xs text-stone-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-500" />
                正在从供应商拉取模型列表…
              </div>
            ) : fetchError ? (
              <div className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs leading-relaxed text-red-600">
                {fetchError}
              </div>
            ) : models.length > 0 ? (
              <>
                <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto pr-1">
                  {models.map((id) => (
                    <span
                      key={id}
                      className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-[11px] text-stone-600"
                    >
                      {id}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-stone-400">
                  已保存，可在模型选择器中直接选用；点击顶部「获取模型列表」可重新拉取。
                </p>
              </>
            ) : (
              <div className="rounded-xl bg-stone-50 px-3.5 py-3 text-xs leading-relaxed text-stone-400">
                尚未获取。点击右上角「获取模型列表」，将拉取该账号/中转实际可用的模型并保存，供模型选择器选用。
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── 主组件 ─────────────────────────── */

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settingsTab, setSettingsTab } = useChatStore();
  const [settings, setSettings] = useState<ProviderSettings>({});
  const [baseline, setBaseline] = useState("");
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [test, setTest] = useState<TestState>({});
  const [serverStatus, setServerStatus] = useState<Record<string, boolean>>({});
  const [imageStatus, setImageStatus] = useState<Record<string, boolean>>({});
  const [modelLists, setModelLists] = useState<Record<string, string[]>>({});
  const [fetchingModels, setFetchingModels] = useState<Record<string, boolean>>({});
  const [fetchModelErrors, setFetchModelErrors] = useState<Record<string, string>>({});
  const [confirmClear, setConfirmClear] = useState(false);
  const [oauthStatus, setOauthStatus] = useState<{ google?: boolean; github?: boolean }>({});

  useEffect(() => {
    if (open) {
      const loaded = loadSettings();
      setSettings(loaded);
      setBaseline(JSON.stringify(loaded));
      setDirty(false);
      setSaved(false);
      setTest({});
      setConfirmClear(false);
      setModelLists(loadDynamicModels());
      setFetchModelErrors({});
      fetch("/api/models")
        .then((r) => r.json())
        .then((d: { status?: Record<string, boolean>; imageStatus?: Record<string, boolean> }) => {
          setServerStatus(d.status ?? {});
          setImageStatus(d.imageStatus ?? {});
        })
        .catch(() => setServerStatus({}));
      fetch("/api/auth/oauth/status")
        .then((r) => r.json())
        .then((d: { google?: boolean; github?: boolean }) => setOauthStatus(d ?? {}))
        .catch(() => setOauthStatus({}));
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const update = (id: string, field: "apiKey" | "baseUrl", value: string) => {
    setSettings((s) => ({
      ...s,
      [id]: {
        apiKey: (s[id as SettingsProviderId]?.apiKey) ?? "",
        baseUrl: (s[id as SettingsProviderId]?.baseUrl) ?? "",
        [field]: value,
      },
    }));
    setDirty(true);
    setSaved(false);
  };

  const clearProvider = (id: SettingsProviderId) => {
    setSettings((s) => {
      const next = { ...s };
      delete next[id];
      return next;
    });
    const dyn = loadDynamicModels();
    if (dyn[id]) {
      delete dyn[id];
      saveDynamicModels(dyn);
    }
    setDirty(true);
    setSaved(false);
    toast(`已清除 ${PROVIDER_META.find((p) => p.id === id)?.label ?? id} 本地配置`, "info");
  };

  const testConnection = async (id: SettingsProviderId) => {
    const cur = settings[id];
    if (!cur?.apiKey) {
      toast("请先填写 API Key", "error");
      return;
    }
    setTest((t) => ({ ...t, [id]: "testing" }));
    try {
      const res = await fetch("/api/models/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: id,
          overrides: { [id]: { apiKey: cur.apiKey, baseUrl: cur.baseUrl || undefined } },
        }),
      });
      const data = (await res.json()) as { models?: string[]; error?: string };
      if (!res.ok || !data.models) throw new Error(data.error ?? "连接失败");

      const dyn = loadDynamicModels();
      dyn[id] = data.models;
      saveDynamicModels(dyn);
      setModelLists((s) => ({ ...s, [id]: data.models! }));
      setTest((t) => ({ ...t, [id]: "ok" }));
      toast(`连接成功，获取到 ${data.models.length} 个模型`, "success");
    } catch (e) {
      setTest((t) => ({ ...t, [id]: "fail" }));
      toast(`连接失败：${e instanceof Error ? e.message : ""}`, "error");
    }
  };

  /** 拉取该供应商实际可用的模型列表并保存（支持服务端密钥） */
  const fetchModels = async (id: SettingsProviderId) => {
    const cur: { apiKey: string; baseUrl: string } | undefined = settings[id];
    const hasLocalKey = Boolean(cur?.apiKey);
    if (!hasLocalKey && !serverStatus[id]) {
      toast("请先填写 API Key（或配置服务端密钥）再获取模型列表", "error");
      return;
    }
    setFetchingModels((m) => ({ ...m, [id]: true }));
    setFetchModelErrors((m) => ({ ...m, [id]: "" }));
    try {
      const res = await fetch("/api/models/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: id,
          // 本地有密钥优先 BYOK；否则留空走服务端环境变量
          overrides: hasLocalKey && cur
            ? { [id]: { apiKey: cur.apiKey, baseUrl: cur.baseUrl || undefined } }
            : undefined,
        }),
      });
      const data = (await res.json()) as { models?: string[]; error?: string };
      if (!res.ok || !data.models) throw new Error(data.error ?? "获取失败");

      const dyn = loadDynamicModels();
      dyn[id] = data.models;
      saveDynamicModels(dyn);
      setModelLists((s) => ({ ...s, [id]: data.models! }));
      toast(`获取到 ${data.models.length} 个模型`, "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "获取失败";
      setFetchModelErrors((m) => ({ ...m, [id]: msg }));
      toast(`获取模型失败：${msg}`, "error");
    } finally {
      setFetchingModels((m) => ({ ...m, [id]: false }));
    }
  };

  const handleSave = () => {
    saveSettings(settings);
    setBaseline(JSON.stringify(settings));
    setDirty(false);
    setSaved(true);
    toast("设置已保存", "success");
  };

  const handleClearAll = () => {
    clearLocalConfig();
    setSettings({});
    setBaseline("{}");
    setDirty(false);
    setConfirmClear(false);
    const store = useChatStore.getState();
    store.setArtifactOpen(true);
    store.setAutoOpenArtifact(true);
    store.setDefaultMode("chat");
    store.setDefaultModel("demo");
    toast("本地配置已清空", "success");
  };

  const tavily = settings[TAVILY_KEY as SettingsProviderId]?.apiKey ?? "";
  const configuredCount = PROVIDER_META.filter((p) => Boolean(settings[p.id]?.apiKey) || serverStatus[p.id]).length;
  const serverCount = PROVIDER_META.filter((p) => serverStatus[p.id]).length;
  const localCount = PROVIDER_META.filter((p) => Boolean(settings[p.id]?.apiKey)).length;
  const currentTab = TABS.find((t) => t.id === settingsTab) ?? TABS[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-900/50 p-0 backdrop-blur-sm sm:p-4 md:items-center"
      onClick={onClose}
    >
      <div
        className="my-0 flex h-[100dvh] w-full max-w-5xl overflow-hidden bg-[var(--oc-bg)] shadow-2xl shadow-stone-900/30 sm:my-6 sm:h-auto sm:max-h-[92vh] sm:rounded-3xl sm:border sm:border-stone-200/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── 左侧分类导航（桌面） ─── */}
        <aside className="hidden w-[268px] shrink-0 flex-col border-r border-stone-100 bg-white p-4 md:flex">
          <div className="mb-5 flex items-center gap-2.5 px-1 pt-1">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md shadow-orange-200">
              <Sparkles className="h-[18px] w-[18px]" />
            </span>
            <div>
              <div className="text-[15px] font-semibold text-stone-800">设置中心</div>
              <div className="text-[11px] text-stone-400">OpenCanvas AI</div>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = settingsTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSettingsTab(t.id)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                    active ? "bg-orange-50" : "hover:bg-stone-50"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-orange-400 to-red-500" />
                  )}
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                      active ? "bg-white text-orange-500 shadow-sm" : "bg-stone-100 text-stone-400 group-hover:text-stone-600"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className={cn("block text-[13px] font-medium", active ? "text-orange-700" : "text-stone-700")}>
                      {t.label}
                    </span>
                    <span className={cn("block text-[11px]", active ? "text-orange-400" : "text-stone-400")}>{t.desc}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto rounded-xl border border-stone-200/80 bg-stone-50 p-3">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-stone-600">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              密钥仅存本机
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-stone-400">
              保存在浏览器 localStorage，服务器不存储；也可只配置服务端环境变量。
            </p>
          </div>
        </aside>

        {/* ─── 右侧内容 ─── */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 border-b border-stone-100 bg-white/85 px-5 py-3.5 backdrop-blur sm:px-6">
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-stone-800">{currentTab.label}</h2>
              <p className="mt-0.5 truncate text-xs text-stone-400">{currentTab.desc}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {dirty && (
                <span className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-600 sm:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  有未保存更改
                </span>
              )}
              {saved && (
                <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-600 sm:flex">
                  <Check className="h-3 w-3" />
                  已保存
                </span>
              )}
              <button
                onClick={onClose}
                title="关闭"
                className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          {/* 移动端分页切换 */}
          <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-stone-100 bg-white px-4 py-2.5 md:hidden">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = settingsTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSettingsTab(t.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    active
                      ? "border-orange-300 bg-orange-50 text-orange-600"
                      : "border-stone-200 text-stone-500 hover:border-stone-300"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* 内容区 */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
            <div className="mx-auto max-w-2xl space-y-5">
              {settingsTab === "general" && <GeneralTab />}

              {settingsTab === "models" && (
                <>
                  <div className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-orange-500 shadow-sm">
                          <KeyRound className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="text-[13px] font-semibold text-orange-800">模型密钥配置状态</div>
                          <div className="mt-0.5 text-[11.5px] text-orange-500">
                            本地 {localCount} · 服务端 {serverCount} · 共 {configuredCount}/{PROVIDER_META.length} 已就绪
                          </div>
                        </div>
                      </div>
                      <StatusPill text="演示模型免费可用" kind="ok" icon={<Check className="h-3 w-3" />} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {PROVIDER_META.map((p) => (
                      <ProviderCard
                        key={p.id}
                        meta={p}
                        setting={settings[p.id] ?? { apiKey: "", baseUrl: "" }}
                        serverConfigured={Boolean(serverStatus[p.id])}
                        testState={test[p.id]}
                        models={modelLists[p.id] ?? []}
                        fetchingModels={Boolean(fetchingModels[p.id])}
                        fetchError={fetchModelErrors[p.id] ?? ""}
                        showKey={Boolean(showKey[p.id])}
                        onToggleShow={() => setShowKey((s) => ({ ...s, [p.id]: !s[p.id] }))}
                        onChange={(field, value) => update(p.id, field, value)}
                        onTest={() => void testConnection(p.id)}
                        onFetch={() => void fetchModels(p.id)}
                        onClear={() => clearProvider(p.id)}
                      />
                    ))}
                  </div>

                  <SectionCard
                    icon={Server}
                    iconBg="bg-gradient-to-br from-stone-500 to-stone-700"
                    title="服务端密钥（可选）"
                    desc="适合生产部署：在 .env 中配置，界面无需填写"
                  >
                    <div className="flex items-start gap-2.5 rounded-xl bg-stone-50 p-3.5">
                      <FileCode2 className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs leading-relaxed text-stone-500">
                          服务端配置后所有人可用（不限浏览器），且密钥不会出现在前端。参考{" "}
                          <code className="rounded bg-white px-1 py-0.5 text-[11px] text-stone-600">.env.example</code>：
                        </p>
                        <pre className="mt-2 overflow-x-auto rounded-lg bg-stone-900 p-3 text-[11px] leading-5 text-stone-200">
{`OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...
DASHSCOPE_API_KEY=sk-...
FAL_KEY=xxxxx            # FLUX 绘图/图生图（海外）
REMOVE_BG_API_KEY=xxxxx  # 去背景（可选；不配则前端本地 AI）
TAVILY_API_KEY=tvly-...
GOOGLE_CLIENT_ID=...     # Google 登录（可选 OAuth）
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...     # GitHub 登录（可选 OAuth）
GITHUB_CLIENT_SECRET=...
OAUTH_REDIRECT_BASE=https://your-domain.com`}
                        </pre>
                        <button
                          onClick={() => {
                            navigator.clipboard
                              ?.writeText(
                                "OPENAI_API_KEY=\nANTHROPIC_API_KEY=\nDEEPSEEK_API_KEY=\nDASHSCOPE_API_KEY=\nFAL_KEY=\nREMOVE_BG_API_KEY=\nTAVILY_API_KEY=\nGOOGLE_CLIENT_ID=\nGOOGLE_CLIENT_SECRET=\nGITHUB_CLIENT_ID=\nGITHUB_CLIENT_SECRET=\nOAUTH_REDIRECT_BASE="
                              )
                              .then(() => toast("已复制环境变量模板", "success"))
                              .catch(() => {});
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:border-orange-300 hover:text-orange-600"
                        >
                          <Copy className="h-3.5 w-3.5" /> 复制模板
                        </button>
                      </div>
                    </div>
                  </SectionCard>

                  {/* 第三方登录（Google / GitHub OAuth）配置向导 */}
                  <SectionCard
                    icon={KeyRound}
                    iconBg="bg-gradient-to-br from-violet-500 to-indigo-600"
                    title="第三方登录（Google / GitHub）"
                    desc="登录弹窗「或使用以下方式登录」按钮；配置后无需重启，刷新页面即可"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      {([
                        {
                          key: "google" as const,
                          name: "Google",
                          env: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET",
                          console: "https://console.cloud.google.com/apis/credentials",
                          hint: "创建 OAuth 客户端（类型：Web 应用）",
                        },
                        {
                          key: "github" as const,
                          name: "GitHub",
                          env: "GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET",
                          console: "https://github.com/settings/developers",
                          hint: "New OAuth App；回调地址填下方链接",
                        },
                      ] as const).map((p) => {
                        const configured = Boolean(oauthStatus[p.key]);
                        const callback = `${window.location.origin}/api/auth/oauth/${p.key}/callback`;
                        return (
                          <div key={p.key} className="rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-2 text-[13px] font-semibold text-stone-700">
                                {p.key === "google" ? (
                                  <GoogleIcon className="h-4 w-4" />
                                ) : (
                                  <Github className="h-4 w-4" />
                                )}
                                {p.name}
                              </span>
                              {configured ? (
                                <StatusPill text="已配置" kind="ok" icon={<Check className="h-3 w-3" />} />
                              ) : (
                                <StatusPill text="未配置" kind="fail" />
                              )}
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-stone-400">{p.hint}</p>
                            <a
                              href={p.console}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-violet-600 hover:underline"
                            >
                              前往控制台 <ExternalLink className="h-3 w-3" />
                            </a>
                            <div className="mt-2.5">
                              <p className="mb-1 text-[10px] font-medium text-stone-400">回调地址（登记到控制台）</p>
                              <div className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2 py-1.5">
                                <code className="min-w-0 flex-1 truncate font-mono text-[10.5px] text-stone-500">
                                  {callback}
                                </code>
                                <button
                                  onClick={() => {
                                    navigator.clipboard
                                      ?.writeText(callback)
                                      .then(() => toast("回调地址已复制", "success"))
                                      .catch(() => {});
                                  }}
                                  className="rounded p-1 text-stone-400 transition hover:bg-stone-100 hover:text-violet-600"
                                  title="复制回调地址"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <p className="mt-2 font-mono text-[10px] leading-relaxed text-stone-400">{p.env}</p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 rounded-xl bg-stone-50 p-3 text-[11px] leading-relaxed text-stone-500">
                      ① 在控制台创建 OAuth 应用 → ② 将上方回调地址填入 → ③ 把 Client ID / Secret 写入{" "}
                      <code className="rounded bg-white px-1 py-0.5 text-[10px]">.env</code>（或下方「服务端密钥」）→{" "}
                      ④ 登录弹窗即可用 {""}
                      <span className="font-medium text-stone-600">Google / GitHub</span> 登录。
                      部署在代理后域名不变时无需额外配置；否则设置{" "}
                      <code className="rounded bg-white px-1 py-0.5 text-[10px]">OAUTH_REDIRECT_BASE</code>。
                    </div>
                  </SectionCard>

                  {/* 网关增强：降级 / 多 Key / 限流 */}
                  <SectionCard
                    icon={Zap}
                    iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
                    title="网关增强（降级 · 多 Key · 限流）"
                    desc="服务端 .env 配置，保存后无需改代码"
                  >
                    <GatewayTuningCard />
                  </SectionCard>

                  {/* 用量与成本看板 */}
                  <SectionCard
                    icon={BarChart3}
                    iconBg="bg-gradient-to-br from-sky-500 to-blue-600"
                    title="用量与成本看板"
                    desc="每次模型调用的 tokens / 成本 / 积分（网关自动记录）"
                  >
                    <GatewayStatsCard />
                  </SectionCard>
                </>
              )}

              {settingsTab === "network" && (
                <>
                  <SectionCard
                    icon={Globe}
                    iconBg="bg-gradient-to-br from-sky-400 to-indigo-500"
                    title="Tavily 联网搜索"
                    desc="深度研究会调用该服务实时检索网页"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill text="搜索 API" kind="info" />
                      {tavily ? (
                        <StatusPill text="已填写" kind="ok" icon={<Check className="h-3 w-3" />} />
                      ) : (
                        <StatusPill text="未填写 · 使用示例来源" kind="fail" />
                      )}
                    </div>
                    <div className="relative mt-3">
                      <input
                        type={showKey[TAVILY_KEY] ? "text" : "password"}
                        value={tavily}
                        placeholder="tvly-..."
                        onChange={(e) => update(TAVILY_KEY, "apiKey", e.target.value)}
                        className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-stone-800 shadow-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey((s) => ({ ...s, [TAVILY_KEY]: !s[TAVILY_KEY] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 transition hover:text-stone-600"
                        title={showKey[TAVILY_KEY] ? "隐藏" : "显示"}
                      >
                        {showKey[TAVILY_KEY] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="mt-3 flex items-start gap-2 rounded-xl bg-stone-50 p-3 text-xs leading-relaxed text-stone-500">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
                      <p>
                        填入后使用真实联网结果；不填则使用演示数据（来源标注「示例」）。
                        <a
                          href="https://tavily.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 inline-flex items-center gap-0.5 font-medium text-sky-600 hover:underline"
                        >
                          前往获取 API Key <ExternalLink className="h-3 w-3" />
                        </a>
                      </p>
                    </div>
                  </SectionCard>

                  <ResearchBehavior />
                </>
              )}

              {settingsTab === "data" && (
                <>
                  <DataOverview />
                  <SectionCard
                    icon={Activity}
                    iconBg="bg-gradient-to-br from-slate-500 to-slate-700"
                    title="运行诊断"
                    desc="服务健康状态与前端运行时错误（自动采集，无需外部服务）"
                  >
                    <DiagnosticsCard />
                  </SectionCard>
                  <SectionCard
                    icon={Download}
                    iconBg="bg-gradient-to-br from-emerald-400 to-teal-500"
                    title="导出备份"
                    desc="JSON 全量备份，或当前会话导出为 Markdown"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-stone-50 p-3.5">
                        <p className="text-xs text-stone-500">全部会话、消息、PPT 与报告 → JSON 文件，保存在本机。</p>
                        <button
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = "/api/export";
                            a.download = "opencanvas-backup.json";
                            a.click();
                            toast("正在导出备份…", "info");
                          }}
                          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-600 transition hover:border-orange-300 hover:text-orange-600"
                        >
                          <Download className="h-3.5 w-3.5" /> 导出全部（JSON）
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-stone-50 p-3.5">
                        <p className="text-xs text-stone-500">当前会话的消息转为 Markdown 文本，便于粘贴到其他工具。</p>
                        <ExportCurrentMarkdown />
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard
                    icon={Trash2}
                    iconBg="bg-gradient-to-br from-red-400 to-rose-500"
                    title="清空本地配置"
                    desc="移除浏览器中保存的 API Key、已拉取模型列表与界面偏好"
                    className="border-red-100"
                  >
                    {confirmClear ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3.5">
                        <p className="text-[13px] font-medium text-red-700">确认清空全部本地配置？</p>
                        <p className="mt-1 text-xs leading-relaxed text-red-500">
                          此操作不可撤销，但不影响服务端数据（会话与消息仍保留）。清空后需重新配置模型密钥。
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={handleClearAll}
                            className="rounded-lg bg-red-500 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-red-600"
                          >
                            确认清空
                          </button>
                          <button
                            onClick={() => setConfirmClear(false)}
                            className="rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-600 transition hover:bg-stone-50"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs leading-relaxed text-stone-500">
                          仅清除本机浏览器存储，服务器上的会话/消息/产物不受影响。
                        </p>
                        <button
                          onClick={() => setConfirmClear(true)}
                          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> 清空本地配置
                        </button>
                      </div>
                    )}
                  </SectionCard>

                  {/* 账号与合规：导出 / 删除账号（GDPR 式权利） */}
                  <SectionCard
                    icon={ShieldCheck}
                    iconBg="bg-gradient-to-br from-indigo-500 to-violet-600"
                    title="账号与数据权利"
                    desc="导出我的全部数据；或永久删除账号及其名下数据（不可撤销）"
                  >
                    <AccountRightsCard />
                  </SectionCard>
                </>
              )}

              {settingsTab === "about" && <AboutTab />}
            </div>
          </div>

          <footer className="sticky bottom-0 flex shrink-0 items-center justify-between gap-3 border-t border-stone-100 bg-white/85 px-5 py-3.5 backdrop-blur sm:px-6">
            <p className="hidden min-w-0 truncate text-[11px] text-stone-400 sm:block">
              {dirty ? "更改尚未保存" : saved ? "所有更改已保存" : "模型与密钥保存在浏览器本地"}
            </p>
            <div className="flex items-center gap-2.5">
              <button
                onClick={onClose}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 transition hover:bg-stone-50"
              >
                关闭
              </button>
              <button
                onClick={handleSave}
                disabled={!dirty}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-medium transition",
                  dirty
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-200 hover:brightness-105"
                    : "cursor-default bg-stone-100 text-stone-400"
                )}
              >
                {saved ? (
                  <>
                    <Check className="h-4 w-4" /> 已保存
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" /> 保存设置
                  </>
                )}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ 通用 ═══════════════════════════ */

function GeneralTab() {
  const {
    artifactOpen,
    setArtifactOpen,
    autoOpenArtifact,
    setAutoOpenArtifact,
    defaultMode,
    setDefaultMode,
    defaultModel,
    setDefaultModel,
    canvasWidth,
    setCanvasWidth,
    historyLimit,
    setHistoryLimit,
    sendKey,
    setSendKey,
    theme,
    setTheme,
  } = useChatStore();

  const modelOptions = useMemo(() => {
    const dyn = loadDynamicModels();
    const ids = MODELS.map((m) => ({ id: m.id, label: m.label }));
    for (const provider of Object.keys(dyn) as string[]) {
      for (const id of dyn[provider as keyof typeof dyn] ?? []) {
        if (!ids.some((m) => m.id === id)) ids.push({ id, label: id });
      }
    }
    return ids;
  }, []);

  return (
    <>
      <SectionCard
        icon={Sun}
        iconBg="bg-gradient-to-br from-amber-400 to-orange-500"
        title="外观主题"
        desc="全站浅色 / 深色即时切换；跟随系统会响应系统外观变化"
      >
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: "system", label: "跟随系统", icon: Monitor },
              { id: "light", label: "浅色", icon: Sun },
              { id: "dark", label: "深色", icon: Moon },
            ] as const
          ).map((o) => (
            <button
              key={o.id}
              onClick={() => setTheme(o.id)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-[12px] font-medium transition ${
                theme === o.id
                  ? "border-[var(--oc-brand-border-soft)] bg-[var(--oc-brand-soft)] text-[var(--oc-brand)]"
                  : "border-stone-200 text-stone-500 hover:bg-[var(--oc-hover)]"
              }`}
            >
              <o.icon className="h-5 w-5" />
              {o.label}
            </button>
          ))}
        </div>
        <p className="mt-3 rounded-lg bg-[var(--oc-panel-muted)] px-3 py-2 text-[11px] leading-4 text-stone-400">
          品牌色、卡片、边框与文字均已适配深色；主题偏好保存在本地，刷新后仍生效。
        </p>
      </SectionCard>

      <SectionCard
        icon={LayoutPanelTop}
        iconBg="bg-gradient-to-br from-orange-400 to-red-500"
        title="右侧产物画布"
        desc="控制 AI 创作画布的显示方式（即时生效）"
      >
        <SettingRow title="默认展开画布" desc="进入工作台时自动显示右侧 AI 创作画布">
          <Toggle checked={artifactOpen} onChange={setArtifactOpen} />
        </SettingRow>
        <SettingRow title="生成后自动展开" desc="AI 产出文档、PPT 或图片后自动打开右侧预览">
          <Toggle checked={autoOpenArtifact} onChange={setAutoOpenArtifact} />
        </SettingRow>
        <div className="pt-4">
          <div className="mb-2 flex items-center gap-1.5 text-[13.5px] font-medium text-stone-700">
            <PanelRight className="h-4 w-4 text-stone-400" /> 画布宽度
          </div>
          <Segmented
            value={canvasWidth}
            onChange={setCanvasWidth}
            options={CANVAS_OPTIONS.map((o) => ({ value: o.id, label: o.label, desc: o.desc }))}
          />
        </div>
      </SectionCard>

      <SectionCard
        icon={History}
        iconBg="bg-gradient-to-br from-sky-400 to-indigo-500"
        title="历史列表"
        desc="左侧对话历史最多显示条数（搜索不受影响）"
      >
        <Segmented
          value={historyLimit}
          onChange={setHistoryLimit}
          options={HISTORY_OPTIONS.map((n) => ({ value: n, label: `${n} 条` }))}
        />
      </SectionCard>

      <SectionCard
        icon={Send}
        iconBg="bg-gradient-to-br from-emerald-400 to-teal-500"
        title="发送行为"
        desc="快捷键仅在输入框聚焦时生效"
      >
        <SettingRow title="发送消息快捷键" desc="Ctrl/⌘+Enter 可避免误发；Shift+Enter 始终换行">
          <Segmented
            value={sendKey}
            onChange={setSendKey}
            options={[
              { value: "enter", label: "Enter 发送" },
              { value: "ctrlEnter", label: "Ctrl/⌘+Enter" },
            ]}
          />
        </SettingRow>
      </SectionCard>

      <SectionCard
        icon={Sparkles}
        iconBg="bg-gradient-to-br from-violet-400 to-purple-500"
        title="新建任务默认值"
        desc="点击「新建任务」时使用的模式与模型"
      >
        <div className="mb-4">
          <div className="mb-2 text-[13.5px] font-medium text-stone-700">默认模式</div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {MODE_OPTIONS.map((m) => {
              const Icon = m.icon;
              const active = defaultMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setDefaultMode(m.id)}
                  className={cn(
                    "flex items-start gap-2.5 rounded-xl border p-3 text-left transition",
                    active
                      ? "border-orange-300 bg-orange-50 shadow-sm"
                      : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      active ? "bg-white text-orange-500 shadow-sm" : "bg-stone-100 text-stone-400"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className={cn("block text-[13px] font-medium", active ? "text-orange-700" : "text-stone-700")}>
                      {MODE_LABELS[m.id]}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-stone-400">{m.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 text-[13.5px] font-medium text-stone-700">默认模型</div>
          <div className="relative">
            <select
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              className="w-full appearance-none rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 pr-9 text-sm text-stone-800 shadow-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            >
              {modelOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          </div>
          <p className="mt-1.5 text-[11px] text-stone-400">
            仅影响新建任务；切换会话时仍会恢复该会话原用模型。
          </p>
        </div>
      </SectionCard>

      <SectionCard
        icon={ShieldCheck}
        iconBg="bg-gradient-to-br from-emerald-400 to-teal-500"
        title="隐私与安全"
        desc="关于密钥和数据的处理方式"
      >
        <ul className="space-y-2 text-xs leading-relaxed text-stone-500">
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            模型 API Key 只保存在你的浏览器 localStorage，随请求转发给本应用后端，不写入数据库。
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            对话、文档、PPT 等产物保存在本地 SQLite，可在「数据管理」中导出备份。
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            未配置任何密钥时自动使用内置演示模型，所有功能均可完整体验。
          </li>
        </ul>
      </SectionCard>
    </>
  );
}

/* ═══════════════════════════ 联网搜索 ═══════════════════════════ */

function ResearchBehavior() {
  const { researchDepth, setResearchDepth, researchMaxResults, setResearchMaxResults } = useChatStore();
  return (
    <SectionCard
      icon={Search}
      iconBg="bg-gradient-to-br from-violet-400 to-purple-500"
      title="研究策略"
      desc="控制深度研究的检索强度与来源数量（配置 Tavily 后生效）"
    >
      <SettingRow title="搜索深度" desc="基本：2 条检索线、更快；高级：4 条检索线、结果更全面">
        <Segmented
          value={researchDepth}
          onChange={setResearchDepth}
          options={[
            { value: "basic", label: "快速" },
            { value: "advanced", label: "深度" },
          ]}
        />
      </SettingRow>
      <div className="flex items-center justify-between gap-4 pt-3.5">
        <div>
          <div className="text-[13.5px] font-medium text-stone-700">每次来源数</div>
          <p className="mt-0.5 text-xs text-stone-400">每条检索线返回的来源上限（5 / 6 / 8）</p>
        </div>
        <Segmented
          value={researchMaxResults}
          onChange={setResearchMaxResults}
          options={[5, 6, 8].map((n) => ({ value: n as 5 | 6 | 8, label: `${n} 条` }))}
        />
      </div>
    </SectionCard>
  );
}

/* ═══════════════════════════ 数据管理 ═══════════════════════════ */

function DataOverview() {
  const { conversations } = useChatStore();
  const stats = useMemo(() => {
    const messages = conversations.reduce((n, c) => n + (c.messages?.length ?? 0), 0);
    const images = conversations.reduce((n, c) => n + (c.images?.length ?? 0), 0);
    const slides = conversations.reduce((n, c) => n + (c.deck?.slides.length ?? 0), 0);
    const reports = conversations.filter((c) => c.report).length;
    const docs = conversations.filter((c) => c.doc).length;
    return { convos: conversations.length, messages, images, slides, reports, docs };
  }, [conversations]);

  const items = [
    { icon: MessageSquare, label: "会话", value: stats.convos, tint: "text-orange-500 bg-orange-50" },
    { icon: FileText, label: "消息", value: stats.messages, tint: "text-sky-500 bg-sky-50" },
    { icon: ImageIcon, label: "图片", value: stats.images, tint: "text-emerald-500 bg-emerald-50" },
    { icon: Presentation, label: "PPT 页", value: stats.slides, tint: "text-rose-500 bg-rose-50" },
    { icon: Search, label: "报告", value: stats.reports, tint: "text-violet-500 bg-violet-50" },
    { icon: FileCode2, label: "文档", value: stats.docs, tint: "text-amber-500 bg-amber-50" },
  ];

  return (
    <SectionCard
      icon={Database}
      iconBg="bg-gradient-to-br from-indigo-400 to-violet-500"
      title="本地数据概览"
      desc="当前工作区中已加载的数据量（实时统计）"
    >
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.label} className="rounded-xl border border-stone-100 bg-stone-50/60 p-3 text-center">
              <span className={cn("mx-auto flex h-8 w-8 items-center justify-center rounded-lg", it.tint)}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="mt-2 text-[18px] font-bold leading-none text-stone-800">{it.value}</div>
              <div className="mt-1 text-[11px] text-stone-400">{it.label}</div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-stone-400">
        消息数来自当前已加载的会话；完整备份请使用「导出全部（JSON）」。
      </p>
    </SectionCard>
  );
}

function ExportCurrentMarkdown() {
  const { conversations, activeId } = useChatStore();
  const convo = conversations.find((c) => c.id === activeId);
  const [copying, setCopying] = useState(false);

  const build = () => {
    if (!convo) return "";
    const lines: string[] = [`# ${convo.title}`, "", `> 模式：${MODE_LABELS[convo.mode]} · 模型：${convo.model}`, ""];
    for (const m of convo.messages) {
      lines.push(m.role === "user" ? "## 🙋 用户" : "## 🤖 AI", "", m.content, "");
    }
    return lines.join("\n");
  };

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        onClick={async () => {
          const text = build();
          if (!text) {
            toast("当前会话暂无消息", "info");
            return;
          }
          setCopying(true);
          try {
            await navigator.clipboard?.writeText(text);
            toast("已复制为 Markdown", "success");
          } catch {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
            a.download = `${convo?.title ?? "conversation"}.md`;
            a.click();
            URL.revokeObjectURL(a.href);
            toast("已下载 Markdown 文件", "success");
          }
          setCopying(false);
        }}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-600 transition hover:border-orange-300 hover:text-orange-600"
      >
        {copying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardList className="h-3.5 w-3.5" />}
        当前会话 Markdown
      </button>
    </div>
  );
}

/* ═══════════════════════════ 关于 ═══════════════════════════ */

function AboutTab() {
  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-white px-5 py-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-200">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-bold text-stone-800">OpenCanvas AI</span>
                <StatusPill text="v0.1.0" kind="info" />
              </div>
              <p className="mt-0.5 text-xs text-stone-400">一站式 AI 智能体工作空间</p>
            </div>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-stone-500">
            对话、深度研究、PPT、图片、视频与文档 —— 在一个工作空间里全部完成，聚合国内外主流大模型。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="https://github.com/lichongyang130/opencanvas"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-stone-700"
            >
              <Github className="h-3.5 w-3.5" /> GitHub 仓库
            </a>
            <button
              onClick={() => toast("反馈通道即将开放，可在 GitHub 提交 Issue", "info")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-600 transition hover:border-orange-300 hover:text-orange-600"
            >
              <MessageSquare className="h-3.5 w-3.5" /> 反馈建议 <ExternalLink className="h-3 w-3 text-stone-400" />
            </button>
          </div>
        </div>

        <div className="border-t border-stone-100 p-5">
          <h4 className="mb-3 text-[13px] font-semibold text-stone-700">核心能力</h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ABOUT_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.label}
                  className="flex items-center gap-2.5 rounded-xl border border-stone-100 bg-stone-50/60 px-3 py-2.5"
                >
                  <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", f.tint)}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-medium text-stone-600">{f.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <SectionCard
        icon={ClipboardList}
        iconBg="bg-gradient-to-br from-amber-400 to-orange-500"
        title="更新日志"
        desc="近期迭代内容"
      >
        <ol className="space-y-4">
          {CHANGELOG.map((v) => (
            <li key={v.tag} className="flex gap-3">
              <div className="flex shrink-0 flex-col items-center">
                <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold text-orange-600">
                  {v.tag}
                </span>
                <span className="mt-0.5 text-[10px] text-stone-400">{v.date}</span>
              </div>
              <ul className="min-w-0 flex-1 space-y-1 text-xs leading-relaxed text-stone-500">
                {v.items.map((it) => (
                  <li key={it} className="flex items-start gap-1.5">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-stone-300" />
                    {it}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </SectionCard>

      <SectionCard
        icon={Cpu}
        iconBg="bg-gradient-to-br from-stone-600 to-stone-800"
        title="技术栈"
        desc="本项目构建所用技术"
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TECH_STACK.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.label} className="flex items-center gap-2.5 rounded-xl border border-stone-100 px-3 py-2.5">
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", t.tint)}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-medium text-stone-600">{t.label}</span>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <ThemeCard />
    </>
  );
}

/* ---------------- 关于页：主题状态卡片 ---------------- */

function ThemeCard() {
  const { theme, setTheme, settingsTab, setSettingsTab } = useChatStore();
  const label = theme === "dark" ? "深色" : theme === "light" ? "浅色" : "跟随系统";
  return (
    <SectionCard
      icon={Sun}
      iconBg="bg-gradient-to-br from-pink-400 to-rose-500"
      title="主题外观"
      desc={`当前：${label}（可在通用页切换）`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </span>
          <div>
            <div className="text-[13px] font-medium text-stone-700">{label}模式</div>
            <p className="text-[11px] text-stone-400">
              {theme === "system" ? "随操作系统自动切换浅色/深色" : "主题偏好已保存在本地"}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setSettingsTab("general");
            void 0;
          }}
          className="rounded-lg bg-[var(--oc-brand-soft)] px-3 py-1.5 text-[12px] font-medium text-[var(--oc-brand)] transition hover:bg-[var(--oc-brand-mid)]"
        >
          去切换
        </button>
      </div>
    </SectionCard>
  );
}

/* ---------------- 网关增强 & 成本看板 ---------------- */

interface GatewayConfig {
  fallback: boolean;
  rateLimitPerMin: number;
  providers: Record<string, boolean>;
  adminEnabled: boolean;
}

interface GatewayStatsResp {
  scope: "me" | "all";
  stats: {
    today: { date: string; calls: number; errors: number; inputTokens: number; outputTokens: number; costUsd: number; credits: number };
    week: { date: string; calls: number; errors: number; inputTokens: number; outputTokens: number; costUsd: number; credits: number }[];
    totals: { date: string; calls: number; errors: number; inputTokens: number; outputTokens: number; costUsd: number; credits: number };
    byModel: { modelId: string; providerId: string; calls: number; costUsd: number; credits: number }[];
    latest: { modelId: string; providerId: string; status: string; costUsd: number; createdAt: number }[];
  };
}

function GatewayTuningCard() {
  const [cfg, setCfg] = useState<GatewayConfig | null>(null);

  useEffect(() => {
    fetch("/api/gateway/config")
      .then((r) => r.json())
      .then((d: GatewayConfig) => setCfg(d))
      .catch(() => setCfg(null));
  }, []);

  if (!cfg) {
    return (
      <div className="flex items-center gap-2 text-xs text-stone-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> 读取网关配置…
      </div>
    );
  }

  const items = [
    {
      label: "跨供应商降级",
      ok: cfg.fallback,
      desc: cfg.fallback
        ? "上游失败且未输出时，自动沿 fallback 链切换（如 GPT-4o mini → DeepSeek → Qwen）"
        : "已关闭（GATEWAY_FALLBACK=0）",
    },
    {
      label: "多 Key 轮询",
      ok: Object.values(cfg.providers).some(Boolean),
      desc: "环境变量 USE `OPENAI_API_KEYS=a,b,c` 逗号分隔即可自动轮换，401/429 自动换 key 重试",
    },
    {
      label: "限流",
      ok: cfg.rateLimitPerMin > 0,
      desc:
        cfg.rateLimitPerMin > 0
          ? `${cfg.rateLimitPerMin} 次/分钟/用户（未登录按 IP）`
          : "已关闭（GATEWAY_RATE_LIMIT=0）",
    },
  ];

  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.label} className="flex items-start justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50/60 px-3.5 py-3">
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold text-stone-700">{it.label}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-stone-400">{it.desc}</p>
          </div>
          <StatusPill
            text={it.ok ? "已启用" : "已关闭"}
            kind={it.ok ? "ok" : "fail"}
            icon={it.ok ? <Check className="h-3 w-3" /> : undefined}
          />
        </div>
      ))}
      <pre className="overflow-x-auto rounded-lg bg-stone-900 px-3.5 py-3 text-[10.5px] leading-5 text-stone-300">
{`GATEWAY_FALLBACK=1        # 自动降级（默认开）
GATEWAY_RATE_LIMIT=60     # 限流：次/分钟/用户（0 关闭）
OPENAI_API_KEYS=a,b,c     # 多 Key 轮询（各供应商同款 *_KEYS）
GATEWAY_ADMIN_KEY=admin-xxx  # 成本看板「全局视角」密钥`}
      </pre>
    </div>
  );
}

function GatewayStatsCard() {
  const [stats, setStats] = useState<GatewayStatsResp | null>(null);
  const [scope, setScope] = useState<"me" | "all">("me");
  const [adminKey, setAdminKey] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async (s: "me" | "all" = scope, key = adminKey) => {
    setBusy(true);
    try {
      const headers: Record<string, string> = {};
      if (s === "all" && key) headers["x-admin-key"] = key;
      const r = await fetch(`/api/gateway/stats?scope=${s}`, { headers });
      const j = (await r.json()) as GatewayStatsResp & { error?: string };
      if (!r.ok) throw new Error(j.error ?? "加载失败");
      setStats(j);
    } catch (err) {
      toast(err instanceof Error ? err.message : "加载用量失败", "error");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load("me", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmtUsd = (v: number) => `$${v.toFixed(4)}`;
  const weekMax = Math.max(1, ...(stats?.stats.week.map((d) => d.calls) ?? [1]));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setScope("me"); void load("me", adminKey); }}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] transition",
              scope === "me" ? "border-sky-300 bg-sky-50 text-sky-700" : "border-stone-200 text-stone-400 hover:border-stone-300"
            )}
          >
            我的用量
          </button>
          <button
            onClick={() => { setScope("all"); void load("all", adminKey); }}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] transition",
              scope === "all" ? "border-sky-300 bg-sky-50 text-sky-700" : "border-stone-200 text-stone-400 hover:border-stone-300"
            )}
          >
            全局视角
          </button>
          {scope === "all" && (
            <input
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="GATEWAY_ADMIN_KEY"
              className="w-36 rounded-lg border border-stone-200 px-2 py-1 text-[11px] outline-none focus:border-sky-300"
            />
          )}
        </div>
        <button
          onClick={() => void load(scope, adminKey)}
          disabled={busy}
          className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1 text-[11px] text-stone-500 transition hover:border-sky-300 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} 刷新
        </button>
      </div>

      {!stats ? (
        <div className="flex items-center gap-2 py-6 text-xs text-stone-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> 加载用量数据…
        </div>
      ) : (
        <>
          {/* 今日概览 */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "今日调用", value: String(stats.stats.today.calls) },
              { label: "今日成本", value: fmtUsd(stats.stats.today.costUsd) },
              { label: "今日积分", value: String(stats.stats.today.credits) },
              {
                label: "7 天成本",
                value: fmtUsd(stats.stats.totals.costUsd),
              },
            ].map((x) => (
              <div key={x.label} className="rounded-xl border border-stone-100 bg-white px-3 py-2.5">
                <p className="text-[10px] text-stone-400">{x.label}</p>
                <p className="mt-0.5 text-[15px] font-semibold text-stone-700">{x.value}</p>
              </div>
            ))}
          </div>

          {/* 近 7 天柱状 */}
          <div className="rounded-xl border border-stone-100 p-3">
            <p className="mb-2 text-[11px] font-medium text-stone-500">近 7 天调用次数</p>
            <div className="flex h-16 items-end gap-1.5">
              {stats.stats.week.map((d) => (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-sky-200/80 transition-all"
                    style={{ height: `${Math.max(3, (d.calls / weekMax) * 100)}%` }}
                    title={`${d.date}: ${d.calls} 次`}
                  />
                  <span className="text-[9px] text-stone-400">{d.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 按模型 */}
          {stats.stats.byModel.length > 0 && (
            <div className="rounded-xl border border-stone-100 p-3">
              <p className="mb-2 text-[11px] font-medium text-stone-500">按模型（近 7 天成本）</p>
              <div className="space-y-1.5">
                {stats.stats.byModel.map((m) => (
                  <div key={m.modelId + m.providerId} className="flex items-center justify-between gap-2 text-[11.5px]">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Activity className="h-3 w-3 shrink-0 text-sky-400" />
                      <span className="truncate text-stone-600">{m.modelId}</span>
                      <span className="shrink-0 rounded bg-stone-100 px-1 py-px text-[9.5px] text-stone-400">{m.providerId}</span>
                    </span>
                    <span className="shrink-0 text-stone-500">
                      {m.calls} 次 · {fmtUsd(m.costUsd)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 最近调用 */}
          {stats.stats.latest.length > 0 && (
            <div className="rounded-xl border border-stone-100 p-3">
              <p className="mb-2 text-[11px] font-medium text-stone-500">最近调用</p>
              <div className="space-y-1">
                {stats.stats.latest.map((l, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-[11px] text-stone-500">
                    <span className="min-w-0 truncate">{l.modelId}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className={cn("rounded-full px-1.5 py-px text-[9.5px]", l.status === "success" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                        {l.status}
                      </span>
                      <span className="text-stone-400">{fmtUsd(l.costUsd)}</span>
                      <span className="text-stone-300">{new Date(l.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------- 账号与数据权利（导出 / 删除） ---------------- */

function AccountRightsCard() {
  const user = useAuthStore((s) => s.user);
  const [deleteWord, setDeleteWord] = useState("");
  const [deleting, setDeleting] = useState(false);

  const doDelete = async () => {
    if (deleteWord !== "DELETE") {
      toast("请输入 DELETE 确认", "error");
      return;
    }
    setDeleting(true);
    try {
      const r = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      const j = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !j.ok) throw new Error(j.error ?? "删除失败");
      toast("账号已删除，正在退出…", "success");
      window.location.href = "/";
    } catch (err) {
      toast(err instanceof Error ? err.message : "删除失败", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-stone-50 p-3.5">
        <div className="min-w-0">
          <p className="text-xs font-medium text-stone-600">导出我的数据</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-stone-400">
            {user
              ? "包含账号资料、名下会话与消息、模型用量记录（JSON）"
              : "未登录时导出仅包含本机匿名会话；登录后可导出完整账号数据"}
          </p>
        </div>
        <a
          href="/api/export"
          download
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-600 transition hover:border-indigo-300 hover:text-indigo-600"
        >
          <Download className="h-3.5 w-3.5" /> 导出 JSON
        </a>
      </div>

      <div className="rounded-xl border border-red-100 bg-red-50/50 p-3.5">
        <p className="text-xs font-medium text-red-700">删除账号（不可撤销）</p>
        <p className="mt-1 text-[11px] leading-relaxed text-red-500">
          永久删除账号资料、登录会话、名下全部会话/消息与模型用量记录。积分账本与模板市场为全局共享数据，不随删号变动。
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={deleteWord}
            onChange={(e) => setDeleteWord(e.target.value)}
            placeholder='输入 DELETE 确认'
            disabled={!user || deleting}
            className="w-40 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs outline-none transition focus:border-red-400 disabled:opacity-50"
          />
          <button
            onClick={() => void doDelete()}
            disabled={!user || deleting || deleteWord !== "DELETE"}
            className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            永久删除账号
          </button>
          {!user && <span className="text-[11px] text-stone-400">请先登录后再删除账号</span>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- 运行诊断（健康检查 + 前端错误） ---------------- */

function DiagnosticsCard() {
  const [health, setHealth] = useState<{
    ok: boolean;
    version?: string;
    node?: string;
    uptimeSec?: number;
    db?: string;
    providers?: Record<string, boolean>;
  } | null>(null);
  const [errors, setErrors] = useState<{
    stats: { total: number; last24h: number; top: { message: string; count: number }[]; recent: { message: string; source: string; url: string; createdAt: number }[] };
  } | null>(null);

  const load = async () => {
    try {
      const [h, e] = await Promise.all([
        fetch("/api/health").then((r) => r.json()),
        fetch("/api/logs/client/stats").then(async (r) => (r.ok ? r.json() : null)),
      ]);
      setHealth(h);
      setErrors(e);
    } catch {
      setHealth(null);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmtUp = (sec?: number) =>
    sec === undefined ? "-" : sec < 60 ? `${sec}s` : sec < 3600 ? `${Math.floor(sec / 60)}m` : `${(sec / 3600).toFixed(1)}h`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill
            text={health?.ok ? "服务正常" : "检测中"}
            kind={health?.ok ? "ok" : "info"}
            icon={health?.ok ? <Check className="h-3 w-3" /> : undefined}
          />
          <StatusPill text={`DB ${health?.db ?? "-"}`} kind={health?.db === "ok" ? "ok" : health?.db === "error" ? "fail" : "info"} />
          <StatusPill text={`Node ${health?.node ?? "-"}`} kind="info" />
          <StatusPill text={`运行 ${fmtUp(health?.uptimeSec)}`} kind="info" />
        </div>
        <button
          onClick={() => void load()}
          className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1 text-[11px] text-stone-500 transition hover:border-slate-300"
        >
          <RefreshCw className="h-3 w-3" /> 刷新
        </button>
      </div>

      {errors && (
        <div className="rounded-xl border border-stone-100 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-stone-500">前端运行时错误</p>
            <p className="text-[11px] text-stone-400">
              累计 <span className="font-semibold text-stone-600">{errors.stats.total}</span> · 24h{" "}
              <span className="font-semibold text-stone-600">{errors.stats.last24h}</span>
            </p>
          </div>
          {errors.stats.total === 0 ? (
            <p className="mt-2 text-[11.5px] text-emerald-600">✓ 暂无运行时错误上报</p>
          ) : (
            <div className="mt-2 space-y-1">
              {errors.stats.recent.slice(0, 3).map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-stone-500">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                  <span className="min-w-0 flex-1 truncate">{r.message}</span>
                  <span className="shrink-0 text-stone-300">
                    {new Date(r.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-[10.5px] leading-relaxed text-stone-400">
        错误自动采集（window.onerror / unhandledrejection）并按 10 秒节流上报，仅存错误摘要与页面路径，不含对话内容。
      </p>
    </div>
  );
}
