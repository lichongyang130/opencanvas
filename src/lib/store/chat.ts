"use client";

import { create } from "zustand";
import { MODELS, resolveModel } from "@/lib/gateway/models";
import { getOverrides, loadTavilyKey, serverProviderStatus } from "@/lib/settings";
import { toast } from "./toast";
import type { SlideDeck, ThemeId } from "@/lib/slides/types";
import type { ResearchReport } from "@/lib/research/types";
import { getPersona } from "@/lib/personas";

export type WorkspaceMode = "chat" | "research" | "slides" | "image" | "video" | "docs";

export interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  error?: boolean;
}

export interface UIImage {
  id: string;
  prompt: string;
  model: string;
  url: string;
  createdAt: number;
}

export interface UIDoc {
  title: string;
  content: string; // Markdown
  updatedAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  mode: WorkspaceMode;
  model: string;
  /** 动态模型对应的供应商（静态模型无需） */
  modelProvider?: string;
  messages: UIMessage[];
  /** 消息是否已从数据库加载 */
  loaded?: boolean;
  deck?: SlideDeck;
  deckStatus?: "idle" | "loading" | "done" | "error";
  deckMessage?: string;
  images?: UIImage[];
  report?: ResearchReport;
  doc?: UIDoc;
  researchStatus?: "idle" | "loading" | "done" | "error";
  researchMessage?: string;
  archived?: boolean;
  pinned?: boolean;
  /** 绑定的 AI 角色 id（personas.ts） */
  personaId?: string;
  createdAt: number;
}

const MODE_PROMPTS: Record<WorkspaceMode, string> = {
  chat: "你是一个全能 AI 助手，请用中文简洁专业地回答。",
  research:
    "你是深度研究助手。请对用户的主题进行结构化分析：背景、关键发现、数据支撑、引用来源建议、结论。后续版本将接入联网搜索。",
  slides:
    "你是 PPT 生成助手。请为用户的主题输出幻灯片大纲 JSON：{title, slides:[{title, bullets:[...], imagePrompt}]}，并附简短说明。",
  image: "你是 AI 绘图提示词助手。请根据用户描述输出优化后的英文绘图提示词（prompt），包含主体、风格、构图、光线。",
  video: "你是视频创作助手。请输出分镜脚本：场景、画面描述、旁白、时长建议。",
  docs: "你是专业写作助手。请根据用户需求输出一篇结构完整、可直接使用的中文文档，使用 Markdown：用 # 一级标题做文档标题，## 做小节，用列表罗列要点。只输出文档内容本身，不要输出解释或前言。",
};

export const MODE_LABELS: Record<WorkspaceMode, string> = {
  chat: "AI 对话",
  research: "深度研究",
  slides: "PPT 生成",
  image: "图片设计",
  video: "视频创作",
  docs: "文档写作",
};

let idSeq = 0;
const nextId = () => `${Date.now()}-${idSeq++}`;

/**
 * 窄屏（<768px）下产物画布只能以浮层覆盖对话区，
 * 因此默认收起，避免一进页面就把聊天区遮住；用户可从顶栏按钮手动打开。
 */
const isNarrowScreen = () =>
  typeof window !== "undefined" && window.innerWidth < 768;

/** 当前请求的中断控制器（停止生成 / 超时用） */
let activeAbort: AbortController | null = null;
function newAbort(timeoutMs = 120_000) {
  activeAbort?.abort();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const originalAbort = controller.abort.bind(controller);
  controller.abort = () => {
    clearTimeout(timer);
    originalAbort();
  };
  activeAbort = controller;
  return controller;
}

interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  model: string;
  sending: boolean;
  hydrated: boolean;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  /** 产物画布是否展开 */
  artifactOpen: boolean;
  /** 用户是否手动收起了画布（收起后不再被「有产物就自动弹出」覆盖） */
  artifactDismissed: boolean;
  setArtifactOpen: (v: boolean) => void;
  stopGeneration: () => void;
  hydrate: () => Promise<void>;
  runTemplate: (t: { mode: WorkspaceMode; prompt: string }) => Promise<void>;
  /** 把提示词填进输入框但不发送（真实案例点击行为）；若模式不符则新开同模式会话 */
  fillTemplate: (t: { mode: WorkspaceMode; prompt: string }) => Promise<void>;
  /** 待填入输入框的内容（nonce 变化触发 ChatPanel 消费） */
  pendingInput: { text: string; nonce: number } | null;
  /** 一键素材包：串行产出整套素材 */
  runPack: (packId: string, topic: string) => Promise<void>;
  setModel: (id: string, provider?: string) => void;
  newConversation: (mode?: WorkspaceMode) => Promise<string>;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  togglePin: (id: string) => void;
  toggleArchive: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => void;
  batchArchive: (ids: string[], archived: boolean) => Promise<void>;
  batchDelete: (ids: string[]) => Promise<void>;
  setMode: (mode: WorkspaceMode) => void;
  /** 为当前会话设置/取消 AI 角色（null = 默认） */
  setPersona: (id: string | null) => void;
  send: (text: string) => Promise<void>;
  generateSlides: (topic: string, context?: string) => Promise<void>;
  generateImage: (prompt: string, size: string) => Promise<void>;
  generateDocs: (topic: string, seed?: string) => Promise<void>;
  runResearch: (topic: string) => Promise<void>;
  reportToSlides: () => Promise<void>;
  reportToDoc: () => Promise<void>;
  setDoc: (doc: UIDoc) => void;
  aiDoc: (op: "continue" | "polish" | "shorten" | "expand" | "fix", selection?: string) => Promise<void>;
  docBusy: boolean;
  addImages: (images: UIImage[]) => void;
  setDeckTheme: (theme: ThemeId) => void;
  patchSlide: (slideIndex: number, patch: Record<string, unknown>) => void;
  addSlide: () => void;
  duplicateSlide: (index: number) => void;
  deleteSlide: (index: number) => void;
  exportDeck: () => Promise<void>;
}

