// src/lib/services/referrals.ts
// Service layer for the HireRight referral program (US-026).

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface Referral {
  id: string;
  referrer_id: string;
  referee_email: string;
  referee_id: string | null;
  status: "pending" | "signed_up" | "completed_session" | "converted";
  created_at: string;
  completed_at: string | null;
}

// hr_referrals is not yet in the generated DB types — use untyped client
function untyped(client: Awaited<ReturnType<typeof createClient>>): SupabaseClient {
  return client as unknown as SupabaseClient;
}

/**
 * Returns the authenticated user's referrals with aggregate stats.
 */
export async function getMyReferrals(): Promise<{
  data: {
    referrals: Referral[];
    total: number;
    signed_up: number;
    completed: number;
  } | null;
  error: string | null;
}> {
  try {
    const supabase = untyped(await createClient());
    const {
      data: { user },
    } = await (await createClient()).auth.getUser();

    if (!user) return { data: null, error: "Not authenticated" };

    const { data, error } = await supabase
      .from("hr_referrals")
      .select("id, referrer_id, referee_email, referee_id, status, created_at, completed_at")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: "Failed to load referrals" };
    }

    const referrals = (data ?? []) as Referral[];
    return {
      data: {
        referrals,
        total: referrals.length,
        signed_up: referrals.filter((r) => r.status !== "pending").length,
        completed: referrals.filter(
          (r) => r.status === "completed_session" || r.status === "converted"
        ).length,
      },
      error: null,
    };
  } catch {
    return { data: null, error: "Failed to load referrals" };
  }
}

/**
 * Gets the current user's referral code from their hr_users row.
 */
export async function getMyReferralCode(): Promise<{
  data: string | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Not authenticated" };

    const { data, error } = await supabase
      .from("hr_users")
      .select("referral_code")
      .eq("id", user.id)
      .single();

    if (error || !data) return { data: null, error: "Failed to load referral code" };
    return { data: data.referral_code, error: null };
  } catch {
    return { data: null, error: "Failed to load referral code" };
  }
}

/**
 * Records a new referral when a referred user signs up.
 * Called from the signup Server Action when hr_referral_code cookie is present.
 * Uses service-role context via a Route Handler — this function is server-only.
 */
export async function recordReferralSignup(
  referrerCode: string,
  refereeEmail: string,
  refereeUserId: string
): Promise<void> {
  try {
    const supabase = await createClient();

    // Find the referrer by their referral code
    const { data: referrer } = await supabase
      .from("hr_users")
      .select("id")
      .eq("referral_code", referrerCode)
      .single();

    if (!referrer) return; // Code not found — no-op

    const untypedClient = untyped(supabase);
    await untypedClient.from("hr_referrals").insert({
      referrer_id: referrer.id,
      referee_email: refereeEmail,
      referee_id: refereeUserId,
      status: "signed_up",
    });
  } catch {
    // Non-fatal — referral tracking failure should never block signup
  }
}
