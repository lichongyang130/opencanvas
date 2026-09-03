import PptxGenJS from "pptxgenjs";
import { THEMES } from "@/lib/slides/themes";
import type { SlideDeck } from "@/lib/slides/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hex = (c: string) => c.replace("#", "");
const FONT = "Microsoft YaHei";

/**
 * 导出 PPTX：把前端渲染同款的 SlideDeck 用 pptxgenjs 生成 .pptx 文件。
 * POST { deck: SlideDeck } -> application/vnd.openxmlformats... (pptx)
 */
export async function POST(req: Request) {
  const { deck } = (await req.json()) as { deck: SlideDeck };
  if (!deck?.slides?.length) {
    return new Response(JSON.stringify({ error: "deck 无效" }), { status: 400 });
  }

  const theme = THEMES[deck.theme] ?? THEMES.violet;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE", width: 13.33, height: 7.5 });
  pptx.layout = "WIDE";

  const W = 13.33;

  let pageNo = 0;
  for (const s of deck.slides) {
    pageNo += 1;
    const slide = pptx.addSlide();
    const addNotes = () => {
      if (s.note?.trim()) slide.addNotes(s.note.trim());
    };

    if (s.layout === "cover" || s.layout === "end") {
      slide.background = { color: hex(theme.primary) };
      // 装饰圆
      slide.addShape("ellipse", {
        x: 9.2, y: -1.6, w: 5.5, h: 5.5,
        fill: { color: hex(theme.accent), transparency: 70 },
        line: { color: hex(theme.accent), transparency: 100 },
      });
      slide.addText(s.title ?? "", {
        x: 0.9, y: 2.7, w: 11.5, h: 1.6,
        fontFace: FONT, fontSize: 40, bold: true,
        color: hex(theme.onPrimary), align: "center", valign: "middle",
      });
      if (s.subtitle) {
        slide.addText(s.subtitle, {
          x: 1.5, y: 4.4, w: 10.3, h: 0.8,
          fontFace: FONT, fontSize: 18,
          color: hex(theme.onPrimary), transparency: 25, align: "center",
        });
      }
      addNotes();
      continue;
    }

    // 浅色背景页
    slide.background = { color: hex(theme.surface) };
    // 标题 + 强调条
    slide.addShape("rect", {
      x: 0.7, y: 0.55, w: 0.12, h: 0.55,
      fill: { color: hex(theme.accent) }, line: { color: hex(theme.accent) },
    });
    slide.addText(s.title ?? "", {
      x: 0.95, y: 0.5, w: 11.6, h: 0.7,
      fontFace: FONT, fontSize: 26, bold: true, color: hex(theme.text),
    });

    if (s.layout === "toc") {
      const items = s.bullets ?? [];
      items.forEach((b, i) => {
        const y = 1.7 + i * 1.05;
        slide.addShape("roundRect", {
          x: 1.2, y, w: 10.9, h: 0.85, rectRadius: 0.08,
          fill: { color: "FFFFFF" }, line: { color: hex(theme.accent), transparency: 60, width: 1 },
        });
        slide.addText(String(i + 1).padStart(2, "0"), {
          x: 1.5, y, w: 1.0, h: 0.85,
          fontFace: FONT, fontSize: 20, bold: true, color: hex(theme.accent), valign: "middle",
        });
        slide.addText(b, {
          x: 2.6, y, w: 9.2, h: 0.85,
          fontFace: FONT, fontSize: 17, color: hex(theme.text), valign: "middle",
        });
      });
    } else if (s.layout === "content") {
      const items = s.bullets ?? [];
      slide.addText(
        items.map((b) => ({ text: b, options: { bullet: { code: "2022" }, breakLine: true } })),
        {
          x: 1.0, y: 1.7, w: s.imagePrompt ? 7.0 : 11.3, h: 5.0,
          fontFace: FONT, fontSize: 17, color: hex(theme.text),
          lineSpacingMultiple: 1.5, valign: "top",
          paraSpaceAfter: 10,
        }
      );
      if (s.imagePrompt) {
        slide.addShape("roundRect", {
          x: 8.4, y: 1.8, w: 3.9, h: 4.6, rectRadius: 0.12,
          fill: { color: hex(theme.primary), transparency: 88 },
          line: { color: hex(theme.accent), width: 1.5, dashType: "dash" },
        });
        slide.addText("配图位\n（第 2 阶段 AI 自动生成）", {
          x: 8.4, y: 1.8, w: 3.9, h: 4.6,
          fontFace: FONT, fontSize: 13, color: hex(theme.muted),
          align: "center", valign: "middle",
        });
      }
    } else if (s.layout === "twoCol") {
      const colW = 5.35;
      const drawCol = (x: number, heading: string | undefined, items: string[]) => {
        slide.addShape("roundRect", {
          x, y: 1.7, w: colW, h: 5.0, rectRadius: 0.1,
          fill: { color: "FFFFFF" }, line: { color: "E7E5E4", width: 1 },
        });
        if (heading) {
          slide.addText(heading, {
            x: x + 0.35, y: 1.95, w: colW - 0.7, h: 0.6,
            fontFace: FONT, fontSize: 17, bold: true, color: hex(theme.accent),
          });
        }
        slide.addText(
          items.map((b) => ({ text: b, options: { bullet: { code: "2022" }, breakLine: true } })),
          {
            x: x + 0.35, y: 2.7, w: colW - 0.7, h: 3.8,
            fontFace: FONT, fontSize: 15, color: hex(theme.text),
            lineSpacingMultiple: 1.4, paraSpaceAfter: 8,
          }
        );
      };
      drawCol(0.85, "核心要点", s.bullets ?? []);
      drawCol(7.1, s.twoColTitle ?? "补充说明", s.bulletsRight ?? []);
    } else if (s.layout === "stats") {
      const stats = s.stats ?? [];
      const cardW = 3.5;
      const gap = 0.55;
      const totalW = stats.length * cardW + (stats.length - 1) * gap;
      const startX = (W - totalW) / 2;
      stats.forEach((st, i) => {
        const x = startX + i * (cardW + gap);
        slide.addShape("roundRect", {
          x, y: 2.5, w: cardW, h: 2.7, rectRadius: 0.15,
          fill: { color: "FFFFFF" }, line: { color: hex(theme.accent), transparency: 55, width: 1.5 },
        });
        slide.addText(st.value, {
          x, y: 2.9, w: cardW, h: 1.2,
          fontFace: FONT, fontSize: 40, bold: true, color: hex(theme.accent), align: "center",
        });
        slide.addText(st.label, {
          x, y: 4.2, w: cardW, h: 0.7,
          fontFace: FONT, fontSize: 14, color: hex(theme.muted), align: "center",
        });
      });
    }

    // 页脚页码
    slide.addText(String(pageNo), {
      x: 12.4, y: 7.0, w: 0.7, h: 0.4,
      fontFace: FONT, fontSize: 10, color: hex(theme.muted), align: "right",
    });
    addNotes();
  }

  const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  const filename = encodeURIComponent(`${deck.title || "slides"}.pptx`);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
    },
  });
}
