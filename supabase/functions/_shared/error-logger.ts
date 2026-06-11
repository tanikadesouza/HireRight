// =============================================================================
// ERROR LOGGER — fire-and-forget writer for system_error_logs
// =============================================================================
// Calls the public._log_error SECURITY DEFINER RPC. NEVER throws — a logging
// failure is downgraded to console.error so the caller's flow is uninterrupted.
//
// Producer pattern (in any edge function):
//
//   import { logError } from "../_shared/error-logger.ts";
//
//   try {
//     await doWork();
//   } catch (err) {
//     await logError(serviceClient, {
//       functionName: "my-function",
//       errorMessage: err instanceof Error ? err.message : String(err),
//       errorDetail: err instanceof Error ? err.stack : undefined,
//       severity: "error",
//       tenantId,                  // generator renames param per User Model
//       inputParams: { record_id, action },
//     });
//     return safeError(req, 500, "An unexpected error occurred");
//   }
//
// IMPORTANT: do NOT wrap logError in your own try/catch — it has its own,
// and a nested catch is a smell that flagged-by-CI lint rules will complain
// about (see PRINCIPLES.md §1).
// =============================================================================

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { coerceSeverity, type Severity } from "./severity.ts";

export interface LogErrorParams {
  /** The edge function name. Identifies the producer in the admin UI. */
  functionName: string;
  /** Human-readable message. Truncated at 4000 chars by the RPC. */
  errorMessage: string;
  /** Stack trace or extended detail. Optional. Truncated at 4000 chars. */
  errorDetail?: string;
  /** Machine-readable code (e.g., 'PGRST116', 'EBADREQ'). Optional. */
  errorCode?: string;
  /** Severity level. Defaults to 'error'. Coerced to ladder by the RPC. */
  severity?: Severity | string;
  /**
   * Tenant identifier (org/location/workspace). The generator renames this
   * field at emission per the project's User Model.
   */
  tenantId?: string | null;
  /** Authenticated user, if known. Optional. */
  userId?: string | null;
  /**
   * Redacted input parameters for context. NEVER include PHI/PII/secrets.
   * Prefer field shapes (`{ record_id, action }`) over full request bodies.
   */
  inputParams?: Record<string, unknown> | null;
  /**
   * State snapshot for debugging. Same redaction rules.
   */
  stateSnapshot?: Record<string, unknown> | null;
}

/**
 * Fire-and-forget error writer. Returns the new log row id, or `null` if the
 * write failed (caller should not branch on this — it's informational).
 *
 * @param serviceClient A Supabase client created with the SERVICE_ROLE key.
 *                      Required because the _log_error RPC is granted to
 *                      service_role only. NEVER pass a user-scoped client.
 */
export async function logError(
  serviceClient: SupabaseClient,
  params: LogErrorParams,
): Promise<string | null> {
  try {
    const severity = coerceSeverity(params.severity, "error");

    const { data, error } = await serviceClient.rpc("_log_error", {
      p_function_name: params.functionName,
      p_error_message: params.errorMessage,
      p_error_detail: params.errorDetail ?? null,
      p_error_code: params.errorCode ?? null,
      p_severity: severity,
      p_tenant_id: params.tenantId ?? null,
      p_user_id: params.userId ?? null,
      p_input_params: params.inputParams ?? null,
      p_state_snapshot: params.stateSnapshot ?? null,
    });

    if (error) {
      // RPC reported an error but didn't throw. Surface to console only.
      console.error("[logError] RPC error:", {
        function: params.functionName,
        rpc_error: error.message,
      });
      return null;
    }

    return (data as string) ?? null;
  } catch (err) {
    // Network failure, client misconfiguration, anything else.
    // PRINCIPLES.md §1: logging cannot fail the caller.
    console.error("[logError] failed:", {
      function: params.functionName,
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
