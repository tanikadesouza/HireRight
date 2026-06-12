// =============================================================================
// hr_generate_report — Synthesizes PROFIT session into a strategic hiring report
// =============================================================================
// POST /functions/v1/hr_generate_report
// Middleware: handlePreflight → requireAuth → rateLimit → validateBody →
//             createUserClient → safeError
// External: Anthropic Claude API
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handlePreflight, corsHeaders } from "../_shared/cors.ts";
import { requireAuth, createUserClient } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { validateBody, z } from "../_shared/validate.ts";
import { safeError, withErrorHandler } from "../_shared/error-handler.ts";
import { logError } from "../_shared/error-logger.ts";

const GenerateReportSchema = z.object({
  session_id: z.string().uuid(),
});

const SYNTHESIS_SYSTEM_PROMPT = `You are a strategic hiring advisor synthesizing a PROFIT method discovery session into a strategic hiring roadmap. Based on the conversation history provided, extract and structure the following into a JSON response:

{
  "executive_summary": "2-3 sentence summary of the hiring situation",
  "business_goal": "The founder's primary business goal",
  "current_team": "Brief description of current team",
  "gaps_identified": "The specific gap or problem this hire solves",
  "recommended_role": {
    "title": "Specific role title",
    "type": "full_time|fractional|contractor",
    "responsibilities": ["list of 4-6 specific responsibilities"],
    "required_skills": ["list of 5-8 specific skills"],
    "salary_range": "e.g. $50,000–$65,000"
  },
  "alignment_rationale": "Why this role aligns with the business goal",
  "next_actions": [
    "Share this report with your team",
    "Set your hiring budget (see Financial Reality Check)",
    "Choose your path: Hire with HireRight or DIY"
  ],
  "red_flags": ["Any hiring-too-soon warnings, if applicable"],
  "internal_candidate_note": "If internal promotion is viable, note it here. Otherwise null.",
  "confidence_score": 8,
  "job_description": "A complete, ready-to-post job description for this role. Include: About the Role (2-3 sentences), What You'll Do (bullet list of responsibilities), What We're Looking For (bullet list of requirements), What We Offer (compensation range, benefits, flexibility). Keep it under 600 words. Write as if the founder is the employer.",
  "interview_questions": {
    "behavioral": [
      "Tell me about a time you...(4 behavioral questions tied to the specific gaps identified in this session)"
    ],
    "situational": [
      "How would you handle...(3 situational questions specific to the role's challenges)"
    ],
    "culture_fit": [
      "What's your approach to...(3 culture-fit questions based on the business goals and values expressed in this session)"
    ]
  },
  "onboarding_plan": {
    "week_1": "Specific Week 1 orientation tasks for this role: tools to set up, people to meet, processes to learn. 2-4 bullet points.",
    "weeks_2_4": "Training and shadowing activities for weeks 2-4 specific to this role. Include key deliverables and check-in cadence.",
    "month_2": "First solo projects the hire should own. Include performance indicators and check-in frequency.",
    "month_3": "Performance review criteria specific to this role. What does success look like at 90 days?"
  }
}

Respond with ONLY the JSON object — no prose, no markdown fences.`;

/**
 * Calls Anthropic Claude API with exponential backoff on 429.
 * model: claude-sonnet-4-6 // as of 2026-06
 */
