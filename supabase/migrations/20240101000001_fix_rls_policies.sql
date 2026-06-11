-- =============================================================================
-- FIX: Remove unconditional USING (true) policies on observability tables
-- Service-role clients bypass RLS natively — no permissive policy needed.
-- ADR: service_role is the only writer for hr_job_runs; RLS UPDATE policy
--      with USING (true) is a security anti-pattern flagged by rls-gate-check.
-- =============================================================================

-- hr_job_runs: service_role writes via service client (bypasses RLS).
-- Restrict UPDATE to admins only (same as SELECT).
DROP POLICY IF EXISTS hr_job_runs_update_service ON public.hr_job_runs;

CREATE POLICY hr_job_runs_update_admin ON public.hr_job_runs
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

-- hr_system_error_logs: similarly drop any unconditional INSERT if present
-- (insert_service uses WITH CHECK (true) which is acceptable for INSERT-only,
--  but add a belt-and-suspenders note here for future reference)
-- No action needed — INSERT WITH CHECK (true) on INSERT-only policies is
-- intentional (logged by service role). The gate check only flags USING (true).
