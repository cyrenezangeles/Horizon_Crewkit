import type { Metadata } from "next";
import { BookOpenCheck, LifeBuoy, ShieldCheck } from "lucide-react";
import { Brand, CrewkitMark } from "@/frontend/components/brand";
import { isSupabaseConfigured } from "@/backend/supabase/config";
import { LoginForm } from "@/frontend/components/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <main className="flex min-h-dvh">
      <section className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-10 left-0 h-48 w-48 rounded-full bg-sky-300/20 blur-2xl" />
          <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:36px_36px]" />
        </div>

        <Brand href="/login" inverted className="relative" />

        <div className="relative space-y-7">
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Everything your team needs, in one calm place.
          </h1>
          <p className="max-w-md text-base leading-relaxed text-blue-100/90">
            Your central employee knowledge hub for instant company answers,
            SOPs, and internal support.
          </p>
          <ul className="space-y-4 text-base text-blue-50/90">
            <li className="flex items-center gap-3">
              <BookOpenCheck               className="h-5 w-5 shrink-0 text-blue-200" />
              Curated articles for HR, IT, and finance
            </li>
            <li className="flex items-center gap-3">
              <LifeBuoy               className="h-5 w-5 shrink-0 text-blue-200" />
              Private tickets with threaded replies
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck               className="h-5 w-5 shrink-0 text-blue-200" />
              Invite-only access for employees
            </li>
          </ul>
        </div>

        <p className="relative text-sm text-blue-200/80">
          Horizon Crewkit &middot; Employee knowledge hub
        </p>
      </section>

      <section className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <CrewkitMark />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Horizon Crewkit
              </p>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-blue-600/70">
                Knowledge hub
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
              Welcome back
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              Sign in to Horizon Crewkit
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Use your work email and password to continue.
            </p>
          </div>

          {configured ? (
            <LoginForm next={next ?? ""} />
          ) : (
            <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
              <p className="font-semibold">Supabase is not configured yet.</p>
              <p>
                Copy <code className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-xs">.env.example</code>{" "}
                to <code className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-xs">.env.local</code>{" "}
                and add your project URL and anon key. Then run the SQL in{" "}
                <code className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-xs">supabase/migrations</code>.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
