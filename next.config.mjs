/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 服务端运行时加载的外部包（避免打包 native/可选依赖；Next 16 顶层稳定选项）
  serverExternalPackages: ["bullmq", "@aws-sdk/client-s3", "@valkey/valkey-glide"],
  // 允许 Arena 预览代理域（e2b.app）访问开发服务器资源，避免跨域警告
  allowedDevOrigins: ["*.e2b.app", "localhost:3000", "127.0.0.1:3000", "[::1]:3000"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "openai.com" },
      { protocol: "https", hostname: "www.openai.com" },
      { protocol: "https", hostname: "anthropic.com" },
      { protocol: "https", hostname: "www.anthropic.com" },
      { protocol: "https", hostname: "deepseek.com" },
      { protocol: "https", hostname: "www.deepseek.com" },
      { protocol: "https", hostname: "dashscope.aliyun.com" },
      { protocol: "https", hostname: "tongyi.com" },
      { protocol: "https", hostname: "www.tongyi.com" },
    ],
  },
};

export default nextConfig;
