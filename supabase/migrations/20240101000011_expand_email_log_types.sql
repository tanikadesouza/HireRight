-- Migration: expand hr_email_log.email_type CHECK constraint
-- The initial schema was missing followup_day7, followup_6mo, and
-- followup_abandoned_day3 types that the cron function sends.
-- Also adds session_id column to correlate email logs to sessions.

-- Drop old constraint and replace with expanded set
ALTER TABLE public.hr_email_log
  DROP CONSTRAINT IF EXISTS hr_email_log_email_type_check;

ALTER TABLE public.hr_email_log
  ADD CONSTRAINT hr_email_log_email_type_check
  CHECK (email_type IN (
    'signup',
    'email_verification',
    'session_completion',
    'password_reset',
    'followup_day1',
    'followup_day3',
    'followup_day7',
    'followup_6mo',
    'followup_abandoned_day1',
    'followup_abandoned_day3',
    'bulk_campaign'
  ));

-- Add session_id so admins can drill from an email log entry to the session
ALTER TABLE public.hr_email_log
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.hr_profit_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS hr_email_log_session_id_idx ON public.hr_email_log (session_id);
