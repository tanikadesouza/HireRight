// src/lib/services/reports.ts
// Service layer for PROFIT session reports — no direct Supabase in app/ or components/
// Presentation layer calls these functions; never calls Supabase or edge functions directly.

import { apiCall } from "@/lib/apiClient";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Use untyped client for hr_hiring_stage (not yet in generated Database type)
function untyped(client: Awaited<ReturnType<typeof createClient>>): SupabaseClient {
  return client as unknown as SupabaseClient;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RecommendedRole {
  title: string;
  type: "full_time" | "fractional" | "contractor";
  responsibilities: string[];
  required_skills: string[];
  salary_range: string;
}

export interface InterviewQuestions {
  behavioral: string[];
  situational: string[];
  culture_fit: string[];
}

export interface OnboardingPlan {
  week_1: string;
  weeks_2_4: string;
  month_2: string;
  month_3: string;
}

export interface FinancialModel {
  base_salary: number;
  benefits_pct: number;
  tools_cost: number;
  mgmt_hours: number;
  your_hourly_rate: number;
  expected_revenue: number;
}

export interface ReportData {
  executive_summary: string;
  business_goal: string;
  current_team: string;
  gaps_identified: string;
  recommended_role: RecommendedRole;
  alignment_rationale: string;
  next_actions: string[];
  red_flags: string[];
  internal_candidate_note: string | null;
  confidence_score: number;
  job_description: string | null;
  interview_questions: InterviewQuestions | null;
  onboarding_plan: OnboardingPlan | null;
  financial_model?: FinancialModel | null;
}

export interface HireRightReport {
  id: string;
  session_id: string;
  user_id: string;
  report_data: ReportData;
  share_token: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Edge function callers (use apiCall — browser-side JWT from session)
// ---------------------------------------------------------------------------

/**
 * Calls hr_generate_report edge function to generate a report for the session.
 * Returns the structured report data.
 */
export async function generateReport(sessionId: string) {
  return apiCall<ReportData>("hr_generate_report", {
    body: { session_id: sessionId },
  });
}

// ---------------------------------------------------------------------------
// DB reads (use createClient from server — RLS-scoped server-side queries)
// ---------------------------------------------------------------------------

/**
 * Returns the report for a given session ID.
 * RLS ensures the user can only access their own reports.
 */
export async function getReport(sessionId: string): Promise<{
  data: HireRightReport | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("hr_reports")
      .select("id, session_id, user_id, report_data, share_token, created_at")
      .eq("session_id", sessionId)
      .single();

    if (error) {
      // PGRST116 = no rows found — not an error, just no report yet
      if (error.code === "PGRST116") {
        return { data: null, error: null };
      }
      return { data: null, error: "Failed to load report" };
    }
    return { data: data as HireRightReport, error: null };
  } catch {
    return { data: null, error: "Failed to load report" };
  }
}

/**
 * Alias for getReport — returns the report for a given session.
 */
export async function getReportBySession(sessionId: string): Promise<{
  data: HireRightReport | null;
  error: string | null;
}> {
  return getReport(sessionId);
}

// ---------------------------------------------------------------------------
// Hiring Stage tracker (US-034 adjacent)
// ---------------------------------------------------------------------------

export type HiringStage =
  | "drafting_jd"
  | "posted"
  | "shortlisting"
  | "interviewing"
  | "offer_made"
  | "hired";

export interface HiringStageRecord {
  id: string;
  session_id: string;
  user_id: string;
  stage: HiringStage;
  notes: string | null;
  updated_at: string;
  created_at: string;
}

export const HIRING_STAGE_LABELS: Record<HiringStage, string> = {
  drafting_jd:  "Drafting JD",
  posted:       "Posted",
  shortlisting: "Shortlisting",
  interviewing: "Interviewing",
  offer_made:   "Offer Made",
  hired:        "Hired!",
};

export const HIRING_STAGES: HiringStage[] = [
  "drafting_jd",
  "posted",
  "shortlisting",
  "interviewing",
  "offer_made",
  "hired",
];

/**
 * Returns the current hiring stage record for a session (if any).
 */
export async function getHiringStage(sessionId: string): Promise<{
  data: HiringStageRecord | null;
  error: string | null;
}> {
  try {
    const supabase = untyped(await createClient());
    const { data, error } = await supabase
      .from("hr_hiring_stage")
      .select("id, session_id, user_id, stage, notes, updated_at, created_at")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (error) return { data: null, error: "Failed to load hiring stage" };
    return { data: data as HiringStageRecord | null, error: null };
  } catch {
    return { data: null, error: "Failed to load hiring stage" };
  }
}

/**
 * Returns a map of sessionId → HiringStageRecord for a list of session IDs.
 * Used by the dashboard to show hiring progress without N+1 queries.
 */
export async function getHiringStagesMap(
  sessionIds: string[]
): Promise<Map<string, HiringStageRecord>> {
  if (sessionIds.length === 0) return new Map();
  try {
    const supabase = untyped(await createClient());
    const { data, error } = await supabase
      .from("hr_hiring_stage")
      .select("id, session_id, user_id, stage, notes, updated_at, created_at")
      .in("session_id", sessionIds);

    if (error || !data) return new Map();

    const map = new Map<string, HiringStageRecord>();
    for (const row of data as HiringStageRecord[]) {
      map.set(row.session_id, row);
    }
    return map;
  } catch {
    return new Map();
  }
}

/**
 * Looks up a report by its public share token (no auth required).
 * Calls the hr_get_report_by_share_token SECURITY DEFINER RPC so the anon
 * Supabase client can bypass RLS. user_id is intentionally NOT returned.
 */
export async function getReportByShareToken(shareToken: string): Promise<{
  data: Omit<HireRightReport, "user_id" | "share_token"> | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await (supabase as unknown as SupabaseClient)
      .rpc("hr_get_report_by_share_token", { p_token: shareToken });

    if (error) return { data: null, error: "Failed to load report" };
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return { data: null, error: null };
    }

    const row = Array.isArray(data) ? data[0] : data;
    return {
      data: row as Omit<HireRightReport, "user_id" | "share_token">,
      error: null,
    };
  } catch {
    return { data: null, error: "Failed to load report" };
  }
}

/**
 * Merges financial model inputs into the report's report_data JSONB field.
 * Called with a debounce from FinancialCalculator when the user adjusts inputs.
 * Admin can see the saved values in the session detail view.
 */
export async function saveFinancialModel(
  sessionId: string,
  model: FinancialModel
): Promise<{ error: string | null }> {
  try {
    const _supabase = await createClient();
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const supabase = untyped(_supabase);
    const { error } = await supabase.rpc("hr_save_financial_model", {
      p_session_id: sessionId,
      p_user_id: user.id,
      p_model: model,
    });

    if (error) return { error: "Failed to save financial model" };
    return { error: null };
  } catch {
    return { error: "Failed to save financial model" };
  }
}

/**
 * Upserts the hiring stage for a session.
 */
export async function upsertHiringStage(
  sessionId: string,
  stage: HiringStage,
  notes?: string
): Promise<{ error: string | null }> {
  try {
    const _supabase = await createClient();
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const supabase = untyped(_supabase);
    const { error } = await supabase
      .from("hr_hiring_stage")
      .upsert(
        {
          session_id: sessionId,
          user_id: user.id,
          stage,
          notes: notes ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "session_id" }
      );

    if (error) return { error: "Failed to update hiring stage" };
    return { error: null };
  } catch {
    return { error: "Failed to update hiring stage" };
  }
}
