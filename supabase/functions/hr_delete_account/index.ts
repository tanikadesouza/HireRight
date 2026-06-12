// =============================================================================
// hr_delete_account — Permanently deletes the authenticated user's account
// =============================================================================
// POST /functions/v1/hr_delete_account
// Body: { confirmation: "DELETE" }
//
// Flow:
//   1. Verify JWT (requireAuth)
//   2. Validate confirmation == "DELETE"
//   3. Delete from auth.users via service_role admin API
//      (ON DELETE CASCADE handles hr_users + all related rows)
//
// NOTE: Service role is required here because only the admin API can delete
// an auth.users row. This is the one sanctioned use of service_role for
// user-data operations (not just observability).
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handlePreflight, corsHeaders } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { validateBody, z } from "../_shared/validate.ts";
import { safeError, withErrorHandler } from "../_shared/error-handler.ts";
import { logError } from "../_shared/error-logger.ts";

const DeleteAccountSchema = z.object({
  confirmation: z.literal("DELETE"),
});

Deno.serve(
  withErrorHandler(async (req: Request): Promise<Response> => {
    // 1. CORS preflight
    const preflight = handlePreflight(req);
    if (preflight) return preflight;

    const headers = corsHeaders(req);

    // 2. Auth — derives user from JWT, never from body
    const [user, authError] = await requireAuth(req);
    if (authError) return authError;

    // 3. Validate body
    const [body, validationError] = await validateBody(req, DeleteAccountSchema);
    if (validationError) return validationError;

    // (body.confirmation is guaranteed to be "DELETE" by the schema)
    void body;

    // 4. Create service-role client for admin auth operations
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    try {
      // Delete from auth.users — all hr_* rows cascade via ON DELETE CASCADE
      const { error: deleteError } = await serviceClient.auth.admin.deleteUser(user.id);

      if (deleteError) {
        await logError(serviceClient, {
          functionName: "hr_delete_account",
          errorMessage: "Auth admin deleteUser failed",
          errorDetail: deleteError.message,
          severity: "error",
        });
        return safeError(req, 500, "Failed to delete account. Please try again or contact support.");
      }

      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await logError(serviceClient, {
        functionName: "hr_delete_account",
        errorMessage: msg,
        errorDetail: err instanceof Error ? err.stack : undefined,
        severity: "error",
      });
      return safeError(req, 500, "Failed to delete account");
    }
  })
);
