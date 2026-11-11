import { createClient } from "@supabase/supabase-js";
import { env, serviceRoleKey } from "@/lib/env";
import type { Database } from "@/lib/db/types";

/** Service-role client. Server-only. Bypasses RLS — use after requireStaff checks. */
export function createAdminClient() {
  return createClient<Database>(env.supabaseUrl, serviceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
