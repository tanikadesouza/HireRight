// =============================================================================
// hr_followup_cron — Daily cron: automated follow-up emails for sessions
// =============================================================================
// Runs daily at 09:00 UTC.
// Handles two sequences:
//
//   US-024 Completed sessions:
//     Day 1 — "Here's your report + what founders do next"
//     Day 3 — "Are you moving forward with this hire?"
//     Day 7 — "Case study: someone with a similar gap"
//
//   US-025 Abandoned sessions (in_progress, no activity 24h+):
//     Day 1 — "You're 60% through — finish in 4 minutes"
//     Day 3 — "Still thinking? Book a quick call instead"
//
// Follow-up state is stored in session_data.followup (JSONB) to avoid a
// separate tracking table. Shape:
//   { completed_d1: ISO | null, completed_d3: ISO | null, completed_d7: ISO | null,
//     abandoned_d1: ISO | null, abandoned_d3: ISO | null }
//
// Middleware: No auth required (invoked by Supabase cron scheduler, not users).
//             Uses service_role for all DB access.
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { startJobRun, completeJobRun } from "../_shared/job-logger.ts";
import { logError } from "../_shared/error-logger.ts";

const RESEND_FROM = "HireRight <noreply@hireright.app>";
const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "https://hireright.app";

interface FollupState {
  completed_d1?: string | null;
  completed_d3?: string | null;
  completed_d7?: string | null;
  abandoned_d1?: string | null;
  abandoned_d3?: string | null;
}

interface SessionRow {
  id: string;
  user_id: string;
  status: string;
  completed_at: string | null;
  updated_at: string;
  session_data: Record<string, unknown>;
  user: { email: string; full_name: string | null } | null;
}

function daysSince(isoDate: string): number {
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24);
}

