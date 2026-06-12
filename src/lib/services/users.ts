// src/lib/services/users.ts
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  referral_code: string | null;
  company_name: string | null;
  industry: string | null;
  team_size: number | null;
  anonymous_mode: boolean;
  created_at: string;
  updated_at: string;
};

// Use untyped client for columns not yet in the generated Database type
// (company_name, industry, team_size, anonymous_mode added by recent migrations).
function untyped(client: Awaited<ReturnType<typeof createClient>>): SupabaseClient {
  return client as unknown as SupabaseClient;
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const _supabase = await createClient();
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) return null;
  const supabase = untyped(_supabase);
  const { data, error } = await supabase
    .from("hr_users")
    .select("id, email, full_name, role, referral_code, company_name, industry, team_size, anonymous_mode, created_at, updated_at")
    .eq("id", user.id)
    .single();
  if (error || !data) return null;
  return data as UserProfile;
}

export async function updateProfile(updates: {
  full_name?: string;
  company_name?: string | null;
  industry?: string | null;
  team_size?: number | null;
  anonymous_mode?: boolean;
}) {
  const _supabase = await createClient();
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) return { error: new Error("Not authenticated") };
  const supabase = untyped(_supabase);
  const { data, error } = await supabase
    .from("hr_users")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("id, email, full_name, role, referral_code, company_name, industry, team_size, anonymous_mode, created_at, updated_at")
    .single();
  return { data, error };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error("Not authenticated") };
  // Data deleted by ON DELETE CASCADE; then delete auth user via admin
  // (must be done in an edge function using the Supabase admin client)
  return { userId: user.id, error: null };
}
