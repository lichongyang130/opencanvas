"use client";

import { useEffect } from "react";
import { useChatStore } from "@/lib/store/chat";

/** 全局主题同步：监听偏好（system/light/dark），切换 <html> 的 .dark 类 */
export default function ThemeSync() {
  const theme = useChatStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    const apply = (dark: boolean) => {
      root.classList.toggle("dark", dark);
      root.style.colorScheme = dark ? "dark" : "light";
    };
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      if (theme === "system") apply(media.matches);
      else apply(theme === "dark");
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [theme]);

  return null;
}
