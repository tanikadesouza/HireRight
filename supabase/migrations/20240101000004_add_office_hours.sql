-- =============================================================================
-- Migration: office hours RSVP table (US-032)
-- =============================================================================

CREATE TABLE IF NOT EXISTS hr_office_hours_rsvps (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          text NOT NULL,
  full_name      text NOT NULL,
  company        text,
  question       text,
  session_label  text NOT NULL,   -- e.g. "Wednesday, July 9, 2026 12:00 PM – 1:00 PM ET"
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, session_label)
);

-- RLS: admins only (RSVPs are PII; users don't need to read back their own)
ALTER TABLE hr_office_hours_rsvps ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated or anonymous user to INSERT (public RSVP form)
CREATE POLICY "Anyone can rsvp"
  ON hr_office_hours_rsvps FOR INSERT
  WITH CHECK (true);

-- Only admin role can read RSVPs
CREATE POLICY "Admins can view rsvps"
  ON hr_office_hours_rsvps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hr_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX idx_hr_office_hours_rsvps_session
  ON hr_office_hours_rsvps (session_label);
CREATE INDEX idx_hr_office_hours_rsvps_email
  ON hr_office_hours_rsvps (email);
