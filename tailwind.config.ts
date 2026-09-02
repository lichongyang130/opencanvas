import type { Config } from "tailwindcss";

/**
 * 全局主题（浅色/深色）：
 * stone 与 brand 色板均为 CSS 变量（rgb 三元组），
 * .dark 下由 globals.css 重定义，实现全站自动换肤。
 */
const stoneVars = (name: string) =>
  Object.fromEntries(
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => [
      n,
      `rgb(var(--stone-${n}) / <alpha-value>)`,
    ])
  );
const brandVars = () =>
  Object.fromEntries(
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((n) => [
      n,
      `rgb(var(--brand-${n}) / <alpha-value>)`,
    ])
  );

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: brandVars(),
        stone: stoneVars("stone"),
      },
    },
  },
  plugins: [],
} satisfies Config;
