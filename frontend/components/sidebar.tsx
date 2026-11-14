"use client";

import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react";
import { Brand } from "@/frontend/components/brand";
import { NavLinks } from "@/frontend/components/nav-links";
import { cn } from "@/frontend/lib/utils";
import type { AppRole } from "@/backend/types";

export function Sidebar({ role }: { role: AppRole }) {
  const [open, setOpen] = useState(true);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-white/70 py-6 transition-[width,padding] duration-300 ease-out lg:flex",
        open ? "w-64 px-4" : "w-20 px-3",
      )}
    >
      <div
        className={cn(
          "flex items-center",
          open ? "justify-between" : "flex-col gap-3",
        )}
      >
        <Brand compact={!open} />

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          title={open ? "Collapse sidebar" : "Expand sidebar"}
          className="focus-ring rounded-lg p-1.5 text-slate-400 transition hover:bg-white/80 hover:text-slate-700"
        >
          {open ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>
      </div>

      {open ? (
        <p className="mt-8 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Workspace
        </p>
      ) : null}

      <NavLinks
        role={role}
        collapsed={!open}
        className={open ? "mt-2" : "mt-6"}
      />

      {open ? (
        <div className="mt-auto rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
          <div className="flex items-center gap-2 text-blue-700">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">Tip</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            {role === "hr"
              ? "Keep articles current and tickets moving. Search first — the answer is often one article away."
              : "Search first — the answer is often one article away. Still stuck? Open a ticket."}
          </p>
        </div>
      ) : null}
    </aside>
  );
}
