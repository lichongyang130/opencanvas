"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dict, type Dict, type Locale } from "./dicts";
import { uiEn } from "./ui-en";

/**
 * 轻量 i18n（中/英）：客户端 Provider + hooks。
 * 持久化：cookie `oc_lang`（SSR 首屏与 <html lang> 用）+ localStorage（客户端缓存）。
 * 未显式选择时默认中文。
 */

export const LOCALE_COOKIE = "oc_lang";

export function readLocale(): Locale {
  if (typeof document !== "undefined") {
    const m = document.cookie.match(/(?:^|;\s*)oc_lang=([^;]+)/);
    if (m && (m[1] === "zh" || m[1] === "en")) return m[1];
    try {
      const v = localStorage.getItem("oc_lang");
      if (v === "zh" || v === "en") return v;
    } catch {
      /* ignore */
    }
  }
  return "zh";
}

export function writeLocale(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  try {
    localStorage.setItem("oc_lang", locale);
  } catch {
    /* ignore */
  }
}

type TFunc = (key: string, params?: Record<string, string | number>) => string;

function lookup(d: Dict, key: string): string | undefined {
  return key.split(".").reduce<unknown>((acc, k) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[k];
    return undefined;
  }, d) as string | undefined;
}

/** 全文案翻译：对「中文原文」直接按当前语言返回（zh 原文 / en 查 uiEn），支持 {name} 占位符 */
type TtFunc = (text: string, params?: Record<string, string | number>) => string;

interface I18nValue {
  locale: Locale;
  t: TFunc;
  /** 全文案翻译：对「中文原文」直接按当前语言返回（zh 原文 / en 查 uiEn），支持 {name} 占位符 */
  tt: TtFunc;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nValue>({
  locale: "zh",
  t: (k) => k,
  tt: (text) => text,
  setLocale: () => {},
});

export function LocaleProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? "zh");

  useEffect(() => {
    const l = readLocale();
    // SSR 已从 cookie 拿到 initialLocale；这里仅覆盖客户端 localStorage 与 SSR 不一致的情况
    if (l !== locale) setLocaleState(l);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback((l: Locale) => {
    writeLocale(l);
    setLocaleState(l);
    document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
  }, []);

  const value = useMemo<I18nValue>(() => {
    const d = dict[locale];
    const t: TFunc = (key, params) => {
      let s = lookup(d, key);
      if (s === undefined) s = lookup(dict.zh, key) ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          s = s.replaceAll(`{${k}}`, String(v));
        }
      }
      return s;
    };
    const tt: TtFunc = (text, params) => {
      let s = locale === "en" ? uiEn[text] ?? text : text;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          s = s.replaceAll(`{${k}}`, String(v));
        }
      }
      return s;
    };
    return { locale, t, tt, setLocale };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}
