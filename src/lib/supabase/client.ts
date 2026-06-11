// =============================================================================
// BROWSER SUPABASE CLIENT — cookie-based via @supabase/ssr
// =============================================================================
// Rule (CLAUDE.md §31): ALWAYS use createBrowserClient from @supabase/ssr.
// NEVER use createClient from @supabase/supabase-js directly in browser code —
// that variant uses localStorage which middleware cannot read.
// =============================================================================
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
