import { cookies } from "next/headers";
import { dict, type Dict, type Locale } from "./dicts";

/** 服务端 locale：cookie `oc_lang`（客户端切换器写入），默认中文。 */
export async function getLocale(): Promise<Locale> {
  try {
    const c = (await cookies()).get("oc_lang")?.value;
    return c === "en" ? "en" : "zh";
  } catch {
    return "zh";
  }
}

export async function getDict(): Promise<Dict> {
  return dict[await getLocale()];
}
