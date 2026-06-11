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

const PROFIT_SYSTEM_PROMPT = `You are a strategic hiring advisor for HireRight, guiding a service business founder through the PROFIT method — a 5-step strategic discovery process.

The 5 steps are:
P - Pinpoint Goals: Understand business goals and current transitions
R - Revamp Team Structure: Map current team composition and roles
O - Optimize Roles: Identify which current people can evolve/transition
F - Fill the Gaps: Define the specific role needed and required skills
I - Implement & Tune: Timeline, budget, onboarding, and success metrics

RULES:
- Ask ONE question at a time — never multiple questions in one message
- Progress through P→R→O→F→I in order, but only advance when you have sufficient detail
- Surface "aha moments" when you detect contradictions (e.g., "You mentioned X but are considering Y — let's explore that gap")
- Keep responses conversational and concise (2-4 sentences max per turn)
- When all 5 steps are complete, respond with a JSON block at the end: {"discovery_complete": true, "recommended_role": "...", "business_goal": "...", "team_gaps": "..."}
- Flag internal vs. external hire options when relevant (step O)
- Flag fractional vs. full-time when relevant (step F)
- NEVER give generic advice — every response must reference something the founder said`;

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
          model: "claude-sonnet-4-5", // as of 2025-01
          max_tokens: 1024,
          system: PROFIT_SYSTEM_PROMPT,
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

    // 8. Call Anthropic Claude API
    const aiResult = await callAnthropicWithRetry(
      conversationHistory,
      serviceClient,
      body.session_id
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
