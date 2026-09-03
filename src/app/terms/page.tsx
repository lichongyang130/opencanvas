import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata = {
  title: "用户协议 · OpenCanvas",
  description: "OpenCanvas 服务条款：使用规则、积分与付费、内容责任与免责声明。",
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. 服务内容",
    body: [
      "OpenCanvas 提供 AI 对话、PPT 生成、文档写作、AI 绘图、深度研究等创作工具（下称「服务」）。",
      "服务依赖第三方大模型供应商，可用性、速度与生成质量受其影响，我们不保证持续可用或输出完全准确。",
    ],
  },
  {
    title: "2. 账户与安全",
    body: [
      "你需对账户下的行为负责，妥善保管登录凭据；发现异常请立即退出登录并联系我们。",
      "禁止注册机器人账号、批量滥用、攻击服务或以任何方式干扰其他用户。",
    ],
  },
  {
    title: "3. 积分与费用",
    body: [
      "本地版本积分用于抵扣模型调用成本；每日签到、上传、分享等可获得积分，具体规则以页面展示为准。",
      "积分不具现金价值，不可转让或提现；账号删除后积分随之失效。",
    ],
  },
  {
    title: "4. 用户内容与责任",
    body: [
      "你对自己输入、生成与分享的内容负责，包括其合法性与知识产权。",
      "不得利用服务生成或传播违法、侵权、有害内容；违规内容可能被拒绝生成或删除。",
      "分享功能产生的内容为公开只读，请勿分享含隐私或保密信息的内容。",
    ],
  },
  {
    title: "5. 知识产权",
    body: [
      "服务界面、代码与品牌归 OpenCanvas 项目所有。",
      "你生成的创作内容归你所有；模型供应商可能基于其政策使用调用数据，详见其条款。",
    ],
  },
  {
    title: "6. 免责与终止",
    body: [
      "服务按「现状」提供，不对生成结果的准确性与商业适用性作保证；请对重要内容人工核验。",
      "我们可因安全、合规或政策原因暂停或终止违规账户，并保留追责权利。",
      "条款更新后继续使用即视为接受更新内容。",
    ],
  },
];

export default function TermsPage() {
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
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-sm">
            <FileText className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">用户协议</h1>
            <p className="text-sm text-stone-500">使用 OpenCanvas 即表示同意以下条款</p>
          </div>
        </div>

        <div className="space-y-5">
          {SECTIONS.map((s) => (
            <section key={s.title} className="rounded-2xl border border-[var(--oc-border)] bg-white p-6 shadow-sm">
              <h2 className="text-[15px] font-semibold text-stone-800">{s.title}</h2>
              <ul className="mt-3 space-y-2">
                {s.body.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] leading-6 text-stone-500">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-300" />
                    {b}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-stone-400">
          © 2026 OpenCanvas · <Link href="/privacy" className="hover:text-stone-600">隐私政策</Link>
        </p>
      </main>
    </div>
  );
}
