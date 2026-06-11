// src/lib/services/users.ts
import { createClient } from "@/lib/supabase/server";

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  referral_code: string | null;
  created_at: string;
  updated_at: string;
};

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("hr_users")
    .select("id, email, full_name, role, referral_code, created_at, updated_at")
    .eq("id", user.id)
    .single();
  if (error || !data) return null;
  return data as UserProfile;
}

export async function updateProfile(updates: { full_name?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error("Not authenticated") };
  const { data, error } = await supabase
    .from("hr_users")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("id, email, full_name, role, referral_code, created_at, updated_at")
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
