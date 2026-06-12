-- =============================================================================
-- Migration: anonymous mode flag on hr_users (US-040)
-- =============================================================================

ALTER TABLE hr_users
  ADD COLUMN IF NOT EXISTS anonymous_mode boolean NOT NULL DEFAULT false;
