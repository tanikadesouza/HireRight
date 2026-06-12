-- =============================================================================
-- Migration: add profile fields to hr_users (US-002 onboarding data)
-- =============================================================================

ALTER TABLE hr_users
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS industry     text,
  ADD COLUMN IF NOT EXISTS team_size    integer;
