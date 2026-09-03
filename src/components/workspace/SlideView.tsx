"use client";

import { THEMES } from "@/lib/slides/themes";
import type { Slide } from "@/lib/slides/types";
import { useChatStore } from "@/lib/store/chat";
import { cn } from "@/lib/utils";

interface Props {
  slide: Slide;
  themeId: keyof typeof THEMES;
  index: number;
  editable?: boolean;
  onPatch?: (patch: Partial<Slide>) => void;
}

/** 可编辑文本：浏览态为普通文本，编辑态为无边框输入框 */
function EditText({
  value,
  onPatch,
  field,
  editable,
  className,
  multiline,
  placeholder,
}: {
  value?: string;
  field: keyof Slide;
  onPatch?: (p: Partial<Slide>) => void;
  editable?: boolean;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  const emit = (v: string) => onPatch?.({ [field]: v } as Partial<Slide>);
  if (!editable) {
    return <div className={className}>{value ?? placeholder}</div>;
  }
  return multiline ? (
    <textarea
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => emit(e.target.value)}
      className={cn(className, "w-full resize-none bg-transparent outline-none")}
      rows={2}
    />
  ) : (
    <input
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => emit(e.target.value)}
      className={cn(className, "w-full bg-transparent outline-none")}
    />
  );
}

/**
 * 单张幻灯片。16:9 比例，容器宽度决定字号（cqw），
 * 侧栏缩略图与主预览复用同一组件自动缩放。
 */
