// =============================================================================
// JOB LOGGER — fire-and-forget cron run audit
// =============================================================================
// Calls public.rpc_start_job_run / public.rpc_complete_job_run.
// NEVER throws. Returns null on failure — caller should treat as "skip telemetry".
//
// Producer pattern (every cron edge function):
//
//   import { startJobRun, completeJobRun } from "../_shared/job-logger.ts";
//
//   const runId = await startJobRun(serviceClient, "my-cron-job");
//   try {
//     const result = await doWork();
//     await completeJobRun(serviceClient, runId, "success",
//                          `Processed ${result.count} items`);
//   } catch (err) {
//     await completeJobRun(serviceClient, runId, "failure", undefined,
//                          err instanceof Error ? err.message : String(err));
//     throw err;   // re-throw — job logging is observability, not flow control
//   }
//
// Note: even when `runId` is null (the start RPC failed), the completeJobRun
// call is safe — it returns false without doing anything.
// =============================================================================

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type JobStatus = "success" | "failure";

/**
 * Records the start of a cron run. Self-registers the job in the registry
 * if it doesn't exist. Returns the new run id, or `null` if the write failed.
 *
 * @param serviceClient A Supabase client created with the SERVICE_ROLE key.
 * @param jobName       Stable identifier for the job (e.g., "daily-cleanup").
 * @param metadata      Optional producer-defined context. Never PHI/PII/secrets.
 */
export async function startJobRun(
  serviceClient: SupabaseClient,
  jobName: string,
  metadata?: Record<string, unknown> | null,
): Promise<string | null> {
  try {
    const { data, error } = await serviceClient.rpc("rpc_start_job_run", {
      p_job_name: jobName,
      p_metadata: metadata ?? null,
    });

    if (error) {
      console.error("[startJobRun] RPC error:", {
        job: jobName,
        rpc_error: error.message,
      });
      return null;
    }

    return (data as string) ?? null;
  } catch (err) {
    console.error("[startJobRun] failed:", {
      job: jobName,
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Records the completion of a cron run.
 *
 * @param serviceClient  A Supabase client created with the SERVICE_ROLE key.
 * @param runId          The id returned by startJobRun. May be null — the call
 *                       is a no-op in that case (returns false).
 * @param status         "success" or "failure".
 * @param resultMessage  Optional summary (e.g., "Processed 142 items").
 * @param errorDetail    Optional error detail for failures. Truncated at 4000 chars.
 */
export async function completeJobRun(
  serviceClient: SupabaseClient,
  runId: string | null,
  status: JobStatus,
  resultMessage?: string,
  errorDetail?: string,
): Promise<boolean> {
  if (!runId) {
    // start failed; nothing to update. Don't fail the caller.
    return false;
  }

  try {
    const { data, error } = await serviceClient.rpc("rpc_complete_job_run", {
      p_run_id: runId,
      p_status: status,
      p_result_message: resultMessage ?? null,
      p_error_detail: errorDetail ?? null,
    });

    if (error) {
      console.error("[completeJobRun] RPC error:", {
        run_id: runId,
        rpc_error: error.message,
      });
      return false;
    }

    return Boolean(data);
  } catch (err) {
    console.error("[completeJobRun] failed:", {
      run_id: runId,
      message: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
