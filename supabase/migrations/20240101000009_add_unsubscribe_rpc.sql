-- Migration: add hr_unsubscribe_from_emails SECURITY DEFINER RPC
-- Allows unauthenticated callers (anon role) to opt a user out of a specific
-- email category by user_id. Used by the one-click unsubscribe links included
-- in all automated follow-up emails (US-024 CAN-SPAM compliance).
--
-- Accepted values for p_pref_key:
--   'followup_14d'  — D1/D3/D7 completed-session sequence
--   'followup_6mo'  — 6-month check-in email
--   'marketing'     — bulk marketing emails
-- Any other key is silently ignored (no-op) to prevent injection.

CREATE OR REPLACE FUNCTION public.hr_unsubscribe_from_emails(
  p_user_id uuid,
  p_pref_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allowlist: only update known preference keys
  IF p_pref_key NOT IN ('followup_14d', 'followup_6mo', 'marketing') THEN
    RETURN;
  END IF;

  UPDATE public.hr_users
  SET
    notification_preferences = COALESCE(notification_preferences, '{}'::jsonb)
      || jsonb_build_object(p_pref_key, false),
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hr_unsubscribe_from_emails(uuid, text) TO anon, authenticated;
