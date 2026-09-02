"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Check,
  Cloud,
  Cpu,
  FileText,
  Gauge,
  Sparkles,
  Zap,
} from "lucide-react";
import { ShellSidebar } from "@/components/mockup/ShellSidebar";
import { toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "免费版",
    price: "¥0",
    period: "永久免费",
    highlight: false,
    features: ["每日 10 次对话", "基础模型", "文档 / PPT 导出带水印", "社区支持"],
    cta: "当前方案",
  },
  {
    name: "专业版",
    price: "¥39",
    period: "每月",
    highlight: true,
    features: ["无限对话", "全部高级模型", "文档 / PPT 无水印导出", "深度思考 + 联网搜索", "优先体验新功能"],
    cta: "当前方案",
  },
  {
    name: "团队版",
    price: "¥99",
    period: "每月 / 席位",
    highlight: false,
    features: ["包含专业版全部权益", "团队成员协作", "共享知识库", "统一账单与权限管理"],
    cta: "升级团队版",
  },
];

const FEATURES = [
  { icon: Cpu, color: "from-orange-400 to-red-500", title: "解锁全部模型", desc: "OpenAI / Claude / DeepSeek / 通义 随心切换" },
  { icon: Gauge, color: "from-violet-400 to-purple-500", title: "深度思考", desc: "复杂推理任务获得更高质量回答" },
  { icon: Zap, color: "from-sky-400 to-blue-500", title: "联网搜索", desc: "检索互联网最新信息，答案更实时" },
  { icon: FileText, color: "from-emerald-400 to-teal-500", title: "无水印导出", desc: "文档 / PPT / 报告导出更专业" },
  { icon: Cloud, color: "from-pink-400 to-rose-500", title: "云同步", desc: "多设备同步会话与知识库" },
  { icon: Bot, color: "from-amber-400 to-orange-500", title: "智能体生态", desc: "使用全部进阶智能体与工具" },
];

export default function MembershipPage() {
  const router = useRouter();

  return (
    <div className="flex h-screen overflow-hidden bg-[#fdfaf6] text-stone-800">
      <ShellSidebar active="chat" />

      {/* 主区域 */}
      <main className="relative flex-1 overflow-y-auto">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(255,183,148,0.18),rgba(244,114,182,0.07)_55%,transparent_100%)]" />

        <div className="relative z-10 mx-auto max-w-[860px] px-6 pb-16 pt-10 sm:px-8">
          {/* 会员头 */}
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-orange-500">
                <Sparkles className="h-3.5 w-3.5" />
                会员中心
              </div>
              <h1 className="mt-2 text-[26px] font-bold tracking-tight text-stone-900">开启你的专业创作体验</h1>
              <p className="mt-1.5 text-[14px] text-stone-500">解锁全部模型能力、无水印导出与更快的创作速度</p>
            </div>
          </div>

          {/* 当前套餐卡 */}
          <div className="mt-8 overflow-hidden rounded-3xl border border-orange-200/80 bg-gradient-to-r from-orange-50 via-amber-50/70 to-white shadow-[0_10px_40px_rgba(249,115,22,0.12)]">
            <div className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <Image
                  src="/avatar.png"
                  alt="Alex Chen"
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-2xl border-2 border-white object-cover shadow"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-semibold text-stone-800">Alex Chen</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-medium text-white shadow-sm shadow-orange-200">
                      <BadgeCheck className="h-3 w-3" /> 专业版
                    </span>
                  </div>
                  <div className="mt-1 text-[12px] text-stone-500">
                    下次续费：2026-10-02 · 自动续费
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push("/chat")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-orange-200 transition hover:brightness-105"
              >
                继续创作 <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 divide-x divide-orange-100 border-t border-orange-100 bg-white/60">
              {[
                { label: "本月已用额度", value: "128 / 无限", note: "专业版不限量" },
                { label: "对话次数", value: "1,024 次", note: "本月累计" },
                { label: "已导出文档", value: "36 份", note: "均无水印" },
              ].map((s) => (
                <div key={s.label} className="px-4 py-3.5 text-center">
                  <div className="text-[15px] font-semibold text-stone-800">{s.value}</div>
                  <div className="mt-0.5 text-[11px] text-stone-400">{s.label}</div>
                  <div className="mt-0.5 text-[10px] text-orange-500">{s.note}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 权益 */}
          <div className="mt-10">
            <h2 className="text-[16px] font-semibold text-stone-800">专业权益</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow">
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm", f.color)}>
                    <f.icon className="h-4 w-4" />
                  </span>
                  <div className="mt-3 text-[13.5px] font-semibold text-stone-800">{f.title}</div>
                  <div className="mt-1 text-[11.5px] leading-relaxed text-stone-400">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 套餐 */}
          <div className="mt-10">
            <h2 className="text-[16px] font-semibold text-stone-800">选择你的方案</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {PLANS.map((p) => (
                <div
                  key={p.name}
                  className={cn(
                    "relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm",
                    p.highlight
                      ? "border-orange-300 shadow-lg shadow-orange-100"
                      : "border-stone-200/80"
                  )}
                >
                  {p.highlight && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-2.5 py-0.5 text-[10px] font-medium text-white shadow">
                      最受欢迎
                    </span>
                  )}
                  <div className="text-[13px] font-medium text-stone-500">{p.name}</div>
                  <div className="mt-2 flex items-end gap-1">
                    <span className="text-[28px] font-bold text-stone-900">{p.price}</span>
                    <span className="mb-1 text-[11px] text-stone-400">{p.period}</span>
                  </div>
                  <ul className="mt-4 flex-1 space-y-2">
                    {p.features.map((ft) => (
                      <li key={ft} className="flex items-center gap-2 text-[12.5px] text-stone-600">
                        <Check className={cn("h-3.5 w-3.5 shrink-0", p.highlight ? "text-orange-500" : "text-stone-300")} />
                        {ft}
                      </li>
                    ))}
                  </ul>
                  <button
                    disabled={p.name === "专业版"}
                    onClick={() => toast("升级 / 购买功能即将上线", "info")}
                    className={cn(
                      "mt-5 rounded-xl px-4 py-2.5 text-[12.5px] font-medium transition",
                      p.highlight
                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-200 hover:brightness-105"
                        : "border border-stone-200 bg-white text-stone-600 hover:border-orange-300 hover:text-orange-600",
                      p.name === "专业版" && "cursor-default bg-stone-100 text-stone-400"
                    )}
                  >
                    {p.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-10 text-center text-[11px] text-stone-400">
            本页为会员中心演示，实际购买与账单能力将在后续接入。
          </p>
        </div>
      </main>
    </div>
  );
}
