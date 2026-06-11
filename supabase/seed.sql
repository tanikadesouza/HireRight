-- SEED DATA
-- Development/testing only — never run in production
-- :USER_A_ID and :USER_B_ID are substituted by scripts/create-test-users.mjs
-- which produces supabase/seed.runnable.sql. Apply that file instead.

BEGIN;

-- =============================================================================
-- hr_users (profiles)
-- Note: hr_handle_new_user trigger auto-inserts on auth.users creation.
-- These upserts patch in extra profile data the trigger doesn't know.
-- =============================================================================

INSERT INTO public.hr_users (id, email, full_name, role, referral_code)
VALUES (
  :'USER_A_ID',
  'sarah@strategicservices.com',
  'Sarah Founder',
  'client',
  'sarah-founder-x7k2'
)
ON CONFLICT (id) DO UPDATE
  SET full_name     = EXCLUDED.full_name,
      referral_code = EXCLUDED.referral_code,
      updated_at    = now();

INSERT INTO public.hr_users (id, email, full_name, role, referral_code, referred_by)
VALUES (
  :'USER_B_ID',
  'mike@growthagency.com',
  'Mike Owner',
  'client',
  'mike-owner-p4m9',
  :'USER_A_ID'
)
ON CONFLICT (id) DO UPDATE
  SET full_name     = EXCLUDED.full_name,
      referral_code = EXCLUDED.referral_code,
      referred_by   = EXCLUDED.referred_by,
      updated_at    = now();

-- =============================================================================
-- hr_profit_sessions
-- =============================================================================

-- User A: Completed session — Admin Assistant hire
INSERT INTO public.hr_profit_sessions (
  id,
  user_id,
  status,
  current_step,
  session_data,
  report_generated,
  completed_at,
  created_at,
  updated_at
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  :'USER_A_ID',
  'completed',
  'implement',
  '{
    "pinpoint": {
      "question": "What business goal are you working toward?",
      "answer": "Transitioning from consulting to coaching program"
    },
    "revamp": {
      "question": "Who is on your team now?",
      "answer": "2 consultants, 1 part-time bookkeeper"
    },
    "optimize": {
      "question": "Which team members can transition?",
      "answer": "Consultants can transition to coaching roles, but administrative burden increasing"
    },
    "fill": {
      "question": "What gaps exist?",
      "answer": "Need someone to handle client onboarding, scheduling, payment processing"
    },
    "implement": {
      "question": "Timeline and budget?",
      "answer": "Need to hire within 60 days, budget $45-55K annually"
    },
    "role_recommended": "Executive Assistant",
    "business_goal": "Transition from consulting to coaching program"
  }'::jsonb,
  true,
  now() - INTERVAL '5 days',
  now() - INTERVAL '10 days',
  now() - INTERVAL '5 days'
)
ON CONFLICT (id) DO NOTHING;

-- User A: In-progress session — Operations Manager hire
INSERT INTO public.hr_profit_sessions (
  id,
  user_id,
  status,
  current_step,
  session_data,
  report_generated,
  created_at,
  updated_at
)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  :'USER_A_ID',
  'in_progress',
  'revamp',
  '{
    "pinpoint": {
      "question": "What business goal are you working toward?",
      "answer": "Scale coaching program from 20 to 100 clients"
    },
    "revamp": {
      "question": "Who is on your team now?",
      "answer": "2 coaches, 1 executive assistant, 1 bookkeeper"
    }
  }'::jsonb,
  false,
  now() - INTERVAL '2 days',
  now() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- User B: Completed session — Marketing Manager hire
INSERT INTO public.hr_profit_sessions (
  id,
  user_id,
  status,
  current_step,
  session_data,
  report_generated,
  completed_at,
  created_at,
  updated_at
)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  :'USER_B_ID',
  'completed',
  'implement',
  '{
    "pinpoint": {
      "question": "What business goal are you working toward?",
      "answer": "Launch new service line targeting enterprise clients"
    },
    "revamp": {
      "question": "Who is on your team now?",
      "answer": "4 account managers, 2 designers, 1 developer"
    },
    "optimize": {
      "question": "Which team members can transition?",
      "answer": "Account managers focused on current clients, no enterprise experience"
    },
    "fill": {
      "question": "What gaps exist?",
      "answer": "Need strategic marketing leadership to position new service and generate enterprise leads"
    },
    "implement": {
      "question": "Timeline and budget?",
      "answer": "Need hire before Q2, budget $75-90K"
    },
    "role_recommended": "Senior Marketing Manager",
    "business_goal": "Launch new service line targeting enterprise clients"
  }'::jsonb,
  true,
  now() - INTERVAL '3 days',
  now() - INTERVAL '8 days',
  now() - INTERVAL '3 days'
)
ON CONFLICT (id) DO NOTHING;

-- User B: Abandoned session
INSERT INTO public.hr_profit_sessions (
  id,
  user_id,
  status,
  current_step,
  session_data,
  report_generated,
  created_at,
  updated_at
)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  :'USER_B_ID',
  'abandoned',
  'pinpoint',
  '{
    "pinpoint": {
      "question": "What business goal are you working toward?",
      "answer": "Improve client retention"
    }
  }'::jsonb,
  false,
  now() - INTERVAL '15 days',
  now() - INTERVAL '15 days'
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- hr_reports
-- =============================================================================