async function sendEmail(
  resendKey: string,
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: RESEND_FROM, to, subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function buildCompletedD1Html(name: string, sessionId: string, roleTitle: string): string {
  const reportUrl = `${APP_URL}/reports/${sessionId}`;
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:#1d4ed8;padding:20px 32px"><p style="color:#fff;font-weight:700;margin:0;font-size:16px">HireRight</p></div>
    <div style="padding:32px">
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Hi ${name},</p>
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Your strategic hiring roadmap for <strong>${roleTitle}</strong> is ready. Here's what most founders do next:</p>
      <ol style="color:#374151;font-size:14px;padding-left:20px;margin:0 0 24px">
        <li style="margin-bottom:8px">Share the report with your business partner or team</li>
        <li style="margin-bottom:8px">Run the Financial Reality Check inside the report to model fully-loaded costs</li>
        <li style="margin-bottom:8px">Book a 30-min call with Tanika to discuss next steps</li>
      </ol>
      <a href="${reportUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">View Your Report →</a>
    </div>
    <div style="border-top:1px solid #f3f4f6;padding:16px 32px"><p style="color:#9ca3af;font-size:12px;margin:0">HireRight — Strategic Hiring Clarity</p></div>
  </div>`;
}

function buildCompletedD3Html(name: string, sessionId: string): string {
  const reportUrl = `${APP_URL}/reports/${sessionId}`;
  const calendlyUrl = "https://calendly.com/hireright/discovery";
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:#1d4ed8;padding:20px 32px"><p style="color:#fff;font-weight:700;margin:0;font-size:16px">HireRight</p></div>
    <div style="padding:32px">
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Hi ${name},</p>
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Quick check-in — are you moving forward with your hire, or still thinking it through?</p>
      <p style="color:#374151;font-size:15px;margin:0 0 24px">Either way, I want to make sure you have what you need. Reply to this email with where you're at, or book a quick call to talk it through.</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <a href="${reportUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:600;font-size:14px;padding:12px 20px;border-radius:10px;text-decoration:none;margin-right:8px">View My Report</a>
        <a href="${calendlyUrl}" style="display:inline-block;background:#fff;color:#374151;font-weight:600;font-size:14px;padding:12px 20px;border-radius:10px;text-decoration:none;border:1px solid #d1d5db">Book a Call</a>
      </div>
    </div>
    <div style="border-top:1px solid #f3f4f6;padding:16px 32px"><p style="color:#9ca3af;font-size:12px;margin:0">HireRight — Strategic Hiring Clarity</p></div>
  </div>`;
}

function buildCompletedD7Html(name: string): string {
  const calendlyUrl = "https://calendly.com/hireright/discovery";
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:#1d4ed8;padding:20px 32px"><p style="color:#fff;font-weight:700;margin:0;font-size:16px">HireRight</p></div>
    <div style="padding:32px">
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Hi ${name},</p>
      <p style="color:#374151;font-size:15px;margin:0 0 16px">A founder in a similar situation — scaling a consulting practice with a team of 8 — used the PROFIT method to identify that what they really needed was an Operations Manager, not another consultant.</p>
      <p style="color:#374151;font-size:15px;margin:0 0 16px">18 months later, revenue is up 40% and the founder is out of day-to-day delivery for the first time in 5 years.</p>
      <p style="color:#374151;font-size:15px;margin:0 0 24px">Your roadmap is waiting. Let's talk about what implementation looks like for you.</p>
      <a href="${calendlyUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">Book a Strategy Call →</a>
    </div>
    <div style="border-top:1px solid #f3f4f6;padding:16px 32px"><p style="color:#9ca3af;font-size:12px;margin:0">HireRight — Strategic Hiring Clarity</p></div>
  </div>`;
}

function buildAbandonedD1Html(name: string, sessionId: string): string {
  const resumeUrl = `${APP_URL}/discovery/${sessionId}`;
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:#1d4ed8;padding:20px 32px"><p style="color:#fff;font-weight:700;margin:0;font-size:16px">HireRight</p></div>
    <div style="padding:32px">
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Hi ${name},</p>
      <p style="color:#374151;font-size:15px;margin:0 0 16px">You're partway through your PROFIT discovery — your progress is saved and you can pick up right where you left off.</p>
      <p style="color:#374151;font-size:15px;margin:0 0 24px">Most founders finish in under 4 minutes from where you are. Your strategic hiring roadmap is waiting on the other side.</p>
      <a href="${resumeUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">Continue My Discovery →</a>
    </div>
    <div style="border-top:1px solid #f3f4f6;padding:16px 32px"><p style="color:#9ca3af;font-size:12px;margin:0">HireRight — Strategic Hiring Clarity</p></div>
  </div>`;
}

function buildAbandonedD3Html(name: string): string {
  const calendlyUrl = "https://calendly.com/hireright/discovery";
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:#1d4ed8;padding:20px 32px"><p style="color:#fff;font-weight:700;margin:0;font-size:16px">HireRight</p></div>
    <div style="padding:32px">
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Hi ${name},</p>
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Still thinking about your next hire? Sometimes it's easier to talk it through than fill out a form.</p>
      <p style="color:#374151;font-size:15px;margin:0 0 24px">Book a quick 30-minute call with Tanika. We can walk through the PROFIT method live and get you the clarity you need — no prep required.</p>
      <a href="${calendlyUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">Book a Quick Call →</a>
    </div>
    <div style="border-top:1px solid #f3f4f6;padding:16px 32px"><p style="color:#9ca3af;font-size:12px;margin:0">HireRight — Strategic Hiring Clarity</p></div>
  </div>`;
}

Deno.serve(async (req: Request): Promise<Response> => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  const headers = corsHeaders(req);

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const resendConfigured = resendKey && !resendKey.startsWith("placeholder");

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const runId = await startJobRun(serviceClient, "hr_followup_cron");

  let emailsSent = 0;
  let errors = 0;

  try {
    // -------------------------------------------------------------------------
    // Load sessions needing follow-up: completed in last 14 days OR
    // in_progress with last update > 24 hours ago
    // -------------------------------------------------------------------------
    const cutoffDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const { data: sessions, error: fetchError } = await serviceClient
      .from("hr_profit_sessions")
      .select(`
        id, user_id, status, completed_at, updated_at, session_data,
        user:hr_users(email, full_name)
      `)
      .or(
        `and(status.eq.completed,completed_at.gte.${cutoffDate}),` +
        `and(status.eq.in_progress,updated_at.lte.${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()})`
      );

    if (fetchError) {
      await logError(serviceClient, {
        functionName: "hr_followup_cron",
        errorMessage: "Failed to fetch sessions",
        errorDetail: fetchError.message,
        severity: "error",
      });
      await completeJobRun(serviceClient, runId, "failure", undefined, fetchError.message);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    for (const rawSession of (sessions ?? []) as SessionRow[]) {
      const session = rawSession;
      const userEmail = session.user?.email;
      const userName = session.user?.full_name ?? "there";

      if (!userEmail) continue;

      const sessionData = session.session_data ?? {};
      const followup: FollupState = (sessionData.followup as FollupState) ?? {};
      const updates: FollupState = {};

      try {
        // -----------------------------------------------------------------------
        // Completed session follow-ups
        // -----------------------------------------------------------------------
        if (session.status === "completed" && session.completed_at) {
          const daysSinceComplete = daysSince(session.completed_at);

          // Day 1 — send if ≥1 day since completion and not sent yet
          if (daysSinceComplete >= 1 && !followup.completed_d1) {
            const roleTitle = String(
              (sessionData.recommended_role as Record<string, unknown>)?.title ?? "Strategic Role"
            );

            if (resendConfigured) {
              const ok = await sendEmail(
                resendKey,
                userEmail,
                `Your HireRight Roadmap — ${roleTitle}`,
                buildCompletedD1Html(userName, session.id, roleTitle)
              );
              if (ok) emailsSent++;
              else errors++;
            } else {
              emailsSent++; // count as "would have sent"
            }
            updates.completed_d1 = new Date().toISOString();
          }

          // Day 3
          if (daysSinceComplete >= 3 && !followup.completed_d3) {
            if (resendConfigured) {
              const ok = await sendEmail(
                resendKey,
                userEmail,
                "Quick check-in — are you moving forward with your hire?",
                buildCompletedD3Html(userName, session.id)
              );
              if (ok) emailsSent++;
              else errors++;
            } else {
              emailsSent++;
            }
            updates.completed_d3 = new Date().toISOString();
          }

          // Day 7
          if (daysSinceComplete >= 7 && !followup.completed_d7) {
            if (resendConfigured) {
              const ok = await sendEmail(
                resendKey,
                userEmail,
                "A story about a founder in your exact situation",
                buildCompletedD7Html(userName)
              );
              if (ok) emailsSent++;
              else errors++;
            } else {
              emailsSent++;
            }
            updates.completed_d7 = new Date().toISOString();
          }
        }

        // -----------------------------------------------------------------------
        // Abandoned session follow-ups (in_progress, idle > 24h)
        // -----------------------------------------------------------------------
        if (session.status === "in_progress") {
          const daysSinceUpdate = daysSince(session.updated_at);

          // Day 1 (24h after last activity)
          if (daysSinceUpdate >= 1 && !followup.abandoned_d1) {
            if (resendConfigured) {
              const ok = await sendEmail(
                resendKey,
                userEmail,
                "You're partway through your PROFIT discovery — finish in 4 minutes",
                buildAbandonedD1Html(userName, session.id)
              );
              if (ok) emailsSent++;
              else errors++;
            } else {
              emailsSent++;
            }
            updates.abandoned_d1 = new Date().toISOString();
          }

          // Day 3
          if (daysSinceUpdate >= 3 && !followup.abandoned_d3) {
            if (resendConfigured) {
              const ok = await sendEmail(
                resendKey,
                userEmail,
                "Still thinking about your next hire? Let's talk",
                buildAbandonedD3Html(userName)
              );
              if (ok) emailsSent++;
              else errors++;
            } else {
              emailsSent++;
            }
            updates.abandoned_d3 = new Date().toISOString();
          }
        }

        // Persist updated followup state if anything changed
        if (Object.keys(updates).length > 0) {
          const mergedFollowup = { ...followup, ...updates };
          await serviceClient
            .from("hr_profit_sessions")
            .update({
              session_data: { ...sessionData, followup: mergedFollowup },
            })
            .eq("id", session.id);
        }
      } catch (sessionErr) {
        errors++;
        await logError(serviceClient, {
          functionName: "hr_followup_cron",
          errorMessage: "Error processing session",
          errorDetail: sessionErr instanceof Error ? sessionErr.message : String(sessionErr),
          severity: "warn",
          inputParams: { session_id: session.id },
        });
      }
    }

    const result = `Processed ${sessions?.length ?? 0} sessions. Emails sent: ${emailsSent}. Errors: ${errors}.`;
    await completeJobRun(serviceClient, runId, errors > 0 ? "failure" : "success", result);

    return new Response(
      JSON.stringify({ ok: true, emails_sent: emailsSent, errors }),
      { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logError(serviceClient, {
      functionName: "hr_followup_cron",
      errorMessage: msg,
      errorDetail: err instanceof Error ? err.stack : undefined,
      severity: "error",
    });
    await completeJobRun(serviceClient, runId, "failure", undefined, msg);

    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }
});
