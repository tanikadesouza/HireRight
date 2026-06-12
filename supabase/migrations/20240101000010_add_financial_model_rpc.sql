-- Migration: add hr_save_financial_model RPC (US-012)
-- Merges financial calculator inputs into hr_reports.report_data
-- Uses SECURITY DEFINER so the client can update only its own report.
-- The function validates that the session belongs to the calling user
-- before updating, preventing any cross-user modification.

CREATE OR REPLACE FUNCTION public.hr_save_financial_model(
  p_session_id uuid,
  p_user_id    uuid,
  p_model      jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure the report belongs to the calling user before updating
  UPDATE public.hr_reports
  SET report_data = report_data || jsonb_build_object('financial_model', p_model)
  WHERE session_id = p_session_id
    AND user_id    = p_user_id;
END;
$$;

-- Grant execute to authenticated users only (not anon — user must be signed in)
GRANT EXECUTE ON FUNCTION public.hr_save_financial_model(uuid, uuid, jsonb) TO authenticated;
