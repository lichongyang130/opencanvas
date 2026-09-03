import type { Slide, SlideDeck, SlideOutline } from "./types";
import { themeOrDefault } from "./prompt";

const VALID_LAYOUTS = new Set(["cover", "toc", "content", "twoCol", "stats", "timeline", "compare", "process", "quote", "team", "end"]);

/** 单条 slide 记录 → Slide（字段兜底） */
export function mapSlideRecord(s: Record<string, unknown>): Slide | null {
  if (!s || !VALID_LAYOUTS.has(String(s.layout))) return null;
  return {
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
  };
}

/** 从 LLM 输出中提取单页 JSON（剥离围栏、截取最外层花括号） */
export function extractJsonObject(text: string): Record<string, unknown> {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t) as Record<string, unknown>;
}

/** 从 LLM 输出中解析单页（AI 单页重写用） */
export function parseSingleSlide(raw: string): Slide {
  const obj = extractJsonObject(raw);
  const slide = mapSlideRecord(obj);
  if (!slide) throw new Error("未能从模型输出中解析出有效页面");
  return slide;
}

/**
 * 从 LLM 输出中提取并校验幻灯片 JSON。
 * 容错处理：剥离 markdown 代码围栏、截取第一个 { 到最后一个 }、字段兜底。
 */
export function parseSlideDeck(raw: string, fallbackTitle = "未命名演示"): SlideDeck {
  const obj = extractJsonObject(raw);

  const rawSlides = Array.isArray(obj.slides) ? obj.slides : [];
  const slides: Slide[] = rawSlides
    .map((s) => mapSlideRecord(s as Record<string, unknown>))
    .filter((s): s is Slide => s !== null);

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

/** 从 LLM 输出中解析 PPT 大纲（JSON），字段兜底 */
export function parseSlideOutline(text: string, topic: string): SlideOutline {
  const obj = extractJsonObject(text);
  const sections = Array.isArray(obj.sections)
    ? obj.sections
        .map((s) => s as Record<string, unknown>)
        .filter((s) => s && typeof s.title === "string" && s.title.trim())
        .map((s) => ({
          title: String(s.title).trim(),
          bullets: Array.isArray(s.bullets) ? s.bullets.map((b) => String(b).trim()).filter(Boolean) : [],
        }))
        .filter((s) => s.bullets.length > 0)
    : [];
  if (sections.length === 0) throw new Error("未能解析出大纲，请重试");
  return {
    title: typeof obj.title === "string" && obj.title.trim() ? obj.title.trim() : topic,
    sections,
  };
}
