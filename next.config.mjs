/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 允许 Arena 预览代理域（e2b.app）访问开发服务器资源，避免跨域警告
  allowedDevOrigins: ["*.e2b.app", "localhost:3000", "127.0.0.1:3000", "[::1]:3000"],
};

export default nextConfig;
