import type { ThemeId } from "./types";

export interface ThemeSpec {
  id: ThemeId;
  label: string;
  /** 主背景/深色块 */
  primary: string;
  /** 深色背景上的文字 */
  onPrimary: string;
  /** 浅底页背景 */
  surface: string;
  /** 浅底页正文 */
  text: string;
  /** 次级文字 */
  muted: string;
  /** 强调色（数字、图标、高亮条） */
  accent: string;
}

export const THEMES: Record<ThemeId, ThemeSpec> = {
  violet: {
    id: "violet",
    label: "紫罗兰",
    primary: "#4c1d95",
    onPrimary: "#ffffff",
    surface: "#faf9ff",
    text: "#2e2a35",
    muted: "#6b6680",
    accent: "#8b5cf6",
  },
  ocean: {
    id: "ocean",
    label: "海洋蓝",
    primary: "#0c4a6e",
    onPrimary: "#ffffff",
    surface: "#f5fafd",
    text: "#1f2d3a",
    muted: "#5b7186",
    accent: "#0ea5e9",
  },
  sunset: {
    id: "sunset",
    label: "落日橙",
    primary: "#7c2d12",
    onPrimary: "#ffffff",
    surface: "#fffaf5",
    text: "#3a2a22",
    muted: "#8a6d5c",
    accent: "#f97316",
  },
  forest: {
    id: "forest",
    label: "森林绿",
    primary: "#14532d",
    onPrimary: "#ffffff",
    surface: "#f6faf7",
    text: "#243328",
    muted: "#5f7767",
    accent: "#22c55e",
  },
  ink: {
    id: "ink",
    label: "极简墨",
    primary: "#18181b",
    onPrimary: "#fafafa",
    surface: "#ffffff",
    text: "#27272a",
    muted: "#71717a",
    accent: "#3b82f6",
  },
};

export const THEME_LIST = Object.values(THEMES);
