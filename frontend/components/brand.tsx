import Image from "next/image";
import Link from "next/link";
import horizonLogo from "../../logo pic/logo.png";
import { cn } from "@/frontend/lib/utils";

export function CrewkitMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white shadow-[0_10px_22px_-10px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/70",
        className,
      )}
    >
      <Image
        src={horizonLogo}
        alt="Horizon Crewkit"
        className="h-full w-full object-contain"
      />
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
      <CrewkitMark />
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
