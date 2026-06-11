// src/lib/services/reports.ts
// Service layer for PROFIT session reports — no direct Supabase in app/ or components/
// Presentation layer calls these functions; never calls Supabase or edge functions directly.

import { apiCall } from "@/lib/apiClient";
import { createClient } from "@/lib/supabase/server";

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
}

export interface HireRightReport {
  id: string;
  session_id: string;
  user_id: string;
  report_data: ReportData;
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
      .select("id, session_id, user_id, report_data, created_at")
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
