import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // TODO: Replace with real credentials once Supabase project is configured (Phase 1)
    console.warn("Supabase env vars not set — client unavailable.");
    return null;
  }

  return createBrowserClient(url, key);
}
