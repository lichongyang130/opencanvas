import { cookies } from "next/headers";
import { dict, type Dict, type Locale } from "./dicts";

/** 服务端 locale：cookie `oc_lang`（客户端切换器写入），默认中文。 */
export function getLocale(): Locale {
  try {
    const c = cookies().get("oc_lang")?.value;
    return c === "en" ? "en" : "zh";
  } catch {
    return "zh";
  }
}

export function getDict(): Dict {
  return dict[getLocale()];
}
