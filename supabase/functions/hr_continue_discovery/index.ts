// =============================================================================
// hr_continue_discovery — Continues a PROFIT discovery session via Claude AI
// =============================================================================
// POST /functions/v1/hr_continue_discovery
// Middleware: handlePreflight → requireAuth → rateLimit → validateBody →
//             createUserClient → safeError
// External: Anthropic Claude API (see claude.md §6.5)
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handlePreflight, corsHeaders } from "../_shared/cors.ts";
import { requireAuth, createUserClient } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { validateBody, z } from "../_shared/validate.ts";
import { safeError, withErrorHandler } from "../_shared/error-handler.ts";
import { logError } from "../_shared/error-logger.ts";

const ContinueDiscoverySchema = z.object({
  session_id: z.string().uuid(),
  user_message: z.string().min(1).max(5000).trim(),
});

// ---------------------------------------------------------------------------
// Industry-specific context addons (US-038)
// Injected into system prompt based on user's onboarding profile.
// ---------------------------------------------------------------------------
const INDUSTRY_CONTEXT: Record<string, string> = {
  "Law Firm": `
INDUSTRY CONTEXT — LAW FIRM:
- Reference "billable hours" when discussing productivity and role impact
- Use legal role titles: associate, paralegal, legal admin, practice manager, business development director
- When discussing team structure: ask about partner-to-associate ratios and client origination responsibilities
- For salary benchmarking, use law firm market rates and note bonus structures common to legal (year-end discretionary)
- Red flag: law firms often confuse "needing a lawyer" with needing operational capacity — probe whether the gap is legal skill or business process`,

  "Marketing Agency": `
INDUSTRY CONTEXT — MARKETING AGENCY:
- Reference "retainer clients," "deliverables," and "account management" naturally
- Use agency role titles: account manager, creative director, copywriter, media buyer, project manager, operations lead
- When discussing capacity: ask about client load per team member and whether they're losing scope due to bandwidth
- For salary: agency salaries are often below market but compensate with creative freedom and portfolio value — acknowledge this trade-off
- Red flag: agencies often hire more creatives when what they actually need is an account manager or traffic manager`,

  "Healthcare": `
INDUSTRY CONTEXT — HEALTHCARE:
- Reference "patient care," "compliance," "credentialing," and "EMR/EHR" naturally when relevant
- Use healthcare role titles: practice manager, care coordinator, medical biller, front office lead, clinical operations director
- When discussing team: ask about patient volume per provider and whether bottlenecks are clinical or administrative
- For salary: note that clinical roles have licensing requirements that affect compensation floors
- Red flag: HIPAA compliance and credentialing timelines mean hiring in healthcare has longer lead times — surface this in the Implement step`,

  "Creative Agency": `
INDUSTRY CONTEXT — CREATIVE AGENCY:
- Reference "client briefs," "revisions," "project-based work," and "creative capacity" naturally
- Use creative role titles: art director, brand strategist, production coordinator, creative project manager, studio manager
- When discussing fractional vs. full-time: creative agencies often benefit from fractional for overflow capacity
- For salary: creative roles often have flexible compensation (hourly, retainer, per-project) — explore what structure fits their model
- Red flag: creative agencies often mistake client delivery problems for headcount problems — ask about workflow and tooling first`,

  "Tech/Software": `
INDUSTRY CONTEXT — TECH/SOFTWARE:
- Reference "sprint," "product roadmap," "technical debt," and "engineering capacity" naturally when relevant
- Use tech role titles: engineering manager, product manager, DevOps engineer, QA lead, customer success manager, growth lead
- When discussing fractional vs. full-time: technical roles rarely work well fractionally unless highly specialized (security, data science, DevOps)
- For salary: tech salaries are highly location-dependent — ask where the hire will be based and whether they're open to remote
- Red flag: founders often want to hire engineers when the bottleneck is actually product management or QA`,

  "Real Estate": `
INDUSTRY CONTEXT — REAL ESTATE:
- Reference "transaction volume," "listings," "closings," and "lead pipeline" naturally
- Use real estate role titles: transaction coordinator, showing agent, buyer's agent, operations manager, marketing coordinator, ISA (inside sales agent)
- When discussing capacity: ask about number of active listings/transactions and how many the founder is personally managing
- For salary: real estate support roles often mix base + per-transaction bonus — explore what structure motivates performance
- Red flag: real estate teams often hire another agent before they have operational systems in place — ask about SOP status`,

  "Financial Services": `
INDUSTRY CONTEXT — FINANCIAL SERVICES:
- Reference "AUM," "client relationships," "compliance," and "fiduciary duties" naturally when relevant
- Use financial services role titles: financial advisor, client service associate, operations manager, paraplanner, compliance officer, relationship manager
- When discussing team: ask about clients-per-advisor ratio and whether bottlenecks are service delivery or business development
- For salary: note that licensed roles (Series 65, CFP, CPA) command significant premiums over unlicensed
- Red flag: RIA and broker-dealer compliance requirements affect who can perform certain functions — surface this early`,

  "Business Consulting": `
INDUSTRY CONTEXT — BUSINESS CONSULTING:
- Reference "engagements," "client relationships," "deliverables," and "utilization rate" naturally
- Use consulting role titles: senior consultant, engagement manager, practice lead, client success director, business development director, operations manager
- When discussing team structure: ask about current billable utilization and whether the founder is still doing delivery work vs. business development
- For salary: consulting compensation often includes performance bonus tied to revenue or utilization — explore this structure
- Red flag: solo consultants often need an operations or delivery person before they need another consultant`,

  "Education": `
INDUSTRY CONTEXT — EDUCATION:
- Reference "enrollment," "curriculum," "student outcomes," and "instructor capacity" naturally
- Use education role titles: instructional designer, enrollment coordinator, student success manager, operations director, curriculum developer, marketing lead
- When discussing team: ask about student-to-instructor ratio and where dropout or churn is happening
- For salary: education often pays below market — explore benefits, mission alignment, and flexible work as compensating factors
- Red flag: education businesses often conflate low enrollment with a marketing problem when it's actually a student success/retention problem`,
};

