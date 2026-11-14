import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { LogOut, ShieldX } from "lucide-react";
import { Brand } from "@/frontend/components/brand";
import { Button } from "@/frontend/components/ui";
import { getAuthState } from "@/backend/auth";
import { logout } from "@/backend/actions/auth";

export const metadata: Metadata = {
  title: "No access",
};

export default async function NoAccessPage() {
  await connection();
  const state = await getAuthState();

  if (state.status === "anonymous") {
    redirect("/login");
  }

  if (state.status === "member") {
    redirect("/kb");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="surface-strong w-full max-w-md p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <ShieldX className="h-7 w-7" />
        </div>
        <div className="mt-5">
          <Brand href="/no-access" className="justify-center" />
        </div>
        <h1 className="mt-6 text-xl font-semibold tracking-tight text-slate-900">
          This account is not approved yet
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          You are signed in, but your email is not on the Horizon Crewkit allowlist.
          Ask HR to add you, then sign in again.
        </p>

        <form action={logout} className="mt-6">
          <Button type="submit" variant="secondary" className="w-full">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </main>
  );
}