export function SlideView({ slide, themeId, index, editable, onPatch }: Props) {
  const t = THEMES[themeId] ?? THEMES.violet;
  const dark = slide.layout === "cover" || slide.layout === "end";

  return (
    <div
      className="relative aspect-[16/9] w-full overflow-hidden rounded-lg"
      style={{
        containerType: "inline-size",
        background: dark ? t.primary : t.surface,
        color: dark ? t.onPrimary : t.text,
      }}
    >
      {/* 封面 / 结束页 */}
      {dark && (
        <>
          <div
            className="absolute -right-[12cqw] -top-[18cqw] h-[45cqw] w-[45cqw] rounded-full"
            style={{ background: t.accent, opacity: 0.35 }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-[8cqw] text-center">
            <EditText
              value={slide.title}
              field="title"
              editable={editable}
              onPatch={onPatch}
              placeholder="标题"
              className="text-[5.2cqw] font-bold leading-tight"
            />
            {slide.subtitle !== undefined || editable ? (
              <EditText
                value={slide.subtitle}
                field="subtitle"
                editable={editable}
                onPatch={onPatch}
                placeholder="副标题"
                className="mt-[2cqw] text-[2.4cqw]"
              />
            ) : null}
          </div>
        </>
      )}

      {/* 浅底页通用标题 */}
      {!dark && (
        <div className="flex items-center gap-[1.2cqw] px-[5cqw] pt-[4cqw]">
          <div
            className="h-[3.2cqw] w-[0.6cqw] shrink-0 rounded-full"
            style={{ background: t.accent }}
          />
          <EditText
            value={slide.title}
            field="title"
            editable={editable}
            onPatch={onPatch}
            placeholder="页标题"
            className="text-[3cqw] font-bold"
          />
        </div>
      )}

      {/* 目录 */}
      {slide.layout === "toc" && (
        <div className="space-y-[1.6cqw] px-[9cqw] pt-[3.5cqw]">
          {(slide.bullets ?? []).map((b, i) => (
            <div
              key={i}
              className="flex items-center gap-[2.5cqw] rounded-[1cqw] bg-white px-[3cqw] py-[1.8cqw] shadow-sm"
            >
              <span className="text-[2.6cqw] font-bold" style={{ color: t.accent }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {editable ? (
                <input
                  value={b}
                  onChange={(e) => {
                    const next = [...(slide.bullets ?? [])];
                    next[i] = e.target.value;
                    onPatch?.({ bullets: next });
                  }}
                  className="w-full bg-transparent text-[2.4cqw] outline-none"
                />
              ) : (
                <span className="text-[2.4cqw]">{b}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 内容页 */}
      {slide.layout === "content" && (
        <div className="flex gap-[4cqw] px-[7cqw] pt-[3cqw]">
          <div className={slide.imagePrompt ? "flex-[1.6]" : "flex-1"}>
            <ul className="space-y-[1.8cqw]">
              {(slide.bullets ?? []).map((b, i) => (
                <li key={i} className="flex items-start gap-[1.5cqw] text-[2.3cqw] leading-relaxed">
                  <span
                    className="mt-[0.9cqw] h-[0.9cqw] w-[0.9cqw] shrink-0 rounded-full"
                    style={{ background: t.accent }}
                  />
                  {editable ? (
                    <input
                      value={b}
                      onChange={(e) => {
                        const next = [...(slide.bullets ?? [])];
                        next[i] = e.target.value;
                        onPatch?.({ bullets: next });
                      }}
                      className="w-full bg-transparent outline-none"
                    />
                  ) : (
                    <span>{b}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          {slide.imagePrompt && (
            slide.imageUrl ? (
               
              <img
                src={slide.imageUrl}
                alt={slide.imagePrompt}
                className="flex-1 rounded-[1.2cqw] object-cover shadow-sm"
                style={{ background: t.surface }}
              />
            ) : (
              <div
                className="flex flex-1 flex-col items-center justify-center gap-[1cqw] rounded-[1.2cqw] border-2 border-dashed text-center text-[1.6cqw]"
                style={{ borderColor: t.accent, color: t.muted, background: "rgba(255,255,255,0.5)" }}
              >
                <span>配图位（待生成）</span>
                {editable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void useChatStore.getState().generateSlideImages(index);
                    }}
                    className="rounded-full px-[2cqw] py-[0.8cqw] text-[1.5cqw] font-medium text-white transition hover:opacity-90"
                    style={{ background: t.accent }}
                  >
                    ✨ 生成配图
                  </button>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* 双栏 */}
      {slide.layout === "twoCol" && (
        <div className="grid grid-cols-2 gap-[3cqw] px-[6cqw] pt-[3cqw]">
          {[
            { heading: "核心要点", items: slide.bullets ?? [], field: "bullets" as const },
            { heading: slide.twoColTitle ?? "补充", items: slide.bulletsRight ?? [], field: "bulletsRight" as const },
          ].map((col, ci) => (
            <div key={ci} className="rounded-[1.2cqw] bg-white p-[3cqw] shadow-sm">
              <div className="mb-[1.5cqw] text-[2.3cqw] font-bold" style={{ color: t.accent }}>
                {ci === 1 && editable ? (
                  <input
                    value={slide.twoColTitle ?? ""}
                    placeholder="右栏标题"
                    onChange={(e) => onPatch?.({ twoColTitle: e.target.value })}
                    className="w-full bg-transparent outline-none"
                  />
                ) : (
                  col.heading
                )}
              </div>
              <ul className="space-y-[1.3cqw]">
                {col.items.map((b, i) => (
                  <li key={i} className="flex items-start gap-[1.2cqw] text-[2cqw] leading-snug">
                    <span
                      className="mt-[0.7cqw] h-[0.8cqw] w-[0.8cqw] shrink-0 rounded-full"
                      style={{ background: t.accent }}
                    />
                    {editable ? (
                      <input
                        value={b}
                        onChange={(e) => {
                          const next = [...col.items];
                          next[i] = e.target.value;
                          onPatch?.({ [col.field]: next });
                        }}
                        className="w-full bg-transparent outline-none"
                      />
                    ) : (
                      <span>{b}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* 数字卡片 */}
      {slide.layout === "stats" && (
        <div className="flex items-center justify-center gap-[3cqw] px-[6cqw] pt-[2cqw]">
          {(slide.stats ?? []).map((st, i) => (
            <div
              key={i}
              className="flex flex-1 flex-col items-center rounded-[1.5cqw] bg-white py-[4cqw] shadow-sm"
              style={{ border: `0.3cqw solid ${t.accent}55` }}
            >
              {editable ? (
                <input
                  value={st.value}
                  onChange={(e) => {
                    const next = [...(slide.stats ?? [])];
                    next[i] = { ...next[i], value: e.target.value };
                    onPatch?.({ stats: next });
                  }}
                  className="w-full bg-transparent text-center text-[4.5cqw] font-bold outline-none"
                  style={{ color: t.accent }}
                />
              ) : (
                <div className="text-[4.5cqw] font-bold" style={{ color: t.accent }}>
                  {st.value}
                </div>
              )}
              {editable ? (
                <input
                  value={st.label}
                  onChange={(e) => {
                    const next = [...(slide.stats ?? [])];
                    next[i] = { ...next[i], label: e.target.value };
                    onPatch?.({ stats: next });
                  }}
                  className="mt-[0.8cqw] w-full bg-transparent text-center text-[1.8cqw] outline-none"
                  style={{ color: t.muted }}
                />
              ) : (
                <div className="mt-[0.8cqw] text-[1.8cqw]" style={{ color: t.muted }}>
                  {st.label}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 时间轴 */}
      {slide.layout === "timeline" && (
        <div className="px-[7cqw] pt-[2.5cqw]">
          <div className="relative border-l-[0.4cqw] pl-[3.5cqw]" style={{ borderColor: t.accent }}>
            {(slide.timeline ?? []).map((tl, i) => (
              <div key={i} className="relative mb-[2.2cqw] last:mb-0">
                <span
                  className="absolute -left-[4.35cqw] top-[0.3cqw] h-[1.6cqw] w-[1.6cqw] rounded-full border-[0.35cqw] border-white"
                  style={{ background: t.accent, boxShadow: `0 0 0 0.2cqw ${t.accent}44` }}
                />
                {editable ? (
                  <div className="flex gap-[1.5cqw]">
                    <input
                      value={tl.time}
                      onChange={(e) => {
                        const next = [...(slide.timeline ?? [])];
                        next[i] = { ...next[i], time: e.target.value };
                        onPatch?.({ timeline: next });
                      }}
                      className="w-[16cqw] shrink-0 bg-transparent text-[2.2cqw] font-bold outline-none"
                      style={{ color: t.accent }}
                    />
                    <input
                      value={tl.label}
                      onChange={(e) => {
                        const next = [...(slide.timeline ?? [])];
                        next[i] = { ...next[i], label: e.target.value };
                        onPatch?.({ timeline: next });
                      }}
                      className="w-full bg-transparent text-[2.1cqw] outline-none"
                      style={{ color: t.text }}
                    />
                  </div>
                ) : (
                  <div className="flex gap-[1.5cqw]">
                    <span className="w-[16cqw] shrink-0 text-[2.2cqw] font-bold" style={{ color: t.accent }}>{tl.time}</span>
                    <span className="text-[2.1cqw]" style={{ color: t.text }}>{tl.label}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 对比 */}
      {slide.layout === "compare" && (
        <div className="px-[6cqw] pt-[2.5cqw]">
          <div className="grid grid-cols-[1fr_1fr] gap-[2.5cqw]">
            {[0, 1].map((col) => (
              <div key={col} className="rounded-[1.5cqw] bg-white p-[2.5cqw] shadow-sm" style={{ border: `0.3cqw solid ${col === 0 ? t.accent : "#e2e8f0"}` }}>
                <p className="mb-[1.5cqw] text-center text-[2.3cqw] font-bold" style={{ color: t.accent }}>
                  {col === 0 ? (slide.twoColTitle ?? slide.bullets?.[0] ?? "方案 A") : (slide.bulletsRight?.[0] ?? "方案 B")}
                </p>
                <ul className="space-y-[1.2cqw]">
                  {(col === 0 ? (slide.bullets ?? []) : (slide.bulletsRight ?? [])).slice(1).map((b, i) => (
                    <li key={i} className="flex items-start gap-[1.2cqw] text-[1.9cqw] leading-snug" style={{ color: t.text }}>
                      <span className="mt-[0.6cqw] h-[0.7cqw] w-[0.7cqw] shrink-0 rounded-full" style={{ background: t.accent }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {slide.compareRows && slide.compareRows.length > 0 && (
            <div className="mt-[2cqw] overflow-hidden rounded-[1.2cqw] border border-stone-200">
              {slide.compareRows.map((r, i) => (
                <div key={i} className="grid grid-cols-2 border-b border-stone-100 last:border-0">
                  <div className="border-r border-stone-100 px-[2cqw] py-[1cqw] text-[1.8cqw]" style={{ color: t.text }}>
                    <span className="font-medium" style={{ color: t.accent }}>{r.left}</span>
                  </div>
                  <div className="px-[2cqw] py-[1cqw] text-[1.8cqw]" style={{ color: t.text }}>{r.right}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 流程 */}
      {slide.layout === "process" && (
        <div className="flex items-center justify-center gap-[2cqw] px-[5cqw] pt-[2cqw]">
          {(slide.process ?? []).map((p, i) => (
            <div key={i} className="flex flex-1 flex-col items-center text-center">
              <div className="flex h-[6cqw] w-[6cqw] items-center justify-center rounded-full text-[2.4cqw] font-bold text-white" style={{ background: t.accent }}>
                {i + 1}
              </div>
              <div className="mt-[1.5cqw] text-[1.9cqw] leading-snug" style={{ color: t.text }}>{p}</div>
              {i < (slide.process?.length ?? 0) - 1 && (
                <span className="absolute -right-[1.2cqw] top-[2cqw] text-[2cqw]" style={{ color: t.muted }}>→</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 引言 */}
      {slide.layout === "quote" && (
        <div className="flex flex-col items-center justify-center px-[8cqw] pt-[1cqw] text-center">
          <span className="text-[7cqw] leading-none" style={{ color: t.accent }}>“</span>
          <p className="text-[3.2cqw] font-medium leading-[1.6]" style={{ color: t.text }}>{slide.quote}</p>
          {slide.quoteBy && (
            <p className="mt-[2.5cqw] text-[1.8cqw]" style={{ color: t.muted }}>—— {slide.quoteBy}</p>
          )}
        </div>
      )}

      {/* 团队 */}
      {slide.layout === "team" && (
        <div className="grid grid-cols-3 gap-[2.5cqw] px-[6cqw] pt-[2.5cqw]">
          {(slide.team ?? []).map((m, i) => (
            <div key={i} className="flex flex-col items-center rounded-[1.5cqw] bg-white py-[3cqw] shadow-sm" style={{ border: `0.3cqw solid ${t.accent}44` }}>
              <span className="text-[4cqw]">{m.emoji ?? ["🦊", "🐼", "🦉", "🐯", "🐰", "🦄"][i % 6]}</span>
              <span className="mt-[1cqw] text-[2.2cqw] font-semibold" style={{ color: t.text }}>{m.name}</span>
              <span className="mt-[0.5cqw] text-[1.6cqw]" style={{ color: t.muted }}>{m.role}</span>
            </div>
          ))}
        </div>
      )}

      {/* 页码 */}
      {!dark && (
        <div
          className="absolute bottom-[2.5cqw] right-[4cqw] text-[1.4cqw]"
          style={{ color: t.muted }}
        >
          {index + 1}
        </div>
      )}
    </div>
  );
}
