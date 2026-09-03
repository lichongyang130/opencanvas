import { type Locale } from "./dicts";

/** 法务页面结构化内容（隐私政策 / 用户协议），中英完整对应。 */
export interface LegalDoc {
  title: string;
  updated: string;
  sub: string;
  back: string;
  sections: { title: string; body: string[] }[];
}

export const LEGAL: Record<Locale, { privacy: LegalDoc; terms: LegalDoc }> = {
  zh: {
    privacy: {
      title: "隐私政策",
      updated: "最近更新：2026-09-03",
      sub: "OpenCanvas 隐私政策与数据处理说明",
      back: "返回首页",
      sections: [
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
      ],
    },
    terms: {
      title: "用户协议",
      updated: "最近更新：2026-09-03",
      sub: "使用 OpenCanvas 即表示同意以下条款",
      back: "返回首页",
      sections: [
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
      ],
    },
  },
  en: {
    privacy: {
      title: "Privacy Policy",
      updated: "Last updated: 2026-09-03",
      sub: "How OpenCanvas handles your data",
      back: "Back to home",
      sections: [
        {
          title: "1. What we collect",
          body: [
            "Account details: email and name on sign-up (from Google / GitHub public profile for OAuth). Passwords are stored as salted hashes; we cannot see your plaintext password.",
            "Content data: conversations, documents, slides, images and research you create in the workspace, used to provide features and saved with your sessions.",
            "Usage data: the gateway records model, provider, token usage and cost per call for billing, rate-limiting and troubleshooting.",
            "Local data: API keys and preferences you enter are kept in browser localStorage and are never written to our database (they are only forwarded to our backend to call models).",
          ],
        },
        {
          title: "2. How we use it",
          body: [
            "Only to provide and improve core features of OpenCanvas (chat, generation, export, sharing).",
            "Sharing: content you explicitly share is stored as a public read-only page viewable by anyone with the link; unsharing does not automatically delete generated links.",
            "We never sell your data and never use it for ad targeting.",
          ],
        },
        {
          title: "3. Storage & security",
          body: [
            "Development/local builds use SQLite; production can migrate to PostgreSQL. API keys are never stored server-side (they live in the browser).",
            "Sensitive operations (sessions) use HttpOnly cookies backed by a server session table with expiry.",
            "We apply reasonable technical measures against unauthorized access, but no internet transmission or storage can be guaranteed 100% secure.",
          ],
        },
        {
          title: "4. Third-party services",
          body: [
            "Chat/generated content is sent to the model providers you choose (OpenAI, Anthropic, DeepSeek, Alibaba Bailian, fal.ai, etc.); please review their data policies before use.",
            "Web search (Tavily) and image processing (remove.bg etc.) forward requests as needed by features.",
          ],
        },
        {
          title: "5. Your rights",
          body: [
            "Export: one-click export of your account data (JSON) in Settings → Data Management.",
            "Delete: delete your account and all associated data in Settings → Data Management (irreversible).",
            "Log out at any time; local data remains on your device.",
          ],
        },
        {
          title: "6. Policy updates & contact",
          body: [
            "This policy may change as the product evolves; major changes will be announced on the page.",
            "For questions or to exercise your rights, open an Issue in the project repository.",
          ],
        },
      ],
    },
    terms: {
      title: "Terms of Service",
      updated: "Last updated: 2026-09-03",
      sub: "By using OpenCanvas you agree to the following terms",
      back: "Back to home",
      sections: [
        {
          title: "1. Service",
          body: [
            "OpenCanvas provides AI chat, slide generation, document writing, AI images and deep research tools (the \"Service\").",
            "The Service depends on third-party model vendors; availability, speed and output quality are affected by them. We do not guarantee continuous availability or fully accurate output.",
          ],
        },
        {
          title: "2. Accounts & security",
          body: [
            "You are responsible for activity under your account and for keeping credentials safe; log out immediately and contact us if you suspect misuse.",
            "Bot accounts, bulk abuse, attacking the service or interfering with other users are prohibited.",
          ],
        },
        {
          title: "3. Credits & fees",
          body: [
            "Credits offset model call costs and can be earned via check-ins, uploads and sharing per the rules shown on pages.",
            "Credits have no cash value, cannot be transferred or withdrawn, and are void after account deletion.",
          ],
        },
        {
          title: "4. User content & responsibility",
          body: [
            "You are responsible for content you input, generate or share, including legality and intellectual property.",
            "Do not generate or distribute illegal, infringing or harmful content; violating content may be rejected or removed.",
            "Shared content is public read-only — do not share private or confidential information.",
          ],
        },
        {
          title: "5. Intellectual property",
          body: [
            "The interface, code and brand belong to the OpenCanvas project.",
            "Content you generate belongs to you; model vendors may use call data per their own policies.",
          ],
        },
        {
          title: "6. Disclaimer & termination",
          body: [
            "The Service is provided \"as is\" without guarantees of accuracy or fitness for a specific purpose; verify important content manually.",
            "We may suspend or terminate non-compliant accounts for security, compliance or policy reasons and reserve the right to pursue liability.",
            "Continued use after policy updates constitutes acceptance of the updated terms.",
          ],
        },
      ],
    },
  },
};
