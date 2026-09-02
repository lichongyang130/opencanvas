"use client";

import { useState } from "react";
import {
  Clapperboard,
  FileText,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutGrid,
  MessageSquare,
  Monitor,
  Package,
  Presentation,
  Search,
  Settings,
  Video,
} from "lucide-react";
import { useChatStore, type WorkspaceMode } from "@/lib/store/chat";
import { TEMPLATES } from "@/lib/templates";
import { TemplatesModal } from "./TemplatesModal";
import { PacksModal } from "./PacksModal";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const CATEGORIES: {
  id: string;
  label: string;
  icon: ReactNode;
  color: string;
  bgColor: string;
}[] = [
  { id: "brand", label: "品牌与传播", icon: <Globe className="h-[18px] w-[18px]" />, color: "text-rose-600", bgColor: "hover:bg-rose-50 hover:text-rose-600" },
  { id: "content", label: "内容与视频", icon: <Clapperboard className="h-[18px] w-[18px]" />, color: "text-violet-600", bgColor: "hover:bg-violet-50 hover:text-violet-600" },
  { id: "product", label: "产品与体验", icon: <Monitor className="h-[18px] w-[18px]" />, color: "text-sky-600", bgColor: "hover:bg-sky-50 hover:text-sky-600" },
  { id: "data", label: "数据与运营", icon: <LayoutDashboard className="h-[18px] w-[18px]" />, color: "text-emerald-600", bgColor: "hover:bg-emerald-50 hover:text-emerald-600" },
  { id: "consult", label: "咨询与策划", icon: <Presentation className="h-[18px] w-[18px]" />, color: "text-amber-600", bgColor: "hover:bg-amber-50 hover:text-amber-600" },
];

const QUICK_MODES: { mode: WorkspaceMode; icon: ReactNode; label: string }[] = [
  { mode: "chat", icon: <MessageSquare className="h-[18px] w-[18px]" />, label: "AI 对话" },
  { mode: "docs", icon: <FileText className="h-[18px] w-[18px]" />, label: "快速文档" },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const { newConversation, setSettingsOpen } = useChatStore();
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [packsOpen, setPacksOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <>
      {/* 纯图标轨 48px */}
      <aside className="flex w-12 shrink-0 flex-col items-center border-r border-[var(--oc-border-strong)] bg-[#f5efe4] py-2">
        {/* 品牌 */}
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white shadow-sm">
          O
        </div>

        {/* 能力分类图标 */}
        <div className="flex flex-col items-center gap-0.5">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                title={cat.label}
                onClick={() => setActiveCategory((prev) => (prev === cat.id ? null : cat.id))}
                className={cn(
                  "group relative flex h-10 w-10 items-center justify-center rounded-xl transition",
                  isActive
                    ? `bg-brand-50 ${cat.color}`
                    : `text-stone-400 ${cat.bgColor}`
                )}
              >
                {cat.icon}
                {isActive && (
                  <span className="absolute -left-0.5 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-brand-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* 分隔线 */}
        <div className="mx-2 my-2 h-px w-6 bg-stone-200" />

        {/* 快速新建 */}
        {QUICK_MODES.map((qm) => (
          <button
            key={qm.mode}
            title={qm.label}
            onClick={() => { void newConversation(qm.mode); onNavigate?.(); }}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-400 transition hover:bg-brand-50 hover:text-brand-600"
          >
            {qm.icon}
          </button>
        ))}

        {/* 模板库 & 素材包 */}
        <button
          title={`提示词模板库 (${TEMPLATES.length}+)`}
          onClick={() => setTemplatesOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-400 transition hover:bg-brand-50 hover:text-brand-600"
        >
          <LayoutGrid className="h-[18px] w-[18px]" />
        </button>
        <button
          title="一键素材包"
          onClick={() => setPacksOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-amber-500/70 transition hover:bg-amber-50 hover:text-amber-600"
        >
          <Package className="h-[18px] w-[18px]" />
        </button>

        {/* 弹性空间 */}
        <div className="flex-1" />

        {/* 设置 */}
        <button
          title="模型设置"
          onClick={() => { setSettingsOpen(true); onNavigate?.(); }}
          className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl text-stone-400 transition hover:bg-stone-100 hover:text-brand-600"
        >
          <Settings className="h-[18px] w-[18px]" />
        </button>
      </aside>

      <TemplatesModal open={templatesOpen} onClose={() => setTemplatesOpen(false)} />
      <PacksModal open={packsOpen} onClose={() => setPacksOpen(false)} />
    </>
  );
}
