import type { ChatCompletionParams, ProviderAdapter } from "../types";

/**
 * 内置免费演示模型：无需任何 API 密钥。
 * 逐块吐出一段模拟回复，让产品在零配置下也能完整体验流式交互。
 * 第 1 阶段接入真实模型后可保留为离线/降级方案。
 */
export const demoProvider: ProviderAdapter = {
  id: "demo",
  isConfigured() {
    return true;
  },
  async *streamChat({ messages }: ChatCompletionParams) {
    const last = [...messages].reverse().find((m) => m.role === "user");
    const question = last?.content ?? "";
    const reply = [
      `你好！我是内置演示模型 👋 你刚才说的是：「${question.slice(0, 80)}」`,
      "",
      "当前没有配置任何真实大模型密钥，所以我在本地模拟流式回复。",
      "要接入真实模型，请在项目根目录创建 .env.local（参考 .env.example），填入任意一个密钥：",
      "",
      "• 海外：OPENAI_API_KEY（GPT）或 ANTHROPIC_API_KEY（Claude）",
      "• 国内：DEEPSEEK_API_KEY（DeepSeek）或 DASHSCOPE_API_KEY（通义千问）",
      "",
      "配置后刷新页面，即可在右上角模型选择器切换。后续阶段我还会接入：",
      "PPT 生成、深度研究、AI 绘图、视频生成、品牌中心与积分订阅系统。",
    ].join("\n");

    const chunks = reply.match(/[\s\S]{1,24}/g) ?? [reply];
    for (const chunk of chunks) {
      yield chunk;
      await new Promise((r) => setTimeout(r, 28));
    }
  },
};
