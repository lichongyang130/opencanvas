import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  Search,
  Sparkles,
  Video,
} from "lucide-react";

const CAPABILITIES = [
  { icon: <Search className="h-5 w-5" />, title: "深度研究", desc: "自动多轮搜索、阅读资料，输出带引用的研究报告" },
  { icon: <LayoutDashboard className="h-5 w-5" />, title: "PPT 生成", desc: "一句话生成结构完整、配图精美的幻灯片，可导出 PPTX" },
  { icon: <ImageIcon className="h-5 w-5" />, title: "图片设计", desc: "社媒图、海报、品牌视觉，文生图与图生图" },
  { icon: <Video className="h-5 w-5" />, title: "视频创作", desc: "脚本分镜 + 文生视频，几分钟出成片素材" },
  { icon: <FileText className="h-5 w-5" />, title: "文档写作", desc: "商业计划、邮件、制度、文案，出版级成稿" },
  { icon: <Globe className="h-5 w-5" />, title: "国内外模型一站切换", desc: "GPT、Claude、DeepSeek、通义千问…密钥统一网关" },
];

const AUDIENCES = [
  { title: "市场营销人员", desc: "趋势调研、社媒文案、品牌视觉，campaign 上线快一步" },
  { title: "研究与分析师", desc: "从复杂信息中提取洞察，快速产出专业报告与 PPT" },
  { title: "创业者", desc: "商业计划、产品概念、网站原型，从想法到上线全程加速" },
  { title: "教师与教育者", desc: "教案、课件、学习材料一键生成，长文即时总结" },
];

const PRICING = [
  { name: "Free", price: "¥0 / $0", tag: "体验", features: ["每月 100 积分", "演示模型 + 基础模型", "文档与对话"], cta: "免费开始" },
  { name: "Pro", price: "$19.9/月", tag: "个人", features: ["高额度积分", "全部高级模型", "PPT / 研究 / 视频", "品牌中心"], cta: "升级 Pro", highlight: true },
  { name: "Teams", price: "$49/人/月", tag: "团队", features: ["团队协作空间", "品牌资产共享", "优先算力", "API 接入"], cta: "联系我们" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-stone-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
              O
            </div>
            <span className="text-lg font-semibold tracking-tight">OpenCanvas AI</span>
          </div>
          <nav className="hidden items-center gap-7 text-sm text-stone-600 md:flex">
            <a href="#features" className="hover:text-brand-600">功能</a>
            <a href="#audience" className="hover:text-brand-600">适用人群</a>
            <a href="#pricing" className="hover:text-brand-600">定价</a>
            <a href="#faq" className="hover:text-brand-600">常见问题</a>
          </nav>
          <Link
            href="/chat"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            免费试用
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-50/80 to-white" />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-medium text-brand-700">
            <Sparkles className="h-3.5 w-3.5" /> 你的终极 AI 智能体工作空间
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            研究、分析、创作
            <br />
            <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
              在一个流程里全部完成
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-stone-500">
            说一句话，AI 自动完成深度调研、写出文档、做好 PPT、生成图片与视频。
            聚合国内外主流大模型，营销、研究、创业、教学全场景覆盖。
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-base font-medium text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700"
            >
              立即免费开始 <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-stone-200 px-6 py-3 text-base font-medium text-stone-700 transition hover:border-brand-300"
            >
              查看功能
            </a>
          </div>
          <p className="mt-4 text-sm text-stone-400">注册即送免费积分 · 无需信用卡</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight">一个工作空间，六种生产力</h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-stone-200 p-6 transition hover:border-brand-300 hover:shadow-lg hover:shadow-brand-600/5"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                {c.icon}
              </div>
              <h3 className="mb-1.5 font-semibold">{c.title}</h3>
              <p className="text-sm leading-relaxed text-stone-500">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Audience */}
      <section id="audience" className="bg-stone-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">为每个人打造</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((a) => (
              <div key={a.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-2 font-semibold text-brand-700">{a.title}</h3>
                <p className="text-sm leading-relaxed text-stone-500">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight">简单透明的定价</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PRICING.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-7 ${
                p.highlight
                  ? "border-brand-600 shadow-xl shadow-brand-600/10"
                  : "border-stone-200"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-0.5 text-xs font-medium text-white">
                  最受欢迎
                </span>
              )}
              <div className="text-sm font-medium text-stone-400">
                {p.name} · {p.tag}
              </div>
              <div className="mt-2 text-2xl font-bold">{p.price}</div>
              <ul className="mt-5 space-y-2.5 text-sm text-stone-600">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/chat"
                className={`mt-7 block rounded-xl py-2.5 text-center text-sm font-medium transition ${
                  p.highlight
                    ? "bg-brand-600 text-white hover:bg-brand-700"
                    : "border border-stone-200 hover:border-brand-300"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-stone-50 py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">常见问题</h2>
          <div className="mt-10 space-y-3">
            {[
              {
                q: "这是什么？",
                a: "一个一站式 AI 智能体工作空间：在对话里完成深度研究、PPT、文档、绘图，产物实时出现在右侧画布并可持续编辑。",
              },
              {
                q: "支持哪些大模型？",
                a: "支持 OpenAI、Anthropic Claude、DeepSeek、阿里云通义/万相，国内外模型在一个地方切换。你也可以用自己的 API Key（BYOK），密钥只存在本地浏览器。",
              },
              {
                q: "没有 API Key 能用吗？",
                a: "可以。内置免费演示模型，对话、PPT、绘图、研究都能完整体验流程；配置真实密钥后即切换为真实生成。",
              },
              {
                q: "数据会丢吗？",
                a: "会话、消息、PPT、图片、报告都保存在本地数据库，刷新和重启不丢失；还可以在模型设置里一键导出 JSON 备份。",
              },
              {
                q: "PPT 能导出吗？",
                a: "能。一键导出 .pptx，可直接用 PowerPoint / WPS 打开；支持换主题、在线编辑文字、增删页面。",
              },
            ].map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-stone-200 bg-white p-4 [&_summary]:cursor-pointer"
              >
                <summary className="flex items-center justify-between font-medium text-stone-800 marker:content-none">
                  {f.q}
                  <span className="text-brand-500 transition group-open:rotate-45">＋</span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-3xl bg-brand-600 px-8 py-16 text-center text-white">
          <h2 className="text-3xl font-bold">开始你的第一个 AI 任务</h2>
          <p className="mt-3 text-brand-100">深度研究、PPT、图片、视频、文档——把想法变成成品</p>
          <Link
            href="/chat"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-medium text-brand-700 transition hover:bg-brand-50"
          >
            免费进入工作空间 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-stone-100 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-stone-400 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-xs font-bold text-white">
              O
            </div>
            OpenCanvas AI
          </div>
          <div className="flex items-center gap-5">
            <a href="#features" className="hover:text-brand-600">功能</a>
            <a href="#pricing" className="hover:text-brand-600">定价</a>
            <a href="#faq" className="hover:text-brand-600">常见问题</a>
            <Link href="/chat" className="hover:text-brand-600">进入工作台</Link>
          </div>
          <div>© 2026 OpenCanvas AI</div>
        </div>
      </footer>
    </div>
  );
}
