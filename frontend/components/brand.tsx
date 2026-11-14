import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { cn } from "@/frontend/lib/utils";

export function CrewkitMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white shadow-[0_10px_22px_-10px_rgba(37,99,235,0.9)]",
        className,
      )}
    >
      <LifeBuoy className="h-[18px] w-[18px]" strokeWidth={2.2} />
    </span>
  );
}

export function Brand({
  href = "/kb",
  compact = false,
  inverted = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  inverted?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <CrewkitMark
        className={inverted ? "bg-white/15 shadow-none ring-1 ring-white/25" : undefined}
      />
      {compact ? null : (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "text-[15px] font-semibold tracking-tight",
              inverted ? "text-white" : "text-slate-900",
            )}
          >
            Horizon Crewkit
          </span>
          <span
            className={cn(
              "mt-1 text-[11px] font-medium uppercase tracking-[0.16em]",
              inverted ? "text-blue-100/80" : "text-blue-600/70",
            )}
          >
            Knowledge hub
          </span>
        </span>
      )}
    </Link>
  );
}