function createConversation(mode: WorkspaceMode, model: string): Conversation {
  return {
    id: nextId(),
    title: MODE_LABELS[mode],
    mode,
    model,
    messages: [],
    loaded: true,
    archived: false,
    pinned: false,
    createdAt: Date.now(),
  };
}

async function api<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json() as Promise<T>;
}

/** 安全解析 SSE 数据行（`data: {...}`）；半包/异常包返回 null 而不是抛错中断整条流 */
function parseSSE<T>(line: string): T | null {
  try {
    return JSON.parse(line.slice(5).trim()) as T;
  } catch {
    return null;
  }
}

// 文档与 PPT 各自的落库防抖定时器（旧版共用一个，会互相取消）
let docPersistTimer: ReturnType<typeof setTimeout> | null = null;
let deckPersistTimer: ReturnType<typeof setTimeout> | null = null;

export const useChatStore = create<ChatState>((set, get) => {
  /** 本地更新当前会话 */
  const patchConvo = (id: string, p: Partial<Conversation>) =>
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === id ? { ...c, ...p } : c)),
    }));

  /** 持久化会话字段 */
  const persistConvo = (id: string, body: Record<string, unknown>) =>
    void api(`/api/conversations/${id}`, { method: "PATCH", body: JSON.stringify(body) }).catch(
      () => {}
    );

  const persistMessage = (conversationId: string, m: UIMessage) =>
    void api("/api/messages", {
      method: "POST",
      body: JSON.stringify({
        id: m.id,
        conversationId,
        role: m.role,
        content: m.content,
        error: Boolean(m.error),
      }),
    }).catch(() => {});

  return {
    conversations: [],
    activeId: null,
    model: "demo",
    sending: false,
    hydrated: false,
    settingsOpen: false,
    artifactOpen: !isNarrowScreen(),
    artifactDismissed: isNarrowScreen(),
    docBusy: false,
    pendingInput: null,

    setSettingsOpen: (v) => set({ settingsOpen: v }),
    // 手动收起画布时打上 dismissed 标记，避免「有产物自动弹出」把用户的收起操作顶掉；
    // 重新展开（点顶栏画布按钮）或新一轮生成开始时清除该标记。
    setArtifactOpen: (v) => set({ artifactOpen: v, artifactDismissed: !v }),

    stopGeneration: () => {
      activeAbort?.abort();
      activeAbort = null;
      set({ sending: false });
      toast("已停止生成", "info");
    },

    runTemplate: async (t) => {
      const id = await get().newConversation(t.mode);
      await get().selectConversation(id);
      // 等新会话激活后发送
      setTimeout(() => {
        if (t.mode === "image") void get().generateImage(t.prompt, "1024x1024");
        else void get().send(t.prompt);
      }, 60);
    },

    fillTemplate: async (t) => {
      const { activeId, conversations } = get();
      const active = conversations.find((c) => c.id === activeId);
      // 模式不符时新开一个同模式会话，保证提示词落在正确的工作台
      if (!active || active.mode !== t.mode) {
        const id = await get().newConversation(t.mode);
        await get().selectConversation(id);
      }
      set((s) => ({
        pendingInput: { text: t.prompt, nonce: (s.pendingInput?.nonce ?? 0) + 1 },
      }));
    },

    runPack: async (packId, topic) => {
      const { ASSET_PACKS } = await import("@/lib/packs");
      const pack = ASSET_PACKS.find((p) => p.id === packId);
      const t = topic.trim();
      if (!pack || !t) return;
      toast(`素材包「${pack.label}」开始生成，共 ${pack.steps.length} 个任务`, "info");
      for (let i = 0; i < pack.steps.length; i++) {
        const step = pack.steps[i];
        const id = await get().newConversation(step.mode);
        await get().selectConversation(id);
        // 设置标题
        patchConvo(id, { title: `【${pack.label}】${step.title}` });
        persistConvo(id, { title: `【${pack.label}】${step.title}` });
        toast(`素材包进度 ${i + 1}/${pack.steps.length}：${step.title}`, "info");
        // 等新会话激活后发送（send 会按模式路由到 slides/research/docs 专用流程）
        await new Promise((r) => setTimeout(r, 120));
        if (step.mode === "image") {
          await get().generateImage(step.prompt(t), "1024x1024");
        } else {
          await get().send(step.prompt(t));
        }
      }
      toast(`素材包「${pack.label}」全部完成 ✅ 可在左栏查看各任务`, "success");
    },

    hydrate: async () => {
      if (get().hydrated) return;
      try {
        const data = await api<{ conversations: Array<Record<string, unknown>> }>(
          "/api/conversations?archived=all"
        );
        let convos: Conversation[] = data.conversations.map((c) => ({
          id: c.id as string,
          title: (c.title as string) ?? "新任务",
          mode: (c.mode as WorkspaceMode) ?? "chat",
          model: (c.model as string) ?? "demo",
          modelProvider: (c.modelProvider as string) ?? undefined,
          messages: [],
          loaded: false,
          deck: (c.deck as SlideDeck) ?? undefined,
          deckStatus: (c.deckStatus as Conversation["deckStatus"]) ?? undefined,
          images: (c.images as UIImage[]) ?? [],
          report: (c.report as ResearchReport) ?? undefined,
          researchStatus: c.report ? "done" : undefined,
          doc: (c.doc as UIDoc) ?? undefined,
          archived: Boolean(c.archived),
          personaId: (c.personaId as string) ?? undefined,
          pinned: Boolean(c.pinned),
          createdAt: (c.createdAt as number) ?? Date.now(),
        }));

        if (convos.length === 0) {
          const convo = createConversation("chat", get().model);
          await api("/api/conversations", {
            method: "POST",
            body: JSON.stringify({ id: convo.id, title: convo.title, mode: convo.mode, model: convo.model }),
          });
          convos = [convo];
        }

        const firstActive = convos.find((c) => !c.archived) ?? convos[0];
        set({
          conversations: convos,
          activeId: firstActive.id,
          model: firstActive.model ?? "demo",
          hydrated: true,
        });
        // 加载首个会话的消息
        await get().selectConversation(firstActive.id);
      } catch {
        // 数据库不可用时退化为纯内存模式
        const convo = createConversation("chat", "demo");
        set({ conversations: [convo], activeId: convo.id, hydrated: true });
      }
    },

    setModel: (id, provider) => {
      const { providerId } = resolveModel(id, (provider as never) ?? null);
      set({ model: id });
      const { activeId } = get();
      if (activeId) {
        patchConvo(activeId, { model: id, modelProvider: provider ?? providerId });
        persistConvo(activeId, { model: id, modelProvider: provider ?? providerId });
      }
    },

    newConversation: async (mode = "chat") => {
      const convo = createConversation(mode, get().model);
      set((s) => ({
        conversations: [convo, ...s.conversations],
        activeId: convo.id,
        model: convo.model,
        artifactDismissed: false,
      }));
      await api("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ id: convo.id, title: convo.title, mode, model: convo.model }),
      }).catch(() => {});
      return convo.id;
    },

    selectConversation: async (id) => {
      set({ activeId: id, artifactDismissed: false });
      const convo = get().conversations.find((c) => c.id === id);
      if (!convo) return;
      set({ model: convo.model });
      if (convo.loaded) return;
      try {
        const data = await api<{
          messages: Array<{ id: string; role: "user" | "assistant"; content: string; error: boolean }>;
        }>(`/api/conversations/${id}`);
        patchConvo(id, {
          loaded: true,
          messages: data.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            error: m.error,
          })),
        });
      } catch {
        patchConvo(id, { loaded: true });
      }
    },

    deleteConversation: async (id) => {
      const remaining = get().conversations.filter((c) => c.id !== id);
      const fallback = remaining.find((c) => !c.archived) ?? remaining[0];
      const activeGone = get().activeId === id;
      set((s) => ({
        conversations: s.conversations.filter((c) => c.id !== id),
        activeId: activeGone ? fallback?.id ?? null : s.activeId,
      }));
      if (activeGone && fallback) {
        set({ model: fallback.model });
        void get().selectConversation(fallback.id);
      }
      await api(`/api/conversations/${id}`, { method: "DELETE" }).catch(() => {});
    },

    togglePin: (id) => {
      const convo = get().conversations.find((c) => c.id === id);
      if (!convo) return;
      const pinned = !convo.pinned;
      patchConvo(id, { pinned });
      // 置顶排到最前：重排序
      set((s) => {
        const list = s.conversations
          .map((c) => (c.id === id ? { ...c, pinned } : c))
          .sort((a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false));
        return { conversations: list };
      });
      persistConvo(id, { pinned });
    },

    toggleArchive: async (id) => {
      const convo = get().conversations.find((c) => c.id === id);
      if (!convo) return;
      const archived = !convo.archived;
      patchConvo(id, { archived });
      persistConvo(id, { archived });
      // 归档当前会话后切到下一个活跃会话
      if (archived && get().activeId === id) {
        const next = get().conversations.find((c) => c.id !== id && !c.archived);
        if (next) {
          set({ activeId: next.id, model: next.model });
          await get().selectConversation(next.id);
        } else {
          const newId = await get().newConversation("chat");
          set({ activeId: newId });
        }
      }
    },

    renameConversation: (id, title) => {
      const t = title.trim();
      if (!t) return;
      patchConvo(id, { title: t });
      persistConvo(id, { title: t });
    },

    batchArchive: async (ids, archived) => {
      set((s) => ({
        conversations: s.conversations.map((c) =>
          ids.includes(c.id) ? { ...c, archived } : c
        ),
      }));
      await api("/api/conversations/batch", {
        method: "POST",
        body: JSON.stringify({ action: archived ? "archive" : "unarchive", ids }),
      })
        .then(() => toast(archived ? `已归档 ${ids.length} 个任务` : `已恢复 ${ids.length} 个任务`, "success"))
        .catch(() => toast("操作失败", "error"));
    },

    batchDelete: async (ids) => {
      const remaining = get().conversations.filter((c) => !ids.includes(c.id));
      const activeGone = get().activeId && ids.includes(get().activeId!);
      const fallback = remaining.find((c) => !c.archived) ?? remaining[0];
      set({
        conversations: remaining,
        activeId: activeGone ? fallback?.id ?? null : get().activeId,
      });
      if (activeGone && fallback) {
        set({ model: fallback.model });
        void get().selectConversation(fallback.id);
      }
      await api("/api/conversations/batch", {
        method: "POST",
        body: JSON.stringify({ action: "delete", ids }),
      })
        .then(() => toast(`已删除 ${ids.length} 个任务`, "success"))
        .catch(() => toast("删除失败", "error"));
    },

    setMode: (mode) => {
      const { activeId } = get();
      if (!activeId) return;
      patchConvo(activeId, { mode });
      persistConvo(activeId, { mode });
    },

    setPersona: (id) => {
      const { activeId } = get();
      if (!activeId) return;
      patchConvo(activeId, { personaId: id || undefined });
      persistConvo(activeId, { personaId: id || null });
    },

    addImages: (images) => {
      const { activeId, conversations } = get();
      if (!activeId) return;
      const convo = conversations.find((c) => c.id === activeId);
      const next = [...(convo?.images ?? []), ...images];
      patchConvo(activeId, { images: next });
      persistConvo(activeId, { images: next });
    },

    generateImage: async (prompt, size) => {
      const p = prompt.trim();
      if (!p || get().sending) return;

      let convo = get().conversations.find((c) => c.id === get().activeId);
      if (!convo) {
        const id = await get().newConversation("image");
        convo = get().conversations.find((c) => c.id === id)!;
      }
      const current = convo;
      if (current.mode !== "image") {
        patchConvo(current.id, { mode: "image" });
        persistConvo(current.id, { mode: "image" });
      }

      const userMsg: UIMessage = { id: nextId(), role: "user", content: `绘图：${p}` };
      const assistantMsg: UIMessage = {
        id: nextId(),
        role: "assistant",
        content: "正在生成图像…",
        streaming: true,
      };
      const title = current.messages.length === 0 ? p.slice(0, 24) : current.title;
      patchConvo(current.id, {
        title,
        messages: [...current.messages, userMsg, assistantMsg],
      });
      if (title !== current.title) persistConvo(current.id, { title });
      set({ sending: true, artifactDismissed: false });

      const ov = getOverrides();
      let imageModel = "demo-image";
      if (ov.dashscope?.apiKey && current.model.startsWith("qwen")) imageModel = "wan2.7-t2i-flash";
      else if (ov.openai?.apiKey) imageModel = "dall-e-3";
      else if (ov.dashscope?.apiKey) imageModel = "wan2.7-t2i-flash";

      const controller = newAbort();
      try {
        const res = await fetch("/api/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: imageModel, prompt: p, size, overrides: ov }),
          signal: controller.signal,
        });
        const data = (await res.json()) as { url?: string; model?: string; error?: string };
        if (!res.ok || !data.url) throw new Error(data.error ?? "图像生成失败");

        const img: UIImage = {
          id: nextId(),
          prompt: p,
          model: data.model ?? "demo-image",
          url: data.url,
          createdAt: Date.now(),
        };
        get().addImages([img]);
        const note = `✅ 图像已生成（${data.model}）。可在右侧画布查看、下载。`;
        patchConvo(current.id, {
          messages: get()
            .conversations.find((x) => x.id === current.id)!
            .messages.map((m) => (m.id === assistantMsg.id ? { ...m, content: note, streaming: false } : m)),
        });
        persistMessage(current.id, userMsg);
        persistMessage(current.id, { ...assistantMsg, content: note });
      } catch (err) {
        const aborted = (err as Error)?.name === "AbortError";
        const content = aborted ? "已停止生成。" : `⚠️ ${err instanceof Error ? err.message : "图像生成失败"}`;
        patchConvo(current.id, {
          messages: get()
            .conversations.find((x) => x.id === current.id)!
            .messages.map((m) =>
              m.id === assistantMsg.id ? { ...m, content, streaming: false, error: !aborted } : m
            ),
        });
        persistMessage(current.id, userMsg);
        persistMessage(current.id, { ...assistantMsg, content, error: !aborted });
      } finally {
        set({ sending: false });
      }
    },

    send: async (text) => {
      const trimmed = text.trim();
      if (!trimmed || get().sending) return;

      const { activeId } = get();
      const convoNow = get().conversations.find((c) => c.id === activeId);
      const model = convoNow?.model ?? get().model;
      const modelProvider = convoNow?.modelProvider;
      let convo = convoNow;
      if (!convo) {
        const id = await get().newConversation("chat");
        convo = get().conversations.find((c) => c.id === id)!;
      }
      const current = convo;

      // PPT 模式走专用生成流程
      if (current.mode === "slides") {
        await get().generateSlides(trimmed);
        return;
      }
      // 研究模式走深度研究流程
      if (current.mode === "research") {
        await get().runResearch(trimmed);
        return;
      }
      // 文档模式：生成 Markdown 文档到右侧文档画布
      if (current.mode === "docs") {
        await get().generateDocs(trimmed);
        return;
      }

      const userMsg: UIMessage = { id: nextId(), role: "user", content: trimmed };
      const assistantMsg: UIMessage = {
        id: nextId(),
        role: "assistant",
        content: "",
        streaming: true,
      };

      const title = current.messages.length === 0 ? trimmed.slice(0, 24) : current.title;
      patchConvo(current.id, {
        title,
        messages: [...current.messages, userMsg, assistantMsg],
      });
      if (title !== current.title) persistConvo(current.id, { title });
      set({ sending: true, artifactDismissed: false });

      // AI 角色 system prompt（叠加在模式提示词之后）
      let personaSystem = "";
      if (current.personaId) {
        const persona = getPersona(current.personaId);
        if (persona?.system) personaSystem = persona.system;
      }
      const systemContent = [MODE_PROMPTS[current.mode], personaSystem].filter(Boolean).join("\n\n");

      const apiMessages = [
        { role: "system" as const, content: systemContent },
        ...current.messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: trimmed },
      ];

      const controller = newAbort();
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, messages: apiMessages, overrides: getOverrides(), provider: modelProvider ?? undefined }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(`请求失败 ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let errored: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith("data:")) continue;
            const evt = parseSSE<
              | { type: "token"; delta: string }
              | { type: "usage"; credits: number }
              | { type: "error"; message: string }
            >(t);
            if (!evt) continue;
            if (evt.type === "token") {
              const c = get().conversations.find((x) => x.id === current.id);
              const m = c?.messages.find((x) => x.id === assistantMsg.id);
              patchConvo(current.id, {
                messages: get()
                  .conversations.find((x) => x.id === current.id)!
                  .messages.map((mm) =>
                    mm.id === assistantMsg.id ? { ...mm, content: (m?.content ?? "") + evt.delta } : mm
                  ),
              });
            } else if (evt.type === "error") {
              errored = evt.message;
            }
          }
        }

        const finalContent = errored
          ? `⚠️ ${errored}`
          : get().conversations.find((x) => x.id === current.id)?.messages.find((m) => m.id === assistantMsg.id)?.content ?? "";

        patchConvo(current.id, {
          messages: get()
            .conversations.find((x) => x.id === current.id)!
            .messages.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, streaming: false, error: Boolean(errored), content: finalContent }
                : m
            ),
        });
        persistMessage(current.id, userMsg);
        persistMessage(current.id, { ...assistantMsg, content: finalContent, error: Boolean(errored) });
      } catch (err) {
        const aborted = (err as Error)?.name === "AbortError";
        const soFar =
          get()
            .conversations.find((x) => x.id === current.id)
            ?.messages.find((m) => m.id === assistantMsg.id)?.content ?? "";
        const content = aborted
          ? soFar || "已停止生成。"
          : `⚠️ ${err instanceof Error ? err.message : "网络错误，请重试"}`;
        patchConvo(current.id, {
          messages: get()
            .conversations.find((x) => x.id === current.id)!
            .messages.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, streaming: false, error: !aborted, content }
                : m
            ),
        });
        persistMessage(current.id, userMsg);
        persistMessage(current.id, { ...assistantMsg, content, error: !aborted });
      } finally {
        set({ sending: false });
      }
    },

    generateSlides: async (topic, context) => {
      const trimmed = topic.trim();
      if (!trimmed || get().sending) return;

      let convo = get().conversations.find((c) => c.id === get().activeId);
      if (!convo) {
        const id = await get().newConversation("slides");
        convo = get().conversations.find((c) => c.id === id)!;
      }
      const current = convo;
      if (current.mode !== "slides") {
        patchConvo(current.id, { mode: "slides" });
        persistConvo(current.id, { mode: "slides" });
      }

      const userMsg: UIMessage = { id: nextId(), role: "user", content: `生成 PPT：${trimmed}` };
      const assistantMsg: UIMessage = { id: nextId(), role: "assistant", content: "", streaming: true };

      const title = current.messages.length === 0 ? trimmed.slice(0, 24) : current.title;
      patchConvo(current.id, {
        title,
        deckStatus: "loading",
        deckMessage: "正在规划幻灯片结构…",
        messages: [...current.messages, userMsg, assistantMsg],
      });
      persistConvo(current.id, { title, deckStatus: "loading" });
      set({ sending: true, artifactDismissed: false });

      const updateAssistant = (content: string, extra?: Partial<UIMessage>) => {
        patchConvo(current.id, {
          messages: get()
            .conversations.find((x) => x.id === current.id)!
            .messages.map((m) =>
              m.id === assistantMsg.id ? { ...m, content, ...extra } : m
            ),
        });
      };

      const slidesController = newAbort(180_000);
      try {
        const res = await fetch("/api/slides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: trimmed,
            model: current.model,
            provider: current.modelProvider ?? undefined,
            overrides: getOverrides(),
            context: context ? context.slice(0, 6000) : undefined,
          }),
          signal: slidesController.signal,
        });
        if (!res.ok || !res.body) throw new Error(`请求失败 ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let deck: SlideDeck | null = null;
        let error: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith("data:")) continue;
            const evt = parseSSE<
              | { type: "status"; message: string }
              | { type: "deck"; deck: SlideDeck }
              | { type: "error"; message: string }
            >(t);
            if (!evt) continue;
            if (evt.type === "status") {
              patchConvo(current.id, { deckMessage: evt.message });
              updateAssistant(evt.message + "…");
            } else if (evt.type === "deck") {
              deck = evt.deck;
            } else if (evt.type === "error") {
              error = evt.message;
            }
          }
        }

        if (deck) {
          const note = `✅ PPT《${deck.title}》已生成，共 ${deck.slides.length} 页。可在右侧画布切换主题、编辑文字，或导出 PPTX。`;
          patchConvo(current.id, { deck, deckStatus: "done", deckMessage: undefined });
          updateAssistant(note, { streaming: false });
          persistConvo(current.id, { deck, deckStatus: "done" });
          persistMessage(current.id, userMsg);
          persistMessage(current.id, { ...assistantMsg, content: note });
        } else {
          throw new Error(error ?? "生成失败");
        }
      } catch (err) {
        const aborted = (err as Error)?.name === "AbortError";
        const content = aborted ? "已停止生成。" : `⚠️ ${err instanceof Error ? err.message : "幻灯片生成失败"}`;
        patchConvo(current.id, {
          deckStatus: aborted ? "idle" : "error",
          deckMessage: undefined,
        });
        updateAssistant(content, { streaming: false, error: !aborted });
        if (!aborted) persistConvo(current.id, { deckStatus: "error" });
        persistMessage(current.id, userMsg);
        persistMessage(current.id, { ...assistantMsg, content, error: !aborted });
      } finally {
        set({ sending: false });
      }
    },

    runResearch: async (topic) => {
      const trimmed = topic.trim();
      if (!trimmed || get().sending) return;

      let convo = get().conversations.find((c) => c.id === get().activeId);
      if (!convo) {
        const id = await get().newConversation("research");
        convo = get().conversations.find((c) => c.id === id)!;
      }
      const current = convo;
      if (current.mode !== "research") {
        patchConvo(current.id, { mode: "research" });
        persistConvo(current.id, { mode: "research" });
      }

      const userMsg: UIMessage = { id: nextId(), role: "user", content: `研究：${trimmed}` };
      const assistantMsg: UIMessage = {
        id: nextId(),
        role: "assistant",
        content: "正在规划研究…",
        streaming: true,
      };
      const title = current.messages.length === 0 ? trimmed.slice(0, 24) : current.title;
      patchConvo(current.id, {
        title,
        researchStatus: "loading",
        researchMessage: "正在规划研究…",
        messages: [...current.messages, userMsg, assistantMsg],
      });
      if (title !== current.title) persistConvo(current.id, { title });
      set({ sending: true, artifactDismissed: false });

      const updateAssistant = (content: string, extra?: Partial<UIMessage>) => {
        patchConvo(current.id, {
          messages: get()
            .conversations.find((x) => x.id === current.id)!
            .messages.map((m) =>
              m.id === assistantMsg.id ? { ...m, content, ...extra } : m
            ),
        });
      };

      const researchController = newAbort(180_000);
      try {
        const res = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: trimmed,
            model: current.model,
            provider: current.modelProvider ?? undefined,
            overrides: getOverrides(),
            tavilyKey: loadTavilyKey(),
          }),
          signal: researchController.signal,
        });
        if (!res.ok || !res.body) throw new Error(`请求失败 ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let report: ResearchReport | null = null;
        let error: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith("data:")) continue;
            const evt = parseSSE<
              | { type: "status"; message: string }
              | { type: "report"; report: ResearchReport }
              | { type: "error"; message: string }
            >(t);
            if (!evt) continue;
            if (evt.type === "status") {
              patchConvo(current.id, { researchMessage: evt.message });
              updateAssistant(evt.message + "…");
            } else if (evt.type === "report") {
              report = evt.report;
            } else if (evt.type === "error") {
              error = evt.message;
            }
          }
        }

        if (report) {
          const note = `✅ 研究报告《${report.topic}》已完成，共 ${report.sections.length} 个小节、引用 ${report.sources.length} 个来源。可在右侧画布阅读全文并「一键转 PPT」。`;
          patchConvo(current.id, {
            report,
            researchStatus: "done",
            researchMessage: undefined,
          });
          updateAssistant(note, { streaming: false });
          // researchStatus 不是数据库字段（水合时由 report 是否存在推导），不再发送死字段
          persistConvo(current.id, { report });
          persistMessage(current.id, userMsg);
          persistMessage(current.id, { ...assistantMsg, content: note });
        } else {
          throw new Error(error ?? "研究失败");
        }
      } catch (err) {
        const aborted = (err as Error)?.name === "AbortError";
        const content = aborted ? "已停止生成。" : `⚠️ ${err instanceof Error ? err.message : "研究失败"}`;
        patchConvo(current.id, {
          researchStatus: aborted ? "idle" : "error",
          researchMessage: undefined,
        });
        updateAssistant(content, { streaming: false, error: !aborted });
        persistMessage(current.id, userMsg);
        persistMessage(current.id, { ...assistantMsg, content, error: !aborted });
      } finally {
        set({ sending: false });
      }
    },

    /** 研究报告一键转 PPT：在新的 slides 任务中基于报告内容生成 */
    reportToSlides: async () => {
      const convo = get().conversations.find((c) => c.id === get().activeId);
      if (!convo?.report || get().sending) return;
      const report = convo.report;
      const context = [
        report.summary,
        ...report.sections.map((s) => `${s.heading}\n${s.body}`),
        `关键结论：${report.takeaways.join("；")}`,
      ].join("\n\n");

      const id = await get().newConversation("slides");
      await get().selectConversation(id);
      setTimeout(() => {
        void get().generateSlides(report.topic, context);
      }, 80);
    },

    setDoc: (doc) => {
      const { activeId } = get();
      if (!activeId) return;
      const next = { ...doc, updatedAt: Date.now() };
      patchConvo(activeId, { doc: next });
      if (docPersistTimer) clearTimeout(docPersistTimer);
      docPersistTimer = setTimeout(() => persistConvo(activeId, { doc: next }), 600);
    },

    reportToDoc: async () => {
      const convo = get().conversations.find((c) => c.id === get().activeId);
      if (!convo?.report) return;
      const r = convo.report;
      const md = [
        `# ${r.topic}`,
        "",
        `> ${r.summary}`,
        "",
        ...r.sections.flatMap((s) => [`## ${s.heading}`, "", s.body, ""]),
        `## 关键结论`,
        "",
        ...r.takeaways.map((t) => `- ${t}`),
        "",
        `## 参考来源`,
        "",
        ...r.sources.map((s, i) => `${i + 1}. [${s.title}](${s.url})`),
      ].join("\n");
      patchConvo(convo.id, { mode: "docs", doc: { title: r.topic, content: md, updatedAt: Date.now() } });
      persistConvo(convo.id, { mode: "docs", doc: { title: r.topic, content: md, updatedAt: Date.now() } });
      toast("已转为可编辑文档", "success");
    },

    generateDocs: async (topic, seed) => {
      const p = (topic ?? "").trim();
      if ((!p && !seed) || get().sending) return;
      const { activeId } = get();
      const convoNow = get().conversations.find((c) => c.id === activeId);
      const model = convoNow?.model ?? get().model;
      const modelProvider = convoNow?.modelProvider;
      let convo = convoNow;
      if (!convo) {
        const id = await get().newConversation("docs");
        convo = get().conversations.find((c) => c.id === id)!;
      }
      const current = convo;
      if (current.mode !== "docs") {
        patchConvo(current.id, { mode: "docs" });
        persistConvo(current.id, { mode: "docs" });
      }
      const title = (p || "文档").slice(0, 30);
      patchConvo(current.id, { title });
      persistConvo(current.id, { title });
      set({ docBusy: true, sending: true, artifactDismissed: false });

      const ov = getOverrides();
      // 密钥可能只配在服务端 .env（localStorage 看不到），需问服务端真实配置状态，
      // 否则「env 配了密钥但文档仍出示例占位文」。
      const { providerId } = resolveModel(model, (modelProvider as never) ?? null);
      const serverStatus = await serverProviderStatus();
      const configured =
        providerId !== "demo" &&
        (Boolean(ov[providerId]?.apiKey) || Boolean(serverStatus[providerId]));
      if (!configured || model === "demo") {
        const sample = seed
          ? seed
          : `# ${title}\n\n> 这里是 AI 生成的示例文档（演示模型）。配置真实模型后会由 AI 撰写完整内容。\n\n## 一、背景\n\n围绕「${p}」的背景说明……\n\n## 二、核心内容\n\n- 要点一：……\n- 要点二：……\n- 要点三：……\n\n## 三、结论与建议\n\n……\n`;
        let acc = "";
        for (const ch of sample) {
          acc += ch;
          patchConvo(current.id, { doc: { title, content: acc, updatedAt: Date.now() } });
          if (acc.length % 6 === 0) await new Promise((r) => setTimeout(r, 8));
        }
        persistConvo(current.id, { doc: { title, content: sample, updatedAt: Date.now() } });
        set({ docBusy: false, sending: false });
        return;
      }

      const messages = [
        { role: "system" as const, content: MODE_PROMPTS.docs },
        ...(seed ? [{ role: "assistant" as const, content: seed }] : []),
        { role: "user" as const, content: p || "请撰写文档" },
      ];
      let acc = "";
      try {
        const controller = newAbort(180_000);
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, messages, overrides: ov, provider: modelProvider ?? providerId }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(`请求失败 ${res.status}`);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const render = () =>
          patchConvo(current.id, { doc: { title, content: acc, updatedAt: Date.now() } });
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith("data:")) continue;
            const evt = parseSSE<{ type: string; delta?: string; message?: string }>(t);
            if (!evt) continue;
            if (evt.type === "token" && evt.delta) {
              acc += evt.delta;
              if (acc.length % 12 === 0) render();
            } else if (evt.type === "error") throw new Error(evt.message);
          }
        }
        const finalDoc = { title, content: acc.trim(), updatedAt: Date.now() };
        patchConvo(current.id, { doc: finalDoc });
        persistConvo(current.id, { doc: finalDoc });
      } catch (err) {
        toast(err instanceof Error ? err.message : "文档生成失败", "error");
      } finally {
        set({ docBusy: false, sending: false });
      }
    },

    aiDoc: async (op, selection) => {
      const convo = get().conversations.find((c) => c.id === get().activeId);
      if (!convo?.doc || get().docBusy) return;
      const target = (selection ?? convo.doc.content).trim();
      if (!target) return;
      const ov = getOverrides();
      const model = convo.model ?? get().model;
      const { providerId } = resolveModel(model, (convo.modelProvider as never) ?? null);
      if (!ov[providerId]?.apiKey && model === "demo") {
        toast("配置真实模型后可使用 AI 续写/润色", "info");
        return;
      }
      const OP_PROMPT: Record<string, string> = {
        continue: "请在下面文档的基础上继续往下写，延续风格，直接输出续写的 Markdown 内容，不要重复已有内容、不要解释：\n\n",
        polish: "请润色下面的 Markdown 文档，使语言更专业流畅、结构更清晰，保持原意，只输出完整修改后的 Markdown：\n\n",
        shorten: "请精简下面的 Markdown 文档，去除冗余、保留要点，只输出精简后的完整 Markdown：\n\n",
        expand: "请扩写下面的 Markdown 文档，补充细节、例子与论证，使内容更充实，只输出扩写后的完整 Markdown：\n\n",
        fix: "请检查并修正下面 Markdown 文档中的错别字、语病与格式问题，只输出修正后的完整 Markdown：\n\n",
      };
      set({ docBusy: true });
      const messages = [
        { role: "system" as const, content: MODE_PROMPTS.docs },
        { role: "user" as const, content: OP_PROMPT[op] + target },
      ];
      let acc = "";
      try {
        const controller = newAbort(180_000);
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, messages, overrides: ov, provider: convo.modelProvider ?? providerId }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(`请求失败 ${res.status}`);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const base = convo.doc.content;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith("data:")) continue;
            const evt = parseSSE<{ type: string; delta?: string; message?: string }>(t);
            if (!evt) continue;
            if (evt.type === "token" && evt.delta) {
              acc += evt.delta;
              const content = op === "continue" ? base + "\n\n" + acc : acc;
              patchConvo(convo.id, { doc: { ...convo.doc!, content, updatedAt: Date.now() } });
            } else if (evt.type === "error") throw new Error(evt.message);
          }
        }
        const finalContent = op === "continue" ? base + "\n\n" + acc.trim() : acc.trim();
        const finalDoc = { ...convo.doc, content: finalContent, updatedAt: Date.now() };
        patchConvo(convo.id, { doc: finalDoc });
        persistConvo(convo.id, { doc: finalDoc });
        toast("已完成", "success");
      } catch (err) {
        toast(err instanceof Error ? err.message : "AI 处理失败", "error");
      } finally {
        set({ docBusy: false });
      }
    },

    setDeckTheme: (theme) => {
      const { activeId } = get();
      const convo = get().conversations.find((c) => c.id === activeId);
      if (!convo?.deck) return;
      const deck = { ...convo.deck, theme };
      patchConvo(activeId!, { deck });
      persistConvo(activeId!, { deck });
    },

    patchSlide: (slideIndex, p) => {
      const { activeId } = get();
      const convo = get().conversations.find((c) => c.id === activeId);
      if (!convo?.deck) return;
      const slides = convo.deck.slides.map((sl, i) => (i === slideIndex ? { ...sl, ...p } : sl));
      const deck = { ...convo.deck, slides };
      patchConvo(activeId!, { deck });
      if (deckPersistTimer) clearTimeout(deckPersistTimer);
      deckPersistTimer = setTimeout(() => persistConvo(activeId!, { deck }), 600);
    },

    addSlide: () => {
      const { activeId } = get();
      const convo = get().conversations.find((c) => c.id === activeId);
      if (!convo?.deck) return;
      const slides = [
        ...convo.deck.slides.slice(0, -1),
        { layout: "content" as const, title: "新页面", bullets: ["要点一", "要点二"] },
        convo.deck.slides[convo.deck.slides.length - 1],
      ];
      const deck = { ...convo.deck, slides };
      patchConvo(activeId!, { deck });
      persistConvo(activeId!, { deck });
      toast("已添加一页", "success");
    },

    duplicateSlide: (index) => {
      const { activeId } = get();
      const convo = get().conversations.find((c) => c.id === activeId);
      if (!convo?.deck) return;
      const copy = JSON.parse(JSON.stringify(convo.deck.slides[index]));
      const slides = [...convo.deck.slides];
      slides.splice(index + 1, 0, copy);
      const deck = { ...convo.deck, slides };
      patchConvo(activeId!, { deck });
      persistConvo(activeId!, { deck });
      toast("已复制该页", "success");
    },

    deleteSlide: (index) => {
      const { activeId } = get();
      const convo = get().conversations.find((c) => c.id === activeId);
      if (!convo?.deck || convo.deck.slides.length <= 1) {
        toast("至少保留一页", "error");
        return;
      }
      const slides = convo.deck.slides.filter((_, i) => i !== index);
      const deck = { ...convo.deck, slides };
      patchConvo(activeId!, { deck });
      persistConvo(activeId!, { deck });
      toast("已删除该页", "info");
    },

    exportDeck: async () => {
      const convo = get().conversations.find((c) => c.id === get().activeId);
      if (!convo?.deck) return;
      const res = await fetch("/api/slides/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deck: convo.deck }),
      });
      if (!res.ok) throw new Error("导出失败");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const safeName = (convo.deck.title || "slides").replace(/[\\/:*?"<>|]/g, "_").slice(0, 60);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
      toast("PPTX 已导出", "success");
    },
  };
});

export { MODELS };