// ---------------------------------------------------------------------------
// Build dynamic system prompt (US-038 industry context, US-040 anonymous mode)
// ---------------------------------------------------------------------------
interface UserProfile {
  industry?: string | null;
  team_size?: number | null;
  company_name?: string | null;
  anonymous_mode?: boolean | null;
}

function buildSystemPrompt(basePrompt: string, profile: UserProfile): string {
  const parts: string[] = [basePrompt];

  // Industry-specific context (US-038)
  if (profile.industry && INDUSTRY_CONTEXT[profile.industry]) {
    parts.push(INDUSTRY_CONTEXT[profile.industry]);
  }

  // User profile context
  const contextLines: string[] = [];
  if (profile.team_size) {
    contextLines.push(`Current team size: ${profile.team_size} people`);
  }
  if (!profile.anonymous_mode && profile.company_name) {
    contextLines.push(`Company: ${profile.company_name}`);
  }
  if (profile.industry) {
    contextLines.push(`Industry: ${profile.industry}`);
  }

  if (contextLines.length > 0) {
    parts.push(`\nUSER PROFILE (already known — do NOT ask about this again):\n${contextLines.join("\n")}`);
  }

  // Anonymous mode (US-040)
  if (profile.anonymous_mode) {
    parts.push(`\nPRIVACY: This user has requested anonymous mode. Do NOT ask for or reference their company name. Use "your business" or "your company" instead.`);
  }

  return parts.join("\n");
}

