"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Template, TemplateCategory } from "./templates";
import type { WorkspaceMode } from "./store/chat";

export interface CustomPrompt extends Template {
  builtin?: boolean;
}

interface PromptState {
  /** 收藏的内置模板 id */
  favorites: string[];
  /** 用户自建提示词 */
  custom: CustomPrompt[];
  /** 最近使用的模板 id（最多 12 个） */
  recent: string[];
  toggleFavorite: (id: string) => void;
  addCustom: (p: Omit<CustomPrompt, "id" | "builtin">) => string;
  removeCustom: (id: string) => void;
  markUsed: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

let seq = 0;

export const usePromptStore = create<PromptState>()(
  persist(
    (set, get) => ({
      favorites: [],
      custom: [],
      recent: [],
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((x) => x !== id)
            : [...s.favorites, id],
        })),
      addCustom: (p) => {
        const id = `custom-${Date.now()}-${seq++}`;
        set((s) => ({ custom: [{ ...p, id, builtin: false }, ...s.custom] }));
        return id;
      },
      removeCustom: (id) => set((s) => ({ custom: s.custom.filter((x) => x.id !== id) })),
      markUsed: (id) =>
        set((s) => ({
          recent: [id, ...s.recent.filter((x) => x !== id)].slice(0, 12),
        })),
      isFavorite: (id) => get().favorites.includes(id),
    }),
    { name: "opencanvas.prompts.v1" }
  )
);

export const NEW_PROMPT_CATEGORY = "productivity" as TemplateCategory;
export type { WorkspaceMode };
