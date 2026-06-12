-- =============================================================================
-- Migration: hr_hiring_stage — tracks post-report hiring progress per session
-- =============================================================================
-- One row per completed session. Stage is updated by the user as they progress.
-- =============================================================================

CREATE TABLE IF NOT EXISTS hr_hiring_stage (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid NOT NULL REFERENCES hr_profit_sessions(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES hr_users(id) ON DELETE CASCADE,
  stage        text NOT NULL DEFAULT 'drafting_jd',
  notes        text,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id)
);

-- Stages (ordered):
--   drafting_jd → posted → shortlisting → interviewing → offer_made → hired

-- RLS
ALTER TABLE hr_hiring_stage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own hiring stage"
  ON hr_hiring_stage
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins read all hiring stages"
  ON hr_hiring_stage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hr_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
