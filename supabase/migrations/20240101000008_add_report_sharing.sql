-- =============================================================================
-- Add share_token to hr_reports for public no-account report viewing (US-004)
-- =============================================================================

-- Add share_token column (backfill existing rows with random UUIDs)
ALTER TABLE public.hr_reports
  ADD COLUMN IF NOT EXISTS share_token uuid NOT NULL DEFAULT gen_random_uuid();

-- Unique constraint so token lookups are fast and unambiguous
CREATE UNIQUE INDEX IF NOT EXISTS hr_reports_share_token_idx ON public.hr_reports (share_token);

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER function for public share-token lookups.
-- Bypasses RLS so unauthenticated recipients can view a shared report.
-- Only exposes: id, session_id, report_data, created_at (never user_id).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hr_get_report_by_share_token(p_token uuid)
RETURNS TABLE (
  id          uuid,
  session_id  uuid,
  report_data jsonb,
  created_at  timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.session_id,
    r.report_data,
    r.created_at
  FROM public.hr_reports r
  WHERE r.share_token = p_token;
END;
$$;

-- Grant to anon (unauthenticated visitors) and authenticated users
GRANT EXECUTE ON FUNCTION public.hr_get_report_by_share_token(uuid) TO anon, authenticated;