async function callAnthropicWithRetry(
  conversationText: string,
  serviceClient: ReturnType<typeof createClient>,
  sessionId: string
): Promise<{ text: string; inputTokens: number; outputTokens: number } | { error: Response }> {
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    let anthropicResponse: Response;

    try {
      anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", // as of 2026-06
          max_tokens: 2048,
          system: SYNTHESIS_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Here is the full PROFIT discovery session conversation:\n\n${conversationText}\n\nPlease synthesize this into the structured JSON report.`,
            },
          ],
        }),
      });
    } catch (networkErr) {
      await logError(serviceClient, {
        functionName: "hr_generate_report",
        errorMessage: "Anthropic API network error",
        errorDetail: networkErr instanceof Error ? networkErr.stack : String(networkErr),
        severity: "error",
        inputParams: { session_id: sessionId, attempt },
      });
      return {
        error: new Response(
          JSON.stringify({ error: "AI service temporarily unavailable" }),
          { status: 502 }
        ),
      };
    }

    if (anthropicResponse.status === 401) {
      await logError(serviceClient, {
        functionName: "hr_generate_report",
        errorMessage: "Anthropic API authentication failed",
        severity: "critical",
        inputParams: { session_id: sessionId },
      });
      return {
        error: new Response(
          JSON.stringify({ error: "AI service configuration error" }),
          { status: 502 }
        ),
      };
    }

    if (anthropicResponse.status === 429) {
      attempt++;
      if (attempt >= MAX_RETRIES) {
        await logError(serviceClient, {
          functionName: "hr_generate_report",
          errorMessage: "Anthropic API rate limit exceeded after max retries",
          severity: "error",
          inputParams: { session_id: sessionId, attempts: attempt },
        });
        return {
          error: new Response(
            JSON.stringify({ error: "AI service temporarily unavailable" }),
            { status: 502 }
          ),
        };
      }
      const backoffMs = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      continue;
    }

    if (anthropicResponse.status >= 500) {
      const errorBody = await anthropicResponse.text().catch(() => "");
      await logError(serviceClient, {
        functionName: "hr_generate_report",
        errorMessage: `Anthropic API error: ${anthropicResponse.status}`,
        errorDetail: errorBody.slice(0, 500),
        severity: "error",
        inputParams: { session_id: sessionId, status: anthropicResponse.status },
      });
      return {
        error: new Response(
          JSON.stringify({ error: "AI service temporarily unavailable" }),
          { status: 502 }
        ),
      };
    }

    const data = await anthropicResponse.json();
    const text: string = data.content[0].text;
    const inputTokens: number = data.usage?.input_tokens ?? 0;
    const outputTokens: number = data.usage?.output_tokens ?? 0;
    return { text, inputTokens, outputTokens };
  }

  return {
    error: new Response(
      JSON.stringify({ error: "AI service temporarily unavailable" }),
      { status: 502 }
    ),
  };
}

Deno.serve(
  withErrorHandler(async (req: Request): Promise<Response> => {
    // 1. CORS preflight
    const preflight = handlePreflight(req);
    if (preflight) return preflight;

    const headers = corsHeaders(req);

    // 2. Auth
    const [user, authError] = await requireAuth(req);
    if (authError) return authError;

    // 3. Rate limit (expensive — LLM call)
    const limit = await rateLimit(user.id, "hr_generate_report", "expensive");
    if (!limit.allowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests" }),
        {
          status: 429,
          headers: {
            ...headers,
            "Content-Type": "application/json",
            "Retry-After": String(limit.retryAfter ?? 3600),
          },
        }
      );
    }

    // 4. Validate body
    const [body, validationError] = await validateBody(req, GenerateReportSchema);
    if (validationError) return validationError;

    // 5. User-scoped Supabase client (RLS enforced)
    const supabase = createUserClient(req);

    // Service-role client for observability only
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // 6. Fetch session — must belong to user, must be in_progress OR generating_report
    const { data: session, error: sessionError } = await supabase
      .from("hr_profit_sessions")
      .select("id, user_id, status, report_generated")
      .eq("id", body.session_id)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return safeError(req, 404, "Session not found");
    }

    if (
      session.status !== "in_progress" &&
      session.status !== "generating_report" &&
      session.status !== "completed"
    ) {
      return safeError(req, 400, "Session cannot generate a report in its current state");
    }

    // 7. Idempotency check: generating_report → 409
    if (session.status === "generating_report") {
      return new Response(
        JSON.stringify({ error: "Report generation already in progress, retry in 10 seconds" }),
        {
          status: 409,
          headers: { ...headers, "Content-Type": "application/json" },
        }
      );
    }

    // 8. If completed AND report exists → return existing report
    if (session.status === "completed" && session.report_generated) {
      const { data: existingReport, error: reportFetchError } = await supabase
        .from("hr_reports")
        .select("report_data, created_at")
        .eq("session_id", body.session_id)
        .single();

      if (!reportFetchError && existingReport) {
        return new Response(
          JSON.stringify({ data: existingReport.report_data }),
          {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      }
    }

    // 9. Set session status = 'generating_report'
    const { error: statusUpdateError } = await supabase
      .from("hr_profit_sessions")
      .update({ status: "generating_report" })
      .eq("id", body.session_id);

    if (statusUpdateError) {
      await logError(serviceClient, {
        functionName: "hr_generate_report",
        errorMessage: "Failed to set generating_report status",
        errorDetail: statusUpdateError.message,
        severity: "error",
        userId: user.id,
        inputParams: { session_id: body.session_id },
      });
      return safeError(req, 500, "Failed to start report generation");
    }

    // 10. Load all hr_profit_messages for session
    const { data: messages, error: messagesError } = await supabase
      .from("hr_profit_messages")
      .select("role, content")
      .eq("session_id", body.session_id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      await logError(serviceClient, {
        functionName: "hr_generate_report",
        errorMessage: "Failed to load conversation history",
        errorDetail: messagesError.message,
        severity: "error",
        userId: user.id,
        inputParams: { session_id: body.session_id },
      });
      // Revert status on failure
      await supabase
        .from("hr_profit_sessions")
        .update({ status: "in_progress" })
        .eq("id", body.session_id);
      return safeError(req, 500, "Failed to load conversation history");
    }

    // Build conversation text for synthesis (only user/assistant roles)
    const conversationText = (messages ?? [])
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => `${m.role === "user" ? "Founder" : "Advisor"}: ${m.content}`)
      .join("\n\n");

    // 11. Call Anthropic Claude with synthesis prompt
    const aiResult = await callAnthropicWithRetry(
      conversationText,
      serviceClient,
      body.session_id
    );

    if ("error" in aiResult) {
      // Revert status on AI failure
      await supabase
        .from("hr_profit_sessions")
        .update({ status: "in_progress" })
        .eq("id", body.session_id);

      const errBody = await aiResult.error.text();
      const errStatus = aiResult.error.status;
      return new Response(errBody, {
        status: errStatus,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const { text: aiText, inputTokens, outputTokens } = aiResult;
    const tokensUsed = inputTokens + outputTokens;

    // 12. Parse response into report_data JSON
    let reportData: Record<string, unknown>;
    try {
      reportData = JSON.parse(aiText);
    } catch (parseErr) {
      await logError(serviceClient, {
        functionName: "hr_generate_report",
        errorMessage: "Failed to parse AI response as JSON",
        errorDetail: parseErr instanceof Error ? parseErr.message : String(parseErr),
        severity: "error",
        userId: user.id,
        inputParams: { session_id: body.session_id, response_length: aiText.length },
      });
      // Revert status
      await supabase
        .from("hr_profit_sessions")
        .update({ status: "in_progress" })
        .eq("id", body.session_id);
      return safeError(req, 502, "AI service returned an invalid response");
    }

    // 13. Insert into hr_reports
    const { data: insertedReport, error: reportInsertError } = await supabase
      .from("hr_reports")
      .insert({
        session_id: body.session_id,
        user_id: user.id,
        report_data: reportData,
      })
      .select("id")
      .single();

    if (reportInsertError || !insertedReport) {
      await logError(serviceClient, {
        functionName: "hr_generate_report",
        errorMessage: "Failed to insert report",
        errorDetail: reportInsertError?.message,
        severity: "error",
        userId: user.id,
        inputParams: { session_id: body.session_id },
      });
      // Revert status
      await supabase
        .from("hr_profit_sessions")
        .update({ status: "in_progress" })
        .eq("id", body.session_id);
      return safeError(req, 500, "Failed to save report");
    }

    // 14. Update session: status='completed', report_generated=true, completed_at=now()
    const { error: completeUpdateError } = await supabase
      .from("hr_profit_sessions")
      .update({
        status: "completed",
        report_generated: true,
        completed_at: new Date().toISOString(),
      })
      .eq("id", body.session_id);

    if (completeUpdateError) {
      await logError(serviceClient, {
        functionName: "hr_generate_report",
        errorMessage: "Failed to mark session as completed",
        errorDetail: completeUpdateError.message,
        severity: "warn",
        userId: user.id,
        inputParams: { session_id: body.session_id },
      });
      // Non-fatal — report was saved, continue
    }

    // 15. Advance referral status: signed_up → completed_session (US-026)
    //     Only fires for the referee's first completed session (status check prevents duplicates).
    const { error: referralError } = await serviceClient
      .from("hr_referrals")
      .update({ status: "completed_session", completed_at: new Date().toISOString() })
      .eq("referee_id", user.id)
      .eq("status", "signed_up");

    if (referralError) {
      await logError(serviceClient, {
        functionName: "hr_generate_report",
        errorMessage: "Failed to advance referral status",
        errorDetail: referralError.message,
        severity: "warn",
        userId: user.id,
        inputParams: { session_id: body.session_id },
      });
      // Non-fatal — referral tracking should never block report delivery
    } else {
      // Send referrer notification email if the update touched any rows (first completion)
      // Look up the referral row we just updated to find the referrer
      try {
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (resendKey && !resendKey.startsWith("placeholder")) {
          const { data: referralRows } = await serviceClient
            .from("hr_referrals")
            .select("referrer_id")
            .eq("referee_id", user.id)
            .eq("status", "completed_session")
            .limit(1);

          const referrerId = (referralRows as Array<{ referrer_id: string }> | null)?.[0]?.referrer_id;
          if (referrerId) {
            const { data: referrerRow } = await serviceClient
              .from("hr_users")
              .select("email, full_name")
              .eq("id", referrerId)
              .single();

            const refereeName = user.user_metadata?.full_name ?? user.email ?? "a founder";
            const referrerName = (referrerRow as { full_name: string | null; email: string } | null)?.full_name ?? "there";
            const referrerEmail = (referrerRow as { full_name: string | null; email: string } | null)?.email;
            const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "https://hireright.app";

            if (referrerEmail) {
              await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${resendKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: "HireRight <noreply@hireright.app>",
                  to: referrerEmail,
                  subject: `Your referral just completed their PROFIT discovery!`,
                  html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
                    <div style="background:#1d4ed8;padding:20px 32px"><p style="color:#fff;font-weight:700;margin:0;font-size:16px">HireRight</p></div>
                    <div style="padding:32px">
                      <p style="color:#374151;font-size:15px;margin:0 0 16px">Hi ${referrerName},</p>
                      <p style="color:#374151;font-size:15px;margin:0 0 16px">Great news — <strong>${refereeName}</strong>, who signed up through your referral link, just completed their first PROFIT discovery session.</p>
                      <p style="color:#374151;font-size:15px;margin:0 0 24px">Thank you for spreading the word about HireRight. Your referral has made a real difference for a fellow founder.</p>
                      <a href="${appUrl}/referrals" style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">View Your Referrals →</a>
                    </div>
                    <div style="border-top:1px solid #f3f4f6;padding:16px 32px">
                      <p style="color:#9ca3af;font-size:12px;margin:0">HireRight — Strategic Hiring Clarity</p>
                    </div>
                  </div>`,
                }),
              });
            }
          }
        }
      } catch {
        // Fire-and-forget — never block report delivery on referral email
      }
    }

    // 16. Advance referral status complete

    // 17. Track tokens in hr_ai_usage
    const { error: usageError } = await serviceClient
      .from("hr_ai_usage")
      .insert({
        user_id: user.id,
        session_id: body.session_id,
        function_name: "hr_generate_report",
        tokens_used: tokensUsed,
        cost_usd: (tokensUsed / 1_000_000) * 3.0, // ~$3/million tokens (Sonnet)
      });

    if (usageError) {
      await logError(serviceClient, {
        functionName: "hr_generate_report",
        errorMessage: "Failed to record AI usage",
        errorDetail: usageError.message,
        severity: "warn",
        userId: user.id,
        inputParams: { session_id: body.session_id, tokens_used: tokensUsed },
      });
      // Non-fatal — continue
    }

    // 18. Return report_data
    return new Response(
      JSON.stringify({ data: reportData }),
      {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      }
    );
  })
);
