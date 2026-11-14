"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/backend/supabase/server";
import { isSupabaseConfigured } from "@/backend/supabase/config";

export async function logout() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
