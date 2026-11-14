"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/backend/supabase/server";
import { isSupabaseConfigured } from "@/backend/supabase/config";

export type LoginState = {
  error?: string;
};

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase is not configured yet. Copy .env.example to .env.local and add your project keys.",
    };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rawNext = String(formData.get("next") ?? "");
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : null;

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (signInError) {
    return { error: "Incorrect email or password." };
  }

  if (!signInData.user) {
    return { error: "Incorrect email or password." };
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (memberError) {
    await supabase.auth.signOut();
    return { error: "We could not verify your access. Please try again." };
  }

  if (!member) {
    await supabase.auth.signOut();
    return {
      error:
        "This account is not on the Horizon Crewkit allowlist yet. Ask HR to add your email.",
    };
  }

  const { error: profileError } = await supabase.rpc("ensure_profile");

  if (profileError) {
    await supabase.auth.signOut();
    return {
      error:
        "We could not prepare your profile. Ask HR to check your allowlist entry.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", signInData.user.id)
    .maybeSingle();

  const fallback = profile?.role === "hr" ? "/admin" : "/kb";

  redirect(next ?? fallback);
}
