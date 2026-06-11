// src/lib/services/profit-sessions.ts
// Service layer for PROFIT discovery sessions — no direct Supabase in app/ or components/
// Presentation layer calls these functions; never calls Supabase or edge functions directly.

import { apiCall } from "@/lib/apiClient";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProfitSession {
  id: string;
  user_id: string;
  status: "in_progress" | "completed" | "abandoned";
  current_step: "pinpoint" | "revamp" | "optimize" | "fill" | "implement" | null;
  session_data: Record<string, unknown>;
  report_generated: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfitMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface StartDiscoveryResult {
  session_id: string;
  first_question: string;
}

export interface ContinueDiscoveryResult {
  assistant_message: string;
  current_step: string;
  session_status: string;
  progress: number;
  discovery_complete: boolean;
}

// ---------------------------------------------------------------------------
// Edge function callers (use apiCall — browser-side JWT from session)
// ---------------------------------------------------------------------------

/**
 * Starts a new PROFIT discovery session.
 * Calls hr_start_discovery edge function.
 * Returns 409 error if user already has an in_progress session.
 */
export async function startDiscovery(sessionSource?: string) {
  return apiCall<StartDiscoveryResult>("hr_start_discovery", {
    body: sessionSource ? { session_source: sessionSource } : {},
  });
}

/**
 * Sends a user message in an active PROFIT session and returns the AI response.
 * Calls hr_continue_discovery edge function.
 */
export async function continueDiscovery(sessionId: string, message: string) {
  return apiCall<ContinueDiscoveryResult>("hr_continue_discovery", {
    body: {
      session_id: sessionId,
      user_message: message,
    },
  });
}

// ---------------------------------------------------------------------------
// DB reads (use createClient from server — RLS-scoped server-side queries)
// ---------------------------------------------------------------------------

/**
 * Returns all PROFIT sessions for the authenticated user.
 * Ordered by most recently updated.
 */
export async function getSessions(): Promise<{
  data: ProfitSession[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("hr_profit_sessions")
      .select(
        "id, user_id, status, current_step, session_data, report_generated, completed_at, created_at, updated_at"
      )
      .order("updated_at", { ascending: false });

    if (error) {
      return { data: null, error: "Failed to load sessions" };
    }
    return { data: data as ProfitSession[], error: null };
  } catch {
    return { data: null, error: "Failed to load sessions" };
  }
}

/**
 * Returns a single PROFIT session by ID.
 * RLS ensures the user can only access their own sessions.
 */
export async function getSession(sessionId: string): Promise<{
  data: ProfitSession | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("hr_profit_sessions")
      .select(
        "id, user_id, status, current_step, session_data, report_generated, completed_at, created_at, updated_at"
      )
      .eq("id", sessionId)
      .single();

    if (error) {
      return { data: null, error: "Session not found" };
    }
    return { data: data as ProfitSession, error: null };
  } catch {
    return { data: null, error: "Session not found" };
  }
}

/**
 * Returns all completed sessions for the current user, each joined with its
 * report data. Used for the session history comparison view (US-011).
 */
export async function getSessionsWithReports(): Promise<{
  data: Array<ProfitSession & { report_data: Record<string, unknown> | null }> | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("hr_profit_sessions")
      .select(
        "id, user_id, status, current_step, session_data, report_generated, completed_at, created_at, updated_at, hr_reports(report_data)"
      )
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    if (error) {
      return { data: null, error: "Failed to load session history" };
    }

    type RowWithReport = ProfitSession & {
      hr_reports: { report_data: Record<string, unknown> } | { report_data: Record<string, unknown> }[] | null;
    };

    const mapped = ((data ?? []) as RowWithReport[]).map((row) => {
      const reportsArr = Array.isArray(row.hr_reports)
        ? row.hr_reports
        : row.hr_reports
        ? [row.hr_reports]
        : [];
      const report = reportsArr[0] ?? null;
      return {
        ...row,
        report_data: report ? (report.report_data as Record<string, unknown>) : null,
      };
    });

    return { data: mapped, error: null };
  } catch {
    return { data: null, error: "Failed to load session history" };
  }
}

/**
 * Returns all messages for a PROFIT session in chronological order.
 * RLS ensures the user can only access messages in their own sessions.
 */
export async function getMessages(sessionId: string): Promise<{
  data: ProfitMessage[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("hr_profit_messages")
      .select("id, session_id, role, content, metadata, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      return { data: null, error: "Failed to load messages" };
    }
    return { data: data as ProfitMessage[], error: null };
  } catch {
    return { data: null, error: "Failed to load messages" };
  }
}
