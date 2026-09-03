import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "隐私政策 · OpenCanvas",
  description: "OpenCanvas 隐私政策：我们收集什么、如何使用、如何保护与删除你的数据。",
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. 我们收集什么",
    body: [
      "账户信息：注册/登录时收集邮箱与昵称（OAuth 登录时来自 Google / GitHub 的公开资料）。密码以加盐哈希存储，我们无法查看你的明文密码。",
      "内容数据：你在工作台产生的对话、文档、PPT、图片与研究任务内容，用于向你提供功能并在会话中保存。",
      "使用数据：模型网关记录每次调用的模型、供应商、token 用量与成本，用于计费、限流与故障排查。",
      "本地数据：你填写的 API Key 与界面偏好保存在浏览器 localStorage 中，除用于转发到本应用后端调用模型外，不写入我们的数据库。",
    ],
  },
  {
    title: "2. 我们如何使用",
    body: [
      "仅用于提供与改进 OpenCanvas 的核心功能（对话、生成、导出、分享）。",
      "分享功能：你主动生成分享链接的内容会被保存为公开只读页，任何持有链接的人可查看；取消分享不会自动删除已生成的链接内容。",
      "我们不出售你的数据，不用于广告推送。",
    ],
  },
  {
    title: "3. 数据存储与安全",
    body: [
      "开发/本地版使用 SQLite 持久化，部署后可按需迁移 PostgreSQL；密钥不落库（浏览器本地）。",
      "敏感操作（登录会话）使用 HttpOnly Cookie + 服务端会话表，会话有有效期。",
      "我们采取合理的技术措施防止未授权访问；但任何互联网传输与存储都无法保证绝对安全。",
    ],
  },
  {
    title: "4. 第三方服务",
    body: [
      "对话/生成内容会发送到你选择的模型供应商（OpenAI、Anthropic、DeepSeek、阿里云百炼、fal.ai 等）及其所在区域的服务器处理，请在使用前确认各供应商的数据政策。",
      "联网搜索（Tavily）与图片处理（remove.bg 等）按功能需要转发相应请求。",
    ],
  },
  {
    title: "5. 你的权利",
    body: [
      "导出：在「设置 → 数据管理」可一键导出你的账号数据（JSON）。",
      "删除：在「设置 → 数据管理」可删除账号及名下全部数据，操作不可撤销。",
      "退出登录：随时可退出，本地数据仍保留。",
    ],
  },
  {
    title: "6. 政策更新与联系",
    body: [
      "本政策可能随功能演进更新，重大变更会通过页面公告提示。",
      "如有疑问或行使权利，请通过项目仓库提交 Issue 联系我们。",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--oc-bg)] text-stone-800">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-stone-500 transition hover:text-stone-700">
          <ArrowLeft className="h-4 w-4" /> 返回首页
        </Link>
        <span className="text-[11px] text-stone-400">最近更新：2026-09-03</span>
      </header>
      <main className="mx-auto max-w-3xl px-6 pb-20">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">隐私政策</h1>
            <p className="text-sm text-stone-500">OpenCanvas 隐私政策与数据处理说明</p>
          </div>
        </div>

        <div className="space-y-5">
          {SECTIONS.map((s) => (
            <section key={s.title} className="rounded-2xl border border-[var(--oc-border)] bg-white p-6 shadow-sm">
              <h2 className="text-[15px] font-semibold text-stone-800">{s.title}</h2>
              <ul className="mt-3 space-y-2">
                {s.body.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] leading-6 text-stone-500">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
                    {b}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-stone-400">
          © 2026 OpenCanvas · <Link href="/terms" className="hover:text-stone-600">用户协议</Link>
        </p>
      </main>
    </div>
  );
}
