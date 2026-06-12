-- =============================================================================
-- Migration: add hr_referrals table for referral attribution (US-026)
-- =============================================================================

CREATE TABLE IF NOT EXISTS hr_referrals (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id   uuid NOT NULL REFERENCES hr_users(id) ON DELETE CASCADE,
  referee_email text NOT NULL,
  referee_id    uuid REFERENCES hr_users(id) ON DELETE SET NULL,
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'signed_up', 'completed_session', 'converted')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz
);

-- Referrers can only see their own referrals
ALTER TABLE hr_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrers can view their own referrals"
  ON hr_referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Service can insert referrals"
  ON hr_referrals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update referrals"
  ON hr_referrals FOR UPDATE
  USING (true);

CREATE INDEX idx_hr_referrals_referrer_id ON hr_referrals(referrer_id);
CREATE INDEX idx_hr_referrals_referee_email ON hr_referrals(referee_email);
