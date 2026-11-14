import "server-only";

import { cacheLife } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/backend/supabase/server";
import { isSupabaseConfigured } from "@/backend/supabase/config";
import type { Profile, SessionUser } from "@/backend/types";

type DbClient = Awaited<ReturnType<typeof createClient>>;

const PROFILE_TTL_MS = 60_000;
const profileCache = new Map<
  string,
  { profile: Profile; expiresAt: number }
>();

export type AuthState =
  | { status: "anonymous" }
  | { status: "not_member" }
  | { status: "member"; user: SessionUser };

async function loadProfile(
  supabase: DbClient,
  id: string,
): Promise<Profile | null> {
  const cached = profileCache.get(id);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.profile;
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", id)
    .maybeSingle();

  const profile = (data as Profile | null) ?? null;

  if (profile) {
    profileCache.set(id, {
      profile,
      expiresAt: Date.now() + PROFILE_TTL_MS,
    });
  }

  return profile;
}

export async function getAuthState(): Promise<AuthState> {
  "use cache: private";
  cacheLife("minutes");

  if (!isSupabaseConfigured()) {
    return { status: "anonymous" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();
  const session = data.session;

  if (error || !session?.user) {
    return { status: "anonymous" };
  }

  const id = session.user.id;
  const email = session.user.email ?? "";
  let profile = await loadProfile(supabase, id);

  if (!profile) {
    const { error: ensureError } = await supabase.rpc("ensure_profile");
    if (ensureError) {
      return { status: "not_member" };
    }
    profile = await loadProfile(supabase, id);
  }

  if (!profile) {
    return { status: "not_member" };
  }

  return {
    status: "member",
    user: {
      id,
      email: profile.email || email,
      fullName: profile.full_name || email || "Teammate",
      role: profile.role,
    },
  };
}

export async function requireUser(): Promise<SessionUser> {
  const state = await getAuthState();

  if (state.status === "anonymous") {
    redirect("/login");
  }

  if (state.status === "not_member") {
    redirect("/no-access");
  }

  return state.user;
}

export async function requireHr(): Promise<SessionUser> {
  const user = await requireUser();

  if (user.role !== "hr") {
    redirect("/kb");
  }

  return user;
}
