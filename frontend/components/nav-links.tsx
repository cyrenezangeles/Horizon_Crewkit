"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  Library,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import type { AppRole } from "@/backend/types";

type NavItem = {
  href: string;
  label: string;
  icon: typeof BookOpen;
  isActive: (pathname: string) => boolean;
};

const employeeItems: NavItem[] = [
  {
    href: "/kb",
    label: "Knowledge base",
    icon: BookOpen,
    isActive: (pathname) => pathname === "/kb" || pathname.startsWith("/kb/"),
  },
  {
    href: "/tickets",
    label: "My tickets",
    icon: ClipboardList,
    isActive: (pathname) =>
      pathname === "/tickets" ||
      (pathname.startsWith("/tickets/") && pathname !== "/tickets/new"),
  },
  {
    href: "/tickets/new",
    label: "New ticket",
    icon: PlusCircle,
    isActive: (pathname) => pathname === "/tickets/new",
  },
];

const hrItems: NavItem[] = [
  {
    href: "/admin",
    label: "HR dashboard",
    icon: LayoutDashboard,
    isActive: (pathname) => pathname === "/admin",
  },
  {
    href: "/tickets",
    label: "Support tickets",
    icon: ClipboardList,
    isActive: (pathname) =>
      pathname === "/tickets" || pathname.startsWith("/tickets/"),
  },
  {
    href: "/admin/articles",
    label: "Manage articles",
    icon: Library,
    isActive: (pathname) => pathname.startsWith("/admin/articles"),
  },
  {
    href: "/kb",
    label: "Knowledge base",
    icon: BookOpen,
    isActive: (pathname) => pathname === "/kb" || pathname.startsWith("/kb/"),
  },
];

export function NavLinks({
  role,
  orientation = "vertical",
  collapsed = false,
  className,
}: {
  role: AppRole;
  orientation?: "vertical" | "horizontal";
  collapsed?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const isVertical = orientation === "vertical";
  const compact = collapsed && isVertical;
  const items = role === "hr" ? hrItems : employeeItems;

  return (
    <nav
      className={cn(
        isVertical
          ? "flex flex-col gap-1"
          : "flex items-center gap-1 overflow-x-auto",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.isActive(pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            title={compact ? item.label : undefined}
            aria-label={compact ? item.label : undefined}
            className={cn(
              "focus-ring flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              compact && "justify-center px-2",
              active
                ? "bg-blue-600 text-white shadow-[0_10px_24px_-14px_rgba(37,99,235,0.9)]"
                : "text-slate-600 hover:bg-white/80 hover:text-slate-900",
            )}
          >
            <Icon
              className={cn("h-4 w-4", active ? "text-white" : "text-slate-400")}
            />
            <span className={compact ? "sr-only" : undefined}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
