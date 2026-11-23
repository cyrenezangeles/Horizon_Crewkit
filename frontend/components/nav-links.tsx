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
];

export function NavLinks({
  role,
  orientation = "vertical",
  collapsed = false,
  inverted = false,
  className,
}: {
  role: AppRole;
  orientation?: "vertical" | "horizontal" | "bottom";
  collapsed?: boolean;
  inverted?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const isVertical = orientation === "vertical";
  const isBottom = orientation === "bottom";
  const compact = collapsed && isVertical;
  const items = role === "hr" ? hrItems : employeeItems;

  return (
    <nav
      className={cn(
        isVertical
          ? "flex flex-col gap-1"
          : isBottom
            ? "flex items-center justify-around gap-1"
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
              "focus-ring shrink-0 rounded-xl font-medium transition",
              isBottom
                ? "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] leading-none"
                : "flex items-center gap-2.5 px-3 py-2.5 text-sm",
              compact && "justify-center px-2",
              active
                ? inverted
                  ? "bg-white text-blue-700 shadow-[0_10px_24px_-14px_rgba(15,23,42,0.65)]"
                  : "bg-blue-600 text-white shadow-[0_10px_24px_-14px_rgba(37,99,235,0.9)]"
                : inverted
                  ? "text-blue-100 hover:bg-white/15 hover:text-white"
                  : "text-slate-600 hover:bg-white/80 hover:text-slate-900",
            )}
          >
            <Icon
              className={cn(
                isBottom ? "h-5 w-5" : "h-4 w-4",
                active
                  ? inverted
                    ? "text-blue-700"
                    : "text-white"
                  : inverted
                    ? "text-blue-200"
                    : "text-slate-400",
              )}
            />
            <span
              className={cn(
                compact && "sr-only",
                isBottom && "max-w-full truncate text-center",
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
