import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for auth admin operations (inviting / removing portal
 * logins). Bypasses RLS — only use it inside server actions, after checking the
 * caller is allowed to do what they're asking. Returns null when the key isn't
 * configured so callers can show a clear error.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
