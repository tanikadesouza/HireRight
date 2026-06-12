// src/lib/services/users.ts
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface NotificationPreferences {
  session_complete: boolean;
  followup_14d: boolean;
  followup_6mo: boolean;
  marketing: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  session_complete: true,
  followup_14d: true,
  followup_6mo: true,
  marketing: false,
};

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
  notification_preferences: NotificationPreferences;
  created_at: string;
  updated_at: string;
};

// Use untyped client for columns not yet in the generated Database type
// (company_name, industry, team_size, anonymous_mode added by recent migrations).
function untyped(client: Awaited<ReturnType<typeof createClient>>): SupabaseClient {
  return client as unknown as SupabaseClient;
}

const PROFILE_COLUMNS =
  "id, email, full_name, role, referral_code, company_name, industry, team_size, anonymous_mode, notification_preferences, created_at, updated_at";

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const _supabase = await createClient();
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) return null;
  const supabase = untyped(_supabase);
  const { data, error } = await supabase
    .from("hr_users")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .single();
  if (error || !data) return null;
  const profile = data as UserProfile;
  // Ensure notification_preferences has all keys (backfill for existing rows)
  profile.notification_preferences = {
    ...DEFAULT_NOTIFICATION_PREFS,
    ...(profile.notification_preferences ?? {}),
  };
  return profile;
}

export async function updateProfile(updates: {
  full_name?: string;
  company_name?: string | null;
  industry?: string | null;
  team_size?: number | null;
  anonymous_mode?: boolean;
  notification_preferences?: Partial<NotificationPreferences>;
}) {
  const _supabase = await createClient();
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) return { error: new Error("Not authenticated") };
  const supabase = untyped(_supabase);

  // For notification_preferences, merge with existing rather than replace
  let payload: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
  if (updates.notification_preferences) {
    // Get current prefs first, then merge
    const { data: existing } = await supabase
      .from("hr_users")
      .select("notification_preferences")
      .eq("id", user.id)
      .single();
    const currentPrefs = (existing as { notification_preferences: NotificationPreferences } | null)
      ?.notification_preferences ?? DEFAULT_NOTIFICATION_PREFS;
    payload = {
      ...payload,
      notification_preferences: { ...currentPrefs, ...updates.notification_preferences },
    };
  }

  const { data, error } = await supabase
    .from("hr_users")
    .update(payload)
    .eq("id", user.id)
    .select(PROFILE_COLUMNS)
    .single();
  return { data, error };
}

export async function updateNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<{ error: string | null }> {
  const result = await updateProfile({ notification_preferences: prefs });
  if (result.error) return { error: "Failed to update notification preferences" };
  return { error: null };
}

const VALID_UNSUB_KEYS = new Set(["followup_14d", "followup_6mo", "marketing"]);

export async function unsubscribeUser(
  userId: string,
  prefKey: string
): Promise<{ error: string | null }> {
  if (!VALID_UNSUB_KEYS.has(prefKey)) return { error: "Invalid preference key" };

  const _supabase = await createClient();
  const supabase = untyped(_supabase);

  const { error } = await supabase.rpc("hr_unsubscribe_from_emails", {
    p_user_id: userId,
    p_pref_key: prefKey,
  });

  if (error) return { error: "Failed to process unsubscribe" };
  return { error: null };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error("Not authenticated") };
  // Data deleted by ON DELETE CASCADE; then delete auth user via admin
  // (must be done in an edge function using the Supabase admin client)
  return { userId: user.id, error: null };
}
