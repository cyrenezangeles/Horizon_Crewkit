import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_SCHEMA, supabaseEnv } from "./config";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = supabaseEnv();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createServerClient<any, typeof SUPABASE_SCHEMA>(url, anonKey, {
    db: { schema: SUPABASE_SCHEMA },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot write cookies. Refreshes are written by
          // Server Actions, where the cookie store is mutable.
        }
      },
    },
  });
}
