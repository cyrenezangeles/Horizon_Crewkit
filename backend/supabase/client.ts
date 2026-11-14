"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_SCHEMA, supabaseEnv } from "./config";

export function createClient() {
  const { url, anonKey } = supabaseEnv();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createBrowserClient<any, typeof SUPABASE_SCHEMA>(url, anonKey, {
    db: { schema: SUPABASE_SCHEMA },
  });
}
