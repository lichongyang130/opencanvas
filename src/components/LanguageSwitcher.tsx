"use client";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** 语言切换器：中文 / English 两个按钮（紧凑型） */
export default function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-slate-200 bg-white/70 p-0.5 text-xs dark:border-slate-700 dark:bg-slate-800/60",
        className
      )}
      role="group"
      aria-label={t("lang.switchTo")}
    >
      {(["zh", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          className={cn(
            "rounded-md px-2 py-1 font-medium transition-colors",
            locale === l
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          )}
        >
          {l === "zh" ? "中" : "EN"}
        </button>
      ))}
    </div>
  );
}