const PROFIT_SYSTEM_PROMPT = `You are a strategic hiring advisor for HireRight, guiding a service business founder through the PROFIT method — a 5-step strategic discovery process.

The 5 steps are:
P - Pinpoint Goals: Understand business goals and current transitions
R - Revamp Team Structure: Map current team composition and roles
O - Optimize Roles: Identify which current people can evolve/transition
F - Fill the Gaps: Define the specific role needed and required skills
I - Implement & Tune: Timeline, budget, onboarding, and success metrics

CORE RULES:
- Ask ONE question at a time — never multiple questions in one message
- Progress through P→R→O→F→I in order, but only advance when you have sufficient detail
- Surface "aha moments" when you detect contradictions (e.g., "You mentioned X but are considering Y — let's explore that gap")
- Keep responses conversational and concise (2-4 sentences max per turn)
- NEVER give generic advice — every response must reference something the founder said

STEP O — INTERNAL VS. EXTERNAL HIRE (US-013):
During the Optimize step, ALWAYS ask: "Before we look externally — is there anyone on your current team who could step into this role with training, a title change, or a shift in responsibilities?"
- If YES: Explore what upskilling or structural change is needed. Name the internal option explicitly in your recommendation ("Internal development path: [name] could transition to X with Y investment").
- If NO: Probe why — is it skill gap, capacity, or politics? Then proceed to external hire.
- If the founder's earlier answers about their team suggest a transferable skill they haven't mentioned, flag it: "You mentioned [team member/role] handles X — that skill is closely related to what you need. Is promoting or expanding that role an option?"

STEP F — FRACTIONAL VS. FULL-TIME (US-014):
During the Fill step, assess commitment level with these questions (pick the most relevant):
- "How many hours a week do you realistically need this person — steady-state, not launch week?"
- "Does this role require daily presence and coordination, or could it be episodic and project-based?"
- "What's your runway to support a full-time salary for 12 months, even if revenue dips?"
Decision logic:
- Fractional (10-20 hrs/week, episodic work, tight runway): "Based on what you've described, a fractional [Role] makes more sense than full-time. Here's why: [specific reason from their answers]. Cost comparison: fractional ~$X/month vs. full-time ~$Y/year."
- Full-time (30+ hrs/week, daily coordination needed, stable runway): "This role requires full-time commitment because [specific reason]. A fractional arrangement would leave you with gaps on [specific days/functions they mentioned]."

STEP I — RED FLAGS DIAGNOSTIC (US-015):
During the Implement step, check hiring readiness before finalizing:
- "Do you have documented processes or SOPs for this role, or will the hire figure it out as they go?"
- "How much of your own time can you dedicate to onboarding and managing this person in the first 30 days?"
- "Is the problem you're solving a people problem (not enough hands) or a process problem (unclear workflows)?"
Red flag triggers — if any of these apply, surface them clearly:
- Missing SOPs: "One thing to consider: without documented processes, this hire will spend their first 60 days figuring out your business instead of driving results. A 2-week SOP sprint before you hire could double their effectiveness."
- Low onboarding capacity: "You mentioned [low bandwidth / travel / other projects]. A new hire needs your attention most in weeks 1-4. Is there a co-leader or team member who could share onboarding responsibility?"
- Process problem masquerading as people problem: "What you're describing sounds like it might be a process problem before it's a people problem. Hiring now without solving [specific process they mentioned] could mean the hire inherits broken systems and underperforms."
Always note the red flag but proceed with the hire recommendation unless the founder explicitly says they want to pause.

STEP F — SALARY BENCHMARKING (US-016):
When recommending a role in step F, always include a salary context statement:
- For common roles (admin assistant, operations manager, sales, marketing, bookkeeper, project manager, etc.), provide a realistic range based on typical market rates and the business context they described.
- Frame it: "To attract a [Role] at the caliber you're describing — someone who can [specific outcome from their F step answers] — expect to offer $X–$Y base. If your budget is lower, here's how to structure the offer competitively: [equity/flexibility/growth path]."
- If the role is highly specialized or niche: "Salary data for [role] varies widely. I'd recommend consulting with HireRight for custom benchmarking — but a reasonable starting assumption is $X–$Y based on your industry and the scope you described."
- Always pair the range with: role type (full-time vs. fractional), benefits context (health insurance, PTO norms), and one "offer structure" tip.

MULTI-ROLE HIRING (US-039):
During the Pinpoint step, if the founder mentions needing to hire multiple roles simultaneously:
- Acknowledge it: "It sounds like you have a few positions to fill. Let's get strategic about this — which role is most urgent for your business right now? We'll build a roadmap for that one first, then tackle the others."
- Complete the full PROFIT process for the priority role.
- After completion, if the founder wants to continue with the next role, include "suggest_next_role": true in the completion JSON.
- Cap at 3 roles per session. If they mention a 4th, say: "For 4+ roles, I'd recommend booking a strategic planning call so we can map this across your full org chart at once."

COMPLETION:
When all 5 steps are complete AND you have sufficient detail across all areas, respond with a completion signal. Your final message should close naturally (e.g., "You've given me everything I need to build your strategic hiring roadmap. Generating it now...") followed by this JSON block on its own line:
{"discovery_complete": true, "recommended_role": "...", "business_goal": "...", "team_gaps": "..."}`;

