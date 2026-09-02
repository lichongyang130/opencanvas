import type { Slide, SlideDeck } from "./types";
import { themeOrDefault } from "./prompt";

const VALID_LAYOUTS = new Set(["cover", "toc", "content", "twoCol", "stats", "timeline", "compare", "process", "quote", "team", "end"]);

/**
 * 从 LLM 输出中提取并校验幻灯片 JSON。
 * 容错处理：剥离 markdown 代码围栏、截取第一个 { 到最后一个 }、字段兜底。
 */
export function parseSlideDeck(raw: string, fallbackTitle = "未命名演示"): SlideDeck {
  let text = raw.trim();

  // 去掉 ```json ... ``` 围栏
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  // 截取最外层花括号
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) text = text.slice(start, end + 1);

  const obj = JSON.parse(text) as Record<string, unknown>;

  const rawSlides = Array.isArray(obj.slides) ? obj.slides : [];
  const slides: Slide[] = rawSlides
    .map((s) => s as Record<string, unknown>)
    .filter((s) => s && VALID_LAYOUTS.has(String(s.layout)))
    .map((s) => ({
      layout: s.layout as Slide["layout"],
      title: typeof s.title === "string" ? s.title : undefined,
      subtitle: typeof s.subtitle === "string" ? s.subtitle : undefined,
      bullets: Array.isArray(s.bullets) ? s.bullets.map(String) : undefined,
      bulletsRight: Array.isArray(s.bulletsRight) ? s.bulletsRight.map(String) : undefined,
      twoColTitle: typeof s.twoColTitle === "string" ? s.twoColTitle : undefined,
      stats: Array.isArray(s.stats)
        ? s.stats
            .map((x) => x as Record<string, unknown>)
            .filter((x) => x && typeof x.value !== "undefined")
            .map((x) => ({ value: String(x.value), label: String(x.label ?? "") }))
        : undefined,
      imagePrompt: typeof s.imagePrompt === "string" ? s.imagePrompt : undefined,
      note: typeof s.note === "string" ? s.note : undefined,
      timeline: Array.isArray(s.timeline)
        ? s.timeline
            .map((x) => x as Record<string, unknown>)
            .filter((x) => x && typeof x.time !== "undefined")
            .map((x) => ({ time: String(x.time), label: String(x.label ?? "") }))
        : undefined,
      compareTitle: typeof s.compareTitle === "string" ? s.compareTitle : undefined,
      compareRows: Array.isArray(s.compareRows)
        ? s.compareRows
            .map((x) => x as Record<string, unknown>)
            .filter((x) => x)
            .map((x) => ({ left: String(x.left ?? ""), right: String(x.right ?? "") }))
        : undefined,
      process: Array.isArray(s.process) ? s.process.map(String) : undefined,
      quote: typeof s.quote === "string" ? s.quote : undefined,
      quoteBy: typeof s.quoteBy === "string" ? s.quoteBy : undefined,
      team: Array.isArray(s.team)
        ? s.team
            .map((x) => x as Record<string, unknown>)
            .filter((x) => x && typeof x.name !== "undefined")
            .map((x) => ({ name: String(x.name), role: String(x.role ?? ""), emoji: typeof x.emoji === "string" ? x.emoji : undefined }))
        : undefined,
    }));

  if (slides.length === 0) throw new Error("未能从模型输出中解析出有效幻灯片");

  // 保证首尾页
  if (slides[0].layout !== "cover") {
    slides.unshift({ layout: "cover", title: String(obj.title ?? fallbackTitle) });
  }
  if (slides[slides.length - 1].layout !== "end") {
    slides.push({ layout: "end", title: "谢谢观看" });
  }

  return {
    title: typeof obj.title === "string" && obj.title ? obj.title : fallbackTitle,
    subtitle: typeof obj.subtitle === "string" ? obj.subtitle : undefined,
    theme: themeOrDefault(typeof obj.theme === "string" ? obj.theme : undefined),
    slides,
  };
}
