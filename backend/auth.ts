import "server-only";

import { combineChunks, stringFromBase64URL } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cacheLife } from "next/cache";
import { redirect } from "next/navigation";
import { getCacheNow } from "@/backend/cache-time";
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
  const now = await getCacheNow();
  const cached = profileCache.get(id);
  if (cached && cached.expiresAt > now) {
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
      expiresAt: now + PROFILE_TTL_MS,
    });
  }

  return profile;
}

async function getAccessToken(): Promise<string | null> {
  const authCookies = (await cookies()).getAll();
  const storageKeys = new Set<string>();

  for (const cookie of authCookies) {
    const match = cookie.name.match(/^(.*-auth-token)(?:\.\d+)?$/);
    if (match) {
      storageKeys.add(match[1]);
    }
  }

  for (const storageKey of storageKeys) {
    const rawValue = await combineChunks(storageKey, (name) =>
      authCookies.find((cookie) => cookie.name === name)?.value ?? null,
    );

    if (!rawValue) {
      continue;
    }

    const value = rawValue.startsWith("base64-")
      ? stringFromBase64URL(rawValue.slice("base64-".length))
      : rawValue;

    try {
      const session = JSON.parse(value) as { access_token?: unknown };
      if (typeof session.access_token === "string") {
        return session.access_token;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function getAuthState(): Promise<AuthState> {
  "use cache: private";
  cacheLife("minutes");

  if (!isSupabaseConfigured()) {
    return { status: "anonymous" };
  }

  const accessToken = await getAccessToken();

  if (!accessToken) {
    return { status: "anonymous" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser(accessToken);
  const user = data.user;

  if (error || !user) {
    return { status: "anonymous" };
  }

  const id = user.id;
  const email = user.email ?? "";
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
