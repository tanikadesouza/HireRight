-- =============================================================================
-- HireRight — Initial Schema Migration
-- All objects prefixed with hr_
-- RLS enabled on every table
-- =============================================================================

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Generate a short referral code (e.g. "abc1-x7k2")
CREATE OR REPLACE FUNCTION hr_generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  LOOP
    v_code := lower(
      substring(md5(random()::text) FROM 1 FOR 4) || '-' ||
      substring(md5(random()::text) FROM 1 FOR 4)
    );
    SELECT EXISTS (SELECT 1 FROM public.hr_users WHERE referral_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION hr_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Auto-create hr_users row when a new auth.users row is created
CREATE OR REPLACE FUNCTION hr_handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.hr_users (id, email, full_name, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    hr_generate_referral_code()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- =============================================================================
-- TABLE: hr_users
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.hr_users (
  id             uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email          text        NOT NULL UNIQUE,
  full_name      text,
  role           text        NOT NULL DEFAULT 'client'
                               CHECK (role IN ('client', 'admin')),
  referral_code  text        UNIQUE,
  referred_by    uuid        REFERENCES public.hr_users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_users ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
CREATE TRIGGER hr_users_updated_at
  BEFORE UPDATE ON public.hr_users
  FOR EACH ROW EXECUTE FUNCTION hr_set_updated_at();

-- Trigger: auto-create profile on signup
CREATE TRIGGER hr_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION hr_handle_new_user();

-- Policies
CREATE POLICY hr_users_select_own   ON public.hr_users FOR SELECT USING (auth.uid() = id);
CREATE POLICY hr_users_insert_own   ON public.hr_users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY hr_users_update_own   ON public.hr_users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY hr_users_delete_own   ON public.hr_users FOR DELETE USING (auth.uid() = id);

CREATE POLICY hr_users_admin_all ON public.hr_users
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

-- Indexes
CREATE INDEX IF NOT EXISTS hr_users_email_idx         ON public.hr_users (email);
CREATE INDEX IF NOT EXISTS hr_users_referral_code_idx ON public.hr_users (referral_code);

-- =============================================================================
-- TABLE: hr_profit_sessions
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.hr_profit_sessions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL DEFAULT auth.uid()
                                  REFERENCES auth.users(id) ON DELETE CASCADE,
  status           text        NOT NULL DEFAULT 'in_progress'
                                  CHECK (status IN ('in_progress', 'generating_report', 'completed', 'abandoned')),
  current_step     text        CHECK (current_step IN ('pinpoint', 'revamp', 'optimize', 'fill', 'implement')),
  session_data     jsonb       NOT NULL DEFAULT '{}',
  report_generated boolean     NOT NULL DEFAULT false,
  completed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_profit_sessions ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
CREATE TRIGGER hr_profit_sessions_updated_at
  BEFORE UPDATE ON public.hr_profit_sessions
  FOR EACH ROW EXECUTE FUNCTION hr_set_updated_at();

-- Policies
CREATE POLICY hr_profit_sessions_select_own ON public.hr_profit_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY hr_profit_sessions_insert_own ON public.hr_profit_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY hr_profit_sessions_update_own ON public.hr_profit_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY hr_profit_sessions_delete_own ON public.hr_profit_sessions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY hr_profit_sessions_admin_all ON public.hr_profit_sessions
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

-- Indexes
CREATE INDEX IF NOT EXISTS hr_profit_sessions_user_id_idx ON public.hr_profit_sessions (user_id);
CREATE INDEX IF NOT EXISTS hr_profit_sessions_status_idx  ON public.hr_profit_sessions (status);

-- =============================================================================
-- TABLE: hr_profit_messages
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.hr_profit_messages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid        NOT NULL
                            REFERENCES public.hr_profit_sessions(id) ON DELETE CASCADE,
  role        text        NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content     text        NOT NULL,
  metadata    jsonb       DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_profit_messages ENABLE ROW LEVEL SECURITY;

-- Policies — access via session ownership
CREATE POLICY hr_profit_messages_select_via_session ON public.hr_profit_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.hr_profit_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY hr_profit_messages_insert_via_session ON public.hr_profit_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hr_profit_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY hr_profit_messages_update_via_session ON public.hr_profit_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.hr_profit_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY hr_profit_messages_delete_via_session ON public.hr_profit_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.hr_profit_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS hr_profit_messages_session_id_idx ON public.hr_profit_messages (session_id);
CREATE INDEX IF NOT EXISTS hr_profit_messages_created_at_idx ON public.hr_profit_messages (created_at);

-- =============================================================================
-- TABLE: hr_reports
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.hr_reports (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid        NOT NULL UNIQUE
                              REFERENCES public.hr_profit_sessions(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_data   jsonb       NOT NULL DEFAULT '{}',
  pdf_url       text,
  generated_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY hr_reports_select_own ON public.hr_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY hr_reports_insert_own ON public.hr_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY hr_reports_update_own ON public.hr_reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY hr_reports_delete_own ON public.hr_reports
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY hr_reports_admin_all ON public.hr_reports
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

-- Indexes
CREATE INDEX IF NOT EXISTS hr_reports_session_id_idx ON public.hr_reports (session_id);
CREATE INDEX IF NOT EXISTS hr_reports_user_id_idx    ON public.hr_reports (user_id);

-- =============================================================================
-- TABLE: hr_ai_usage
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.hr_ai_usage (
  id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id     uuid         REFERENCES public.hr_profit_sessions(id) ON DELETE SET NULL,
  function_name  text         NOT NULL,
  tokens_used    integer      NOT NULL DEFAULT 0,
  cost_usd       numeric(10,4) DEFAULT 0.0000,
  created_at     timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_ai_usage ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY hr_ai_usage_select_own ON public.hr_ai_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY hr_ai_usage_insert_own ON public.hr_ai_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY hr_ai_usage_update_own ON public.hr_ai_usage
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY hr_ai_usage_delete_own ON public.hr_ai_usage
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY hr_ai_usage_admin_all ON public.hr_ai_usage
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

-- Indexes
CREATE INDEX IF NOT EXISTS hr_ai_usage_user_id_idx    ON public.hr_ai_usage (user_id);
CREATE INDEX IF NOT EXISTS hr_ai_usage_created_at_idx ON public.hr_ai_usage (created_at);

-- =============================================================================
-- TABLE: hr_tags
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.hr_tags (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  description text,
  color       text        DEFAULT '#6366f1',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_tags ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY hr_tags_select_admin ON public.hr_tags
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY hr_tags_insert_admin ON public.hr_tags
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY hr_tags_update_admin ON public.hr_tags
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY hr_tags_delete_admin ON public.hr_tags
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================================================
-- TABLE: hr_client_tags (many-to-many: hr_users ↔ hr_tags)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.hr_client_tags (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_id     uuid        NOT NULL REFERENCES public.hr_tags(id) ON DELETE CASCADE,
  tagged_by  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tag_id)
);

ALTER TABLE public.hr_client_tags ENABLE ROW LEVEL SECURITY;

-- Users can see their own tags; admins can do everything
CREATE POLICY hr_client_tags_select_own ON public.hr_client_tags
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY hr_client_tags_insert_admin ON public.hr_client_tags
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY hr_client_tags_update_admin ON public.hr_client_tags
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY hr_client_tags_delete_admin ON public.hr_client_tags
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

-- Indexes
CREATE INDEX IF NOT EXISTS hr_client_tags_user_id_idx ON public.hr_client_tags (user_id);
CREATE INDEX IF NOT EXISTS hr_client_tags_tag_id_idx  ON public.hr_client_tags (tag_id);

-- =============================================================================
-- TABLE: hr_admin_notes
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.hr_admin_notes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid        NOT NULL
                            REFERENCES public.hr_profit_sessions(id) ON DELETE CASCADE,
  admin_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_text   text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_admin_notes ENABLE ROW LEVEL SECURITY;

-- Append-only admin table — no UPDATE or DELETE
CREATE POLICY hr_admin_notes_select_admin ON public.hr_admin_notes
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY hr_admin_notes_insert_admin ON public.hr_admin_notes
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

-- No UPDATE policy — append-only
CREATE POLICY hr_admin_notes_update_deny ON public.hr_admin_notes
  FOR UPDATE USING (false);

-- No DELETE policy — append-only
CREATE POLICY hr_admin_notes_delete_deny ON public.hr_admin_notes
  FOR DELETE USING (false);

-- Index
CREATE INDEX IF NOT EXISTS hr_admin_notes_session_id_idx ON public.hr_admin_notes (session_id);

-- =============================================================================
-- TABLE: hr_email_log
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.hr_email_log (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type          text        NOT NULL
                                    CHECK (email_type IN (
                                      'signup', 'email_verification', 'session_completion',
                                      'password_reset', 'followup_day1', 'followup_day3',
                                      'followup_abandoned', 'bulk_campaign'
                                    )),
  resend_message_id   text,
  status              text        NOT NULL DEFAULT 'pending'
                                    CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  metadata            jsonb       DEFAULT '{}',
  sent_at             timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_email_log ENABLE ROW LEVEL SECURITY;

-- Admin-only SELECT; system INSERT (no user SELECT)
CREATE POLICY hr_email_log_select_admin ON public.hr_email_log
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

-- System/service inserts — no user-level check needed beyond being authenticated
CREATE POLICY hr_email_log_insert_service ON public.hr_email_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY hr_email_log_update_admin ON public.hr_email_log
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY hr_email_log_delete_admin ON public.hr_email_log
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

-- Indexes
CREATE INDEX IF NOT EXISTS hr_email_log_user_id_idx    ON public.hr_email_log (user_id);
CREATE INDEX IF NOT EXISTS hr_email_log_created_at_idx ON public.hr_email_log (created_at);

-- =============================================================================
-- TABLE: hr_bulk_campaigns
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.hr_bulk_campaigns (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_name    text        NOT NULL,
  email_subject    text        NOT NULL,
  email_body       text        NOT NULL,
  recipient_filter jsonb       NOT NULL DEFAULT '{}',
  recipient_count  integer     NOT NULL DEFAULT 0,
  status           text        NOT NULL DEFAULT 'draft'
                                 CHECK (status IN ('draft', 'sending', 'completed', 'failed')),
  sent_at          timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_bulk_campaigns ENABLE ROW LEVEL SECURITY;

-- Admin-only
CREATE POLICY hr_bulk_campaigns_select_admin ON public.hr_bulk_campaigns
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY hr_bulk_campaigns_insert_admin ON public.hr_bulk_campaigns
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY hr_bulk_campaigns_update_admin ON public.hr_bulk_campaigns
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY hr_bulk_campaigns_delete_admin ON public.hr_bulk_campaigns
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

-- Indexes
CREATE INDEX IF NOT EXISTS hr_bulk_campaigns_created_by_idx ON public.hr_bulk_campaigns (created_by);
CREATE INDEX IF NOT EXISTS hr_bulk_campaigns_status_idx     ON public.hr_bulk_campaigns (status);

-- =============================================================================
-- TABLE: hr_referrals
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.hr_referrals (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id        uuid        UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status             text        NOT NULL DEFAULT 'pending'
                                   CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_granted_at  timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_referrals ENABLE ROW LEVEL SECURITY;

-- Users can see their own referrals (as referrer)
CREATE POLICY hr_referrals_select_own ON public.hr_referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY hr_referrals_insert_own ON public.hr_referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY hr_referrals_update_own ON public.hr_referrals
  FOR UPDATE USING (auth.uid() = referrer_id);

CREATE POLICY hr_referrals_delete_own ON public.hr_referrals
  FOR DELETE USING (auth.uid() = referrer_id);

-- Indexes
CREATE INDEX IF NOT EXISTS hr_referrals_referrer_id_idx ON public.hr_referrals (referrer_id);
CREATE INDEX IF NOT EXISTS hr_referrals_referred_id_idx ON public.hr_referrals (referred_id);

-- =============================================================================
-- TABLE: hr_rate_limits
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.hr_rate_limits (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name  text        NOT NULL,
  tier           text        NOT NULL
                               CHECK (tier IN ('auth', 'read', 'write', 'expensive', 'admin')),
  request_count  integer     NOT NULL DEFAULT 1,
  window_start   timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, function_name, window_start)
);

ALTER TABLE public.hr_rate_limits ENABLE ROW LEVEL SECURITY;

-- No direct user access — managed by middleware
CREATE POLICY hr_rate_limits_select_deny  ON public.hr_rate_limits FOR SELECT USING (false);
CREATE POLICY hr_rate_limits_insert_deny  ON public.hr_rate_limits FOR INSERT WITH CHECK (false);
CREATE POLICY hr_rate_limits_update_deny  ON public.hr_rate_limits FOR UPDATE USING (false);
CREATE POLICY hr_rate_limits_delete_deny  ON public.hr_rate_limits FOR DELETE USING (false);

-- Indexes
CREATE INDEX IF NOT EXISTS hr_rate_limits_user_id_idx      ON public.hr_rate_limits (user_id);
CREATE INDEX IF NOT EXISTS hr_rate_limits_window_start_idx ON public.hr_rate_limits (window_start);

-- =============================================================================
-- TABLE: hr_subscriptions (Phase 5 — created now, not used until later)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.hr_subscriptions (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id       text        UNIQUE,
  stripe_subscription_id   text        UNIQUE,
  status                   text        NOT NULL DEFAULT 'free'
                                         CHECK (status IN ('free', 'active', 'canceled', 'past_due')),
  plan                     text        NOT NULL DEFAULT 'free'
                                         CHECK (plan IN ('free', 'unlimited')),
  current_period_end       timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_subscriptions ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
CREATE TRIGGER hr_subscriptions_updated_at
  BEFORE UPDATE ON public.hr_subscriptions
  FOR EACH ROW EXECUTE FUNCTION hr_set_updated_at();

-- Policies
CREATE POLICY hr_subscriptions_select_own ON public.hr_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY hr_subscriptions_insert_own ON public.hr_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY hr_subscriptions_update_own ON public.hr_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY hr_subscriptions_delete_own ON public.hr_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY hr_subscriptions_admin_all ON public.hr_subscriptions
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================================================
-- TABLE: hr_system_error_logs (observability)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.hr_system_error_logs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  function_name  text        NOT NULL,
  error_message  text        NOT NULL,
  error_detail   text,
  severity       text        NOT NULL
                               CHECK (severity IN ('debug', 'info', 'warn', 'error', 'critical')),
  input_params   jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_system_error_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only SELECT; service INSERT
CREATE POLICY hr_system_error_logs_select_admin ON public.hr_system_error_logs
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY hr_system_error_logs_insert_service ON public.hr_system_error_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY hr_system_error_logs_update_admin ON public.hr_system_error_logs
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY hr_system_error_logs_delete_admin ON public.hr_system_error_logs
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

-- Indexes
CREATE INDEX IF NOT EXISTS hr_system_error_logs_function_name_idx ON public.hr_system_error_logs (function_name);
CREATE INDEX IF NOT EXISTS hr_system_error_logs_severity_idx      ON public.hr_system_error_logs (severity);
CREATE INDEX IF NOT EXISTS hr_system_error_logs_created_at_idx    ON public.hr_system_error_logs (created_at);

-- =============================================================================
-- TABLE: hr_job_runs (observability)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.hr_job_runs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name       text        NOT NULL,
  status         text        NOT NULL CHECK (status IN ('running', 'success', 'failure')),
  output         text,
  error_message  text,
  started_at     timestamptz NOT NULL DEFAULT now(),
  completed_at   timestamptz
);

ALTER TABLE public.hr_job_runs ENABLE ROW LEVEL SECURITY;

-- Admin-only SELECT; service INSERT/UPDATE
CREATE POLICY hr_job_runs_select_admin ON public.hr_job_runs
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY hr_job_runs_insert_service ON public.hr_job_runs
  FOR INSERT WITH CHECK (true);

CREATE POLICY hr_job_runs_update_service ON public.hr_job_runs
  FOR UPDATE USING (true);

CREATE POLICY hr_job_runs_delete_admin ON public.hr_job_runs
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
  );

-- Indexes
CREATE INDEX IF NOT EXISTS hr_job_runs_job_name_idx   ON public.hr_job_runs (job_name);
CREATE INDEX IF NOT EXISTS hr_job_runs_status_idx     ON public.hr_job_runs (status);
CREATE INDEX IF NOT EXISTS hr_job_runs_started_at_idx ON public.hr_job_runs (started_at);