type DiscoveryStep = "pinpoint" | "revamp" | "optimize" | "fill" | "implement";

/**
 * Detects the current PROFIT step from the AI response text.
 * Returns null if no step transition is detected.
 */
function detectStep(text: string): DiscoveryStep | null {
  const lower = text.toLowerCase();
  if (
    lower.includes("revamp") ||
    lower.includes("team structure") ||
    lower.includes("who is on your team")
  ) {
    return "revamp";
  }
  if (
    lower.includes("optimize") ||
    lower.includes("who could transition")
  ) {
    return "optimize";
  }
  if (
    lower.includes("fill") ||
    lower.includes("what skills are missing") ||
    lower.includes("what role")
  ) {
    return "fill";
  }
  if (
    lower.includes("implement") ||
    lower.includes("timeline") ||
    lower.includes("budget")
  ) {
    return "implement";
  }
  return null;
}

/**
 * Checks if the AI response signals discovery completion.
 */
function detectCompletion(text: string): boolean {
  try {
    // Look for JSON block with discovery_complete: true
    const jsonMatch = text.match(/\{[^{}]*"discovery_complete"\s*:\s*true[^{}]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.discovery_complete === true;
    }
  } catch {
    // JSON parse failed — not complete
  }
  return false;
}

/**
 * Calls Anthropic Claude API with exponential backoff on 429.
 * Follows contract from claude.md §6.5.
 * model: claude-sonnet-4-5 // as of 2025-01
 */
async function callAnthropicWithRetry(
  messages: Array<{ role: string; content: string }>,
  serviceClient: ReturnType<typeof createClient>,
  sessionId: string,
  systemPrompt: string = PROFIT_SYSTEM_PROMPT
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
          model: "claude-sonnet-4-5", // as of 2025-01
          max_tokens: 1024,
          system: systemPrompt,
          messages,
        }),
      });
    } catch (networkErr) {
      await logError(serviceClient, {
        functionName: "hr_continue_discovery",
        errorMessage: "Anthropic API network error",
        errorDetail: networkErr instanceof Error ? networkErr.stack : String(networkErr),
        severity: "error",
        inputParams: { session_id: sessionId, attempt },
      });
      return { error: new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), { status: 502 }) };
    }

    // 401 — bad API key
    if (anthropicResponse.status === 401) {
      await logError(serviceClient, {
        functionName: "hr_continue_discovery",
        errorMessage: "Anthropic API authentication failed",
        severity: "critical",
        inputParams: { session_id: sessionId },
      });
      return { error: new Response(JSON.stringify({ error: "AI service configuration error" }), { status: 502 }) };
    }

    // 429 — rate limited, exponential backoff: 1s, 2s, 4s
    if (anthropicResponse.status === 429) {
      attempt++;
      if (attempt >= MAX_RETRIES) {
        await logError(serviceClient, {
          functionName: "hr_continue_discovery",
          errorMessage: "Anthropic API rate limit exceeded after max retries",
          severity: "error",
          inputParams: { session_id: sessionId, attempts: attempt },
        });
        return { error: new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), { status: 502 }) };
      }
      const backoffMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      continue;
    }

    // 5xx — Anthropic server error
    if (anthropicResponse.status >= 500) {
      const errorBody = await anthropicResponse.text().catch(() => "");
      await logError(serviceClient, {
        functionName: "hr_continue_discovery",
        errorMessage: `Anthropic API error: ${anthropicResponse.status}`,
        errorDetail: errorBody.slice(0, 500),
        severity: "error",
        inputParams: { session_id: sessionId, status: anthropicResponse.status },
      });
      return { error: new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), { status: 502 }) };
    }

    // Success
    const data = await anthropicResponse.json();
    const text: string = data.content[0].text;
    const inputTokens: number = data.usage?.input_tokens ?? 0;
    const outputTokens: number = data.usage?.output_tokens ?? 0;
    return { text, inputTokens, outputTokens };
  }

  // Unreachable, but TypeScript needs it
  return { error: new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), { status: 502 }) };
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
    const limit = await rateLimit(user.id, "hr_continue_discovery", "expensive");
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
    const [body, validationError] = await validateBody(req, ContinueDiscoverySchema);
    if (validationError) return validationError;

    // 5. User-scoped Supabase client (RLS enforced)
    const supabase = createUserClient(req);

    // Service-role client for observability only
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // 5b. Fetch user profile for industry-aware AI (US-038) and anonymous mode (US-040)
    // Non-fatal — discovery continues with base prompt if profile fetch fails
    let userProfile: UserProfile = {};
    try {
      const { data: profileData } = await supabase
        .from("hr_users")
        .select("industry, team_size, company_name, anonymous_mode")
        .eq("id", user.id)
        .single();
      if (profileData) {
        userProfile = profileData as UserProfile;
      }
    } catch {
      // Non-fatal
    }

    // 6. Fetch and verify session (must belong to user, must be in_progress)
    const { data: session, error: sessionError } = await supabase
      .from("hr_profit_sessions")
      .select("id, user_id, status, current_step")
      .eq("id", body.session_id)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return safeError(req, 404, "Session not found");
    }

    if (session.status !== "in_progress") {
      return safeError(req, 400, "Session is not in progress");
    }

    // 7. Load conversation history from hr_profit_messages
    const { data: messages, error: messagesError } = await supabase
      .from("hr_profit_messages")
      .select("role, content")
      .eq("session_id", body.session_id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      await logError(serviceClient, {
        functionName: "hr_continue_discovery",
        errorMessage: "Failed to load conversation history",
        errorDetail: messagesError.message,
        severity: "error",
        userId: user.id,
        inputParams: { session_id: body.session_id },
      });
      return safeError(req, 500, "Failed to load conversation history");
    }

    // Build conversation history for Anthropic (only user/assistant roles)
    const conversationHistory = (messages ?? [])
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    // Add the new user message
    conversationHistory.push({ role: "user", content: body.user_message });

    // 8. Call Anthropic Claude API with personalized system prompt (US-038/040)
    const dynamicSystemPrompt = buildSystemPrompt(PROFIT_SYSTEM_PROMPT, userProfile);
    const aiResult = await callAnthropicWithRetry(
      conversationHistory,
      serviceClient,
      body.session_id,
      dynamicSystemPrompt
    );

    if ("error" in aiResult) {
      // Re-attach CORS headers to the raw error response
      const errBody = await aiResult.error.text();
      const errStatus = aiResult.error.status;
      return new Response(errBody, {
        status: errStatus,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const { text: assistantMessage, inputTokens, outputTokens } = aiResult;
    const tokensUsed = inputTokens + outputTokens;

    // 9. Store user message in hr_profit_messages
    // NEVER log message content — only log message_length and session_id
    const { error: userMsgError } = await supabase
      .from("hr_profit_messages")
      .insert({
        session_id: body.session_id,
        role: "user",
        content: body.user_message,
        metadata: { message_length: body.user_message.length },
      });

    if (userMsgError) {
      await logError(serviceClient, {
        functionName: "hr_continue_discovery",
        errorMessage: "Failed to store user message",
        errorDetail: userMsgError.message,
        severity: "error",
        userId: user.id,
        inputParams: { session_id: body.session_id, message_length: body.user_message.length },
      });
      // Non-fatal — continue
    }

    // 10. Store assistant message in hr_profit_messages
    const { error: assistantMsgError } = await supabase
      .from("hr_profit_messages")
      .insert({
        session_id: body.session_id,
        role: "assistant",
        content: assistantMessage,
        metadata: {
          tokens_used: tokensUsed,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
        },
      });

    if (assistantMsgError) {
      await logError(serviceClient, {
        functionName: "hr_continue_discovery",
        errorMessage: "Failed to store assistant message",
        errorDetail: assistantMsgError.message,
        severity: "error",
        userId: user.id,
        inputParams: { session_id: body.session_id },
      });
      // Non-fatal — continue
    }

    // 11. Track tokens in hr_ai_usage (use service client for insert — RLS may restrict)
    const { error: usageError } = await serviceClient
      .from("hr_ai_usage")
      .insert({
        user_id: user.id,
        session_id: body.session_id,
        function_name: "hr_continue_discovery",
        tokens_used: tokensUsed,
        cost_usd: (tokensUsed / 1_000_000) * 3.0, // ~$3/million tokens (Sonnet)
      });

    if (usageError) {
      await logError(serviceClient, {
        functionName: "hr_continue_discovery",
        errorMessage: "Failed to record AI usage",
        errorDetail: usageError.message,
        severity: "warn",
        userId: user.id,
        inputParams: { session_id: body.session_id, tokens_used: tokensUsed },
      });
      // Non-fatal — continue
    }

    // 12. Detect step transition and completion
    const isComplete = detectCompletion(assistantMessage);
    const detectedStep = detectStep(assistantMessage);

    let newStatus = "in_progress";
    let newStep: DiscoveryStep = (session.current_step as DiscoveryStep) ?? "pinpoint";

    if (isComplete) {
      newStatus = "completed";
      newStep = "implement";
    } else if (detectedStep) {
      newStep = detectedStep;
    }

    // 13. Update session
    const updatePayload: Record<string, unknown> = {
      current_step: newStep,
    };

    if (isComplete) {
      updatePayload.status = "completed";
      updatePayload.completed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("hr_profit_sessions")
      .update(updatePayload)
      .eq("id", body.session_id);

    // 13b. Referral completion tracking (US-026) — when a session completes,
    // advance the referring user's hr_referrals row from signed_up → completed_session.
    // Use service_role for the cross-user update (RLS would block the user-scoped client).
    if (isComplete) {
      try {
        // Count how many completed sessions this user has (including this one)
        const { count } = await serviceClient
          .from("hr_profit_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "completed");

        // Only on their FIRST completion (count === 1 after this update)
        if (count !== null && count <= 1) {
          const { data: refRow } = await serviceClient
            .from("hr_referrals")
            .select("id")
            .eq("referee_id", user.id)
            .eq("status", "signed_up")
            .limit(1)
            .single();

          if (refRow) {
            await serviceClient
              .from("hr_referrals")
              .update({ status: "completed_session" })
              .eq("id", refRow.id);
          }
        }
      } catch {
        // Non-fatal — referral tracking should never block discovery completion
      }
    }

    if (updateError) {
      await logError(serviceClient, {
        functionName: "hr_continue_discovery",
        errorMessage: "Failed to update session",
        errorDetail: updateError.message,
        severity: "warn",
        userId: user.id,
        inputParams: { session_id: body.session_id, new_step: newStep, is_complete: isComplete },
      });
      // Non-fatal — continue
    }

    // 14. Return response
    // Map step names to progress percentage
    const STEP_PROGRESS: Record<string, number> = {
      pinpoint: 20,
      revamp: 40,
      optimize: 60,
      fill: 80,
      implement: 100,
    };

    return new Response(
      JSON.stringify({
        data: {
          assistant_message: assistantMessage,
          current_step: newStep,
          session_status: newStatus,
          progress: STEP_PROGRESS[newStep] ?? 20,
          discovery_complete: isComplete,
        },
      }),
      {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      }
    );
  })
);
