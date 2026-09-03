"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LayoutGrid, Search } from "lucide-react";
import { ShellSidebar } from "@/components/mockup/ShellSidebar";
import { ToolRunnerModal } from "@/components/tools/ToolRunnerModal";
import { TOOL_GROUPS, type ToolDef } from "@/lib/tools";
import { toast } from "@/lib/store/toast";
import { Toaster } from "@/components/Toaster";

export default function ToolsPage() {
  const router = useRouter();
  const [active, setActive] = useState<ToolDef | null>(null);
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOOL_GROUPS;
    return TOOL_GROUPS.map((g) => ({
      ...g,
      tools: g.tools.filter(
        (t) => t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
      ),
    })).filter((g) => g.tools.length > 0);
  }, [query]);

  const total = TOOL_GROUPS.reduce((n, g) => n + g.tools.length, 0);
  const usable = TOOL_GROUPS.reduce((n, g) => n + g.tools.filter((t) => t.kind !== "unsupported").length, 0);

  return (
    <div className="flex h-screen overflow-hidden bg-[#fbf8f4] text-stone-800">
      <ShellSidebar active="tools" />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* 顶栏 */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#f0eadf] bg-[#fbf8f4] px-6 py-4">
          <div>
            <h1 className="text-[18px] font-semibold text-stone-900">工具箱</h1>
            <p className="mt-0.5 text-[12.5px] text-stone-400">
              共 {total} 个工具，{usable} 个已可直接运行 · 点开即用，无需上传服务器
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-[#ece6db] bg-white px-3 py-2 text-stone-400">
              <Search className="h-4 w-4" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索工具"
                className="w-40 bg-transparent text-[13px] text-stone-700 outline-none placeholder:text-stone-400"
              />
            </div>
            <button
              onClick={() => toast("演示版暂未接入通知中心", "info")}
              title="通知"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white hover:text-stone-700"
            >
              <Bell className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={() => router.push("/apps")}
              title="更多应用"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white hover:text-stone-700"
            >
              <LayoutGrid className="h-[18px] w-[18px]" />
            </button>
          </div>
        </header>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-5">
          <div className="mx-auto w-full max-w-[1180px]">
            {groups.length === 0 && (
              <p className="py-16 text-center text-sm text-stone-400">没有找到匹配的工具</p>
            )}
            {groups.map((g) => (
              <div key={g.title} className="mt-5 first:mt-0">
                <h2 className="text-[15px] font-semibold text-stone-800">{g.title}</h2>
                <div className="mt-3 grid grid-cols-4 gap-3">
                  {g.tools.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActive(t)}
                      className="flex items-start gap-3 rounded-2xl border border-[#ece6db] bg-white p-4 text-left shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:shadow-md"
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.bg} ${t.tint}`}>
                        <t.icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[13.5px] font-semibold text-stone-800">{t.name}</span>
                          {t.kind === "unsupported" ? (
                            <span className="shrink-0 rounded bg-stone-100 px-1 py-px text-[9.5px] font-normal text-stone-400">
                              需服务端
                            </span>
                          ) : (
                            <span className="shrink-0 rounded bg-emerald-50 px-1 py-px text-[9.5px] font-normal text-emerald-600">
                              可用
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-stone-400">{t.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <ToolRunnerModal tool={active} onClose={() => setActive(null)} />
      <Toaster />
    </div>
  );
}
