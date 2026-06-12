-- =============================================================================
-- Migration: add notification_preferences JSONB to hr_users
-- =============================================================================
-- Stores per-user email opt-in/out preferences.
-- All notification types default to true (opted in at signup).
-- The followup cron reads this before sending any email.
-- =============================================================================

ALTER TABLE hr_users
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{
    "session_complete": true,
    "followup_14d":     true,
    "followup_6mo":     true,
    "marketing":        false
  }'::jsonb;

COMMENT ON COLUMN hr_users.notification_preferences IS
  'Per-user email preferences. Keys: session_complete, followup_14d, followup_6mo, marketing.';
