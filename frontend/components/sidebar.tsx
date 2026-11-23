"use client";

import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Brand, CrewkitMark } from "@/frontend/components/brand";
import { NavLinks } from "@/frontend/components/nav-links";
import { cn } from "@/frontend/lib/utils";
import type { AppRole } from "@/backend/types";

export function Sidebar({ role }: { role: AppRole }) {
  const [open, setOpen] = useState(true);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-blue-800/40 bg-gradient-to-b from-blue-700 via-blue-700 to-indigo-700 py-6 text-white transition-[width,padding] duration-300 ease-out lg:flex",
        open ? "w-64 px-4" : "w-20 px-3",
      )}
    >
      <div
        className={cn(
          "flex items-center",
          open ? "justify-between" : "flex-col gap-3",
        )}
      >
        {open ? (
          <Brand inverted />
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="focus-ring rounded-xl"
          >
            <CrewkitMark />
          </button>
        )}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          title={open ? "Collapse sidebar" : "Expand sidebar"}
          className="focus-ring rounded-lg p-1.5 text-blue-100 transition hover:bg-white/15 hover:text-white"
        >
          {open ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>
      </div>

      {open ? (
        <p className="mt-8 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-100">
          Workspace
        </p>
      ) : null}

      <NavLinks
        role={role}
        collapsed={!open}
        inverted
        className={open ? "mt-2" : "mt-6"}
      />
    </aside>
  );
}
