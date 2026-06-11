// =============================================================================
// hr_start_discovery — Creates a new PROFIT discovery session
// =============================================================================
// POST /functions/v1/hr_start_discovery
// Middleware: handlePreflight → requireAuth → rateLimit → validateBody →
//             createUserClient → safeError
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handlePreflight, corsHeaders } from "../_shared/cors.ts";
import { requireAuth, createUserClient } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { validateBody, z } from "../_shared/validate.ts";
import { safeError, withErrorHandler } from "../_shared/error-handler.ts";
import { logError } from "../_shared/error-logger.ts";

const StartDiscoverySchema = z.object({
  session_source: z.string().max(200).optional(),
});

const FIRST_QUESTION =
  "Let's start with the P in PROFIT — Pinpoint Goals. What business goal are you working toward right now? What transition or change are you navigating?";

Deno.serve(
  withErrorHandler(async (req: Request): Promise<Response> => {
    // 1. CORS preflight
    const preflight = handlePreflight(req);
    if (preflight) return preflight;

    const headers = corsHeaders(req);

    // 2. Auth
    const [user, authError] = await requireAuth(req);
    if (authError) return authError;

    // 3. Rate limit (expensive — AI-adjacent session creation)
    const limit = await rateLimit(user.id, "hr_start_discovery", "write");
    if (!limit.allowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests" }),
        {
          status: 429,
          headers: {
            ...headers,
            "Content-Type": "application/json",
            "Retry-After": String(limit.retryAfter ?? 60),
          },
        }
      );
    }

    // 4. Validate body
    const [body, validationError] = await validateBody(req, StartDiscoverySchema);
    if (validationError) return validationError;

    // 5. User-scoped Supabase client (RLS enforced)
    const supabase = createUserClient(req);

    // Service-role client for observability only
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // 6. Check for existing in_progress session
    const { data: existingSessions, error: fetchError } = await supabase
      .from("hr_profit_sessions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "in_progress")
      .limit(1);

    if (fetchError) {
      await logError(serviceClient, {
        functionName: "hr_start_discovery",
        errorMessage: "Failed to check existing sessions",
        errorDetail: fetchError.message,
        severity: "error",
        userId: user.id,
        inputParams: { action: "check_existing" },
      });
      return safeError(req, 500, "Failed to check existing sessions");
    }

    if (existingSessions && existingSessions.length > 0) {
      return new Response(
        JSON.stringify({
          error: "You already have an active discovery session",
          session_id: existingSessions[0].id,
        }),
        {
          status: 409,
          headers: { ...headers, "Content-Type": "application/json" },
        }
      );
    }

    // 7. Create new session
    const sessionData: Record<string, unknown> = {};
    if (body.session_source) {
      sessionData.source = body.session_source;
    }

    const { data: newSession, error: insertError } = await supabase
      .from("hr_profit_sessions")
      .insert({
        user_id: user.id,
        status: "in_progress",
        current_step: "pinpoint",
        session_data: sessionData,
      })
      .select("id")
      .single();

    if (insertError || !newSession) {
      await logError(serviceClient, {
        functionName: "hr_start_discovery",
        errorMessage: "Failed to create discovery session",
        errorDetail: insertError?.message,
        severity: "error",
        userId: user.id,
        inputParams: { action: "create_session" },
      });
      return safeError(req, 500, "Failed to create discovery session");
    }

    // 8. Return 201 with session_id and first question
    return new Response(
      JSON.stringify({
        data: {
          session_id: newSession.id,
          first_question: FIRST_QUESTION,
        },
      }),
      {
        status: 201,
        headers: { ...headers, "Content-Type": "application/json" },
      }
    );
  })
);