-- Report for User A's completed session
INSERT INTO public.hr_reports (
  session_id,
  user_id,
  report_data,
  generated_at,
  created_at
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  :'USER_A_ID',
  '{
    "role_title": "Executive Assistant",
    "executive_summary": "Based on your transition from consulting to coaching, you need an Executive Assistant who can handle the administrative complexity of client onboarding, scheduling coordination, and payment processing.",
    "key_responsibilities": [
      "Manage client onboarding process from inquiry to first session",
      "Coordinate complex scheduling across multiple time zones",
      "Handle payment processing and follow-up on outstanding invoices",
      "Maintain client communication for administrative matters"
    ],
    "skills_required": [
      "3+ years administrative experience in professional services",
      "Experience with scheduling tools (Calendly, Acuity) and payment platforms",
      "Strong written communication skills",
      "Process-oriented mindset with attention to detail"
    ],
    "salary_range": { "min": 45000, "max": 55000 },
    "financial_model": {
      "base_salary": 50000,
      "benefits_percentage": 25,
      "tools_cost": 2400,
      "fully_loaded_cost": 65400,
      "expected_revenue_increase": 75000,
      "months_to_profitability": 8
    },
    "next_actions": [
      "Share this report with your consultant team to align on the need",
      "Set hiring budget: $45-55K annually",
      "Post job description or book a call with HireRight"
    ]
  }'::jsonb,
  now() - INTERVAL '5 days',
  now() - INTERVAL '5 days'
)
ON CONFLICT (session_id) DO NOTHING;

-- Report for User B's completed session
INSERT INTO public.hr_reports (
  session_id,
  user_id,
  report_data,
  generated_at,
  created_at
)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  :'USER_B_ID',
  '{
    "role_title": "Senior Marketing Manager",
    "executive_summary": "To successfully launch your enterprise service line, you need a Senior Marketing Manager with enterprise positioning expertise.",
    "key_responsibilities": [
      "Develop go-to-market strategy for enterprise service line",
      "Create positioning and messaging for enterprise audience",
      "Build and execute demand generation campaigns targeting enterprise decision-makers",
      "Establish marketing metrics and reporting dashboards"
    ],
    "skills_required": [
      "5+ years B2B marketing experience with at least 2 years targeting enterprise",
      "Proven track record developing go-to-market strategies",
      "Demand generation expertise (content marketing, ABM, paid channels)",
      "Experience with marketing automation and analytics tools"
    ],
    "salary_range": { "min": 75000, "max": 90000 },
    "financial_model": {
      "base_salary": 82500,
      "benefits_percentage": 30,
      "tools_cost": 5000,
      "fully_loaded_cost": 114250,
      "expected_revenue_increase": 250000,
      "months_to_profitability": 6
    },
    "next_actions": [
      "Share this report with your leadership team to align on the investment",
      "Set hiring budget: $75-90K annually",
      "Post job description or book a call with HireRight"
    ]
  }'::jsonb,
  now() - INTERVAL '3 days',
  now() - INTERVAL '3 days'
)
ON CONFLICT (session_id) DO NOTHING;

-- =============================================================================
-- hr_tags (admin-managed tag library)
-- =============================================================================

INSERT INTO public.hr_tags (id, name, description, color)
VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', 'admin-assistant',        'Sessions targeting an admin assistant hire',    '#6366f1'),
  ('aaaaaaaa-0001-0001-0001-000000000002', 'marketing-manager',      'Sessions targeting a marketing manager hire',   '#10b981'),
  ('aaaaaaaa-0001-0001-0001-000000000003', 'converted',              'User has booked a call or hired via HireRight', '#f59e0b'),
  ('aaaaaaaa-0001-0001-0001-000000000004', 'enterprise-focus',       'Enterprise-oriented hiring need',               '#3b82f6'),
  ('aaaaaaaa-0001-0001-0001-000000000005', 'consulting-to-coaching', 'Business model transition context',             '#8b5cf6'),
  ('aaaaaaaa-0001-0001-0001-000000000006', 'needs-follow-up',        'Flagged for manual follow-up by admin',         '#ef4444'),
  ('aaaaaaaa-0001-0001-0001-000000000007', 'abandoned',              'Session was abandoned mid-flow',                '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- hr_referrals
-- =============================================================================

-- User A referred User B (completed)
INSERT INTO public.hr_referrals (
  referrer_id,
  referred_id,
  status,
  reward_granted_at,
  created_at
)
VALUES (
  :'USER_A_ID',
  :'USER_B_ID',
  'completed',
  now() - INTERVAL '3 days',
  now() - INTERVAL '30 days'
)
ON CONFLICT (referred_id) DO NOTHING;

-- =============================================================================
-- hr_email_log
-- =============================================================================

-- User A: Session completion email
INSERT INTO public.hr_email_log (user_id, email_type, status, sent_at, created_at)
VALUES (
  :'USER_A_ID',
  'session_completion',
  'sent',
  now() - INTERVAL '5 days',
  now() - INTERVAL '5 days'
)
ON CONFLICT DO NOTHING;

-- User A: Day 3 follow-up email
INSERT INTO public.hr_email_log (user_id, email_type, status, sent_at, created_at)
VALUES (
  :'USER_A_ID',
  'followup_day3',
  'sent',
  now() - INTERVAL '2 days',
  now() - INTERVAL '2 days'
)
ON CONFLICT DO NOTHING;

-- User B: Abandoned session follow-up
INSERT INTO public.hr_email_log (user_id, email_type, status, sent_at, created_at)
VALUES (
  :'USER_B_ID',
  'followup_abandoned',
  'sent',
  now() - INTERVAL '14 days',
  now() - INTERVAL '14 days'
)
ON CONFLICT DO NOTHING;

-- User B: Session completion email
INSERT INTO public.hr_email_log (user_id, email_type, status, sent_at, created_at)
VALUES (
  :'USER_B_ID',
  'session_completion',
  'sent',
  now() - INTERVAL '3 days',
  now() - INTERVAL '3 days'
)
ON CONFLICT DO NOTHING;

COMMIT;
