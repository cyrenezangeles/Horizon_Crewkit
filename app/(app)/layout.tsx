import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { Brand } from "@/frontend/components/brand";
import { requireUser } from "@/backend/auth";
import { logout } from "@/backend/actions/auth";
import { initials } from "@/frontend/lib/utils";
import { NavLinks } from "@/frontend/components/nav-links";
import { Sidebar } from "@/frontend/components/sidebar";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1600px]">
      <Suspense fallback={<SidebarSkeleton />}>
        <SidebarSection />
      </Suspense>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="lg:hidden">
              <Brand compact />
            </div>

            <form
              action="/kb"
              className="relative ml-auto hidden w-full max-w-sm sm:block lg:ml-0"
            >
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                name="q"
                placeholder="Search articles, tags, topics..."
                className="focus-ring w-full rounded-xl border border-slate-200 bg-white/80 py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-400"
              />
            </form>

            <Link
              href="/kb"
              aria-label="Search the knowledge base"
              className="focus-ring ml-auto rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-500 transition hover:text-blue-600 sm:hidden"
            >
              <Search className="h-4 w-4" />
            </Link>

            <Suspense fallback={<HeaderUserSkeleton />}>
              <HeaderUser />
            </Suspense>
          </div>

          <div className="border-t border-white/60 px-4 pb-2 pt-2 sm:px-6 lg:hidden">
            <Suspense fallback={<div className="h-[46px]" />}>
              <MobileNav />
            </Suspense>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>

        <footer className="border-t border-white/60 px-4 py-5 text-xs text-slate-400 sm:px-6 lg:px-8">
          Horizon Crewkit &middot; Built for fast answers and calmer support.
        </footer>
      </div>
    </div>
  );
}

async function SidebarSection() {
  const user = await requireUser();
  return <Sidebar role={user.role} />;
}

async function HeaderUser() {
  const user = await requireUser();

  return (
    <form action={logout} className="ml-auto shrink-0">
      <button
        type="submit"
        title="Sign out"
        aria-label="Sign out"
        className="focus-ring flex items-center gap-2 rounded-full p-1 transition hover:opacity-75"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white">
          {initials(user.fullName)}
        </span>
        <span className="hidden max-w-32 truncate text-sm font-medium text-slate-700 sm:block">
          {user.fullName}
        </span>
      </button>
    </form>
  );
}

async function MobileNav() {
  const user = await requireUser();
  return <NavLinks role={user.role} orientation="horizontal" />;
}

function SidebarSkeleton() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-white/70 px-4 py-6 lg:flex">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-slate-200/70" />
        <div className="h-7 w-7 animate-pulse rounded-lg bg-slate-200/70" />
      </div>
      <div className="mt-8 space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-10 animate-pulse rounded-xl bg-slate-200/70"
          />
        ))}
      </div>
    </aside>
  );
}

function HeaderUserSkeleton() {
  return (
    <div className="ml-auto flex shrink-0 items-center gap-2 p-1">
      <span className="h-8 w-8 animate-pulse rounded-full bg-slate-200/70" />
      <span className="hidden h-4 w-24 animate-pulse rounded bg-slate-200/70 sm:block" />
    </div>
  );
}
