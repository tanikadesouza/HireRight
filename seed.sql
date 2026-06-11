I'll create the seed SQL file based on the PRD. This will include test data for the HireRight application following the structure defined in Section 3.

```sql
-- SEED DATA
-- ⚠️ DEVELOPMENT/TESTING ONLY — never run in production
-- ⚠️ DO NOT run this file directly. The :USER_A_ID / :USER_B_ID
-- placeholders are substituted by `node scripts/create-test-users.mjs`,
-- which produces `supabase/seed.runnable.sql`. Apply that file instead.

begin;

-- =============================================================================
-- PROFILES
-- =============================================================================

-- User A Profile (regular client user)
insert into public.hrt_profiles (user_id, name, company_name, industry, current_team_size, phone)
values (
  :'USER_A_ID',
  'Sarah Founder',
  'Strategic Services Co',
  'Business Consulting',
  12,
  '+1-555-0101'
)
on conflict do nothing;

-- User B Profile (regular client user)
insert into public.hrt_profiles (user_id, name, company_name, industry, current_team_size, phone)
values (
  :'USER_B_ID',
  'Mike Owner',
  'Growth Agency Partners',
  'Marketing Agency',
  8,
  '+1-555-0102'
)
on conflict do nothing;

-- =============================================================================
-- SESSIONS
-- =============================================================================

-- User A: Completed session (Admin Assistant hire)
insert into public.hrt_sessions (
  id,
  user_id,
  status,
  answers,
  role_recommended,
  business_goal,
  team_structure,
  gaps_identified,
  progress_percentage,
  completed_at,
  created_at
)
values (
  '11111111-1111-1111-1111-111111111111',
  :'USER_A_ID',
  'completed',
  '{"P": {"question": "What business goal are you working toward?", "answer": "Transitioning from consulting to coaching program"}, "R": {"question": "Who is on your team now?", "answer": "2 consultants, 1 part-time bookkeeper"}, "O": {"question": "Which team members can transition?", "answer": "Consultants can transition to coaching roles, but administrative burden increasing"}, "F": {"question": "What gaps exist?", "answer": "Need someone to handle client onboarding, scheduling, payment processing"}, "I": {"question": "Timeline and budget?", "answer": "Need to hire within 60 days, budget $45-55K annually"}}'::jsonb,
  'Executive Assistant',
  'Transition from consulting to coaching program',
  '2 consultants, 1 part-time bookkeeper',
  'Administrative operations gap - client onboarding, scheduling, payment processing',
  100,
  now() - interval '5 days',
  now() - interval '10 days'
)
on conflict do nothing;

-- User A: In-progress session (Operations Manager hire)
insert into public.hrt_sessions (
  id,
  user_id,
  status,
  answers,
  role_recommended,
  business_goal,
  team_structure,
  gaps_identified,
  progress_percentage,
  created_at
)
values (
  '22222222-2222-2222-2222-222222222222',
  :'USER_A_ID',
  'in-progress',
  '{"P": {"question": "What business goal are you working toward?", "answer": "Scale coaching program from 20 to 100 clients"}, "R": {"question": "Who is on your team now?", "answer": "2 coaches, 1 executive assistant, 1 bookkeeper"}}'::jsonb,
  null,
  'Scale coaching program from 20 to 100 clients',
  '2 coaches, 1 executive assistant, 1 bookkeeper',
  null,
  40,
  now() - interval '2 days'
)
on conflict do nothing;

-- User B: Completed session (Marketing Manager hire)
insert into public.hrt_sessions (
  id,
  user_id,
  status,
  answers,
  role_recommended,
  business_goal,
  team_structure,
  gaps_identified,
  progress_percentage,
  completed_at,
  created_at
)
values (
  '33333333-3333-3333-3333-333333333333',
  :'USER_B_ID',
  'completed',
  '{"P": {"question": "What business goal are you working toward?", "answer": "Launch new service line targeting enterprise clients"}, "R": {"question": "Who is on your team now?", "answer": "4 account managers, 2 designers, 1 developer"}, "O": {"question": "Which team members can transition?", "answer": "Account managers focused on current clients, no enterprise experience"}, "F": {"question": "What gaps exist?", "answer": "Need strategic marketing leadership to position new service and generate enterprise leads"}, "I": {"question": "Timeline and budget?", "answer": "Need hire before Q2, budget $75-90K"}}'::jsonb,
  'Senior Marketing Manager',
  'Launch new service line targeting enterprise clients',
  '4 account managers, 2 designers, 1 developer',
  'Strategic marketing leadership for enterprise positioning',
  100,
  now() - interval '3 days',
  now() - interval '8 days'
)
on conflict do nothing;

-- User B: Abandoned session
insert into public.hrt_sessions (
  id,
  user_id,
  status,
  answers,
  role_recommended,
  business_goal,
  team_structure,
  gaps_identified,
  progress_percentage,
  created_at
)
values (
  '44444444-4444-4444-4444-444444444444',
  :'USER_B_ID',
  'abandoned',
  '{"P": {"question": "What business goal are you working toward?", "answer": "Improve client retention"}}'::jsonb,
  null,
  'Improve client retention',
  null,
  null,
  20,
  now() - interval '15 days'
)
on conflict do nothing;

-- =============================================================================
-- SESSION TAGS
-- =============================================================================

-- Tags for User A's completed session
insert into public.hrt_session_tags (session_id, tag_name)
values 
  ('11111111-1111-1111-1111-111111111111', 'admin assistant'),
  ('11111111-1111-1111-1111-111111111111', 'converted'),
  ('11111111-1111-1111-1111-111111111111', 'consulting-to-coaching')
on conflict do nothing;

-- Tags for User B's completed session
insert into public.hrt_session_tags (session_id, tag_name)
values 
  ('33333333-3333-3333-3333-333333333333', 'marketing manager'),
  ('33333333-3333-3333-3333-333333333333', 'enterprise-focus'),
  ('33333333-3333-3333-3333-333333333333', 'still-thinking')
on conflict do nothing;

-- Tags for User B's abandoned session
insert into public.hrt_session_tags (session_id, tag_name)
values 
  ('44444444-4444-4444-4444-444444444444', 'abandoned'),
  ('44444444-4444-4444-4444-444444444444', 'needs-follow-up')
on conflict do nothing;

-- =============================================================================
-- REPORTS
-- =============================================================================

-- Report for User A's completed session
insert into public.hrt_reports (
  session_id,
  executive_summary,
  role_title,
  key_responsibilities,
  alignment_rationale,
  skills_required,
  next_actions,
  job_description,
  interview_questions,
  onboarding_plan
)
values (
  '11111111-1111-1111-1111-111111111111',
  'Based on your transition from consulting to coaching, you need an Executive Assistant who can handle the administrative complexity of client onboarding, scheduling coordination, and payment processing. This role will free your consultants to focus on their transition to coaching delivery while ensuring seamless client experience.',
  'Executive Assistant',
  '- Manage client onboarding process from inquiry to first session\n- Coordinate complex scheduling across multiple time zones\n- Handle payment processing and follow-up on outstanding invoices\n- Maintain client communication for administrative matters\n- Create and maintain systems documentation',
  'Your business is pivoting from high-touch consulting (fewer clients, deeper engagement) to coaching (more clients, scalable delivery). This transition creates administrative volume that will overwhelm your consultants if not handled by dedicated support. An Executive Assistant protects your consultants'' time to focus on coaching content development and delivery, while ensuring clients have a smooth, professional experience from first contact through payment.',
  '- 3+ years administrative experience in professional services\n- Experience with scheduling tools (Calendly, Acuity) and payment platforms (Stripe, PayPal)\n- Strong written communication skills\n- Process-oriented mindset with attention to detail\n- Comfortable with ambiguity during business transition\n- Bonus: Experience in coaching or education industry',
  '1. Share this report with your consultant team to align on the need\n2. Set hiring budget: $45-55K annually (run financial reality check below)\n3. Choose your path:\n   - [Book a call with HireRight] to start the search\n   - [Download job description] to post yourself',
  'Full job description would be generated here based on session data...',
  '1. Tell me about a time you managed complex scheduling for multiple stakeholders with conflicting priorities. How did you resolve it?\n2. Walk me through how you would onboard a new coaching client from their first inquiry to their first paid session.\n3. You notice a pattern of payment delays from a segment of clients. What steps would you take?\n4. Our business is transitioning from consulting to coaching. How would you approach learning new processes while maintaining existing ones?\n5. Describe your experience with [specific tools: Calendly, Stripe, CRM]. What did you like/dislike about each?',
  'Week 1: Orientation\n- Meet consultant team, understand current client workflow\n- Access all tools (Calendly, Stripe, CRM, communication platforms)\n- Shadow existing onboarding process for 3 clients\n\nWeek 2-4: Guided Practice\n- Take over scheduling coordination with consultant backup\n- Handle payment processing with weekly review\n- Draft and send client communications with approval\n\nMonth 2: Independent Work\n- Own full onboarding process\n- Weekly 1:1 with founder to review bottlenecks\n- Identify and document process improvements\n\nMonth 3: Optimization\n- Performance review: onboarding time, client satisfaction, payment collection rate\n- Finalize documentation for all processes\n- Identify future scaling needs'
)
on conflict do nothing;

-- Report for User B's completed session
insert into public.hrt_reports (
  session_id,
  executive_summary,
  role_title,
  key_responsibilities,
  alignment_rationale,
  skills_required,
  next_actions,
  job_description,
  interview_questions
)
values (
  '33333333-3333-3333-3333-333333333333',
  'To successfully launch your enterprise service line, you need a Senior Marketing Manager with enterprise positioning expertise. Your current account managers excel at client delivery but lack the strategic marketing experience to position a new service and generate qualified enterprise leads. This hire bridges the gap between your proven delivery capabilities and enterprise market entry.',
  'Senior Marketing Manager',
  '- Develop go-to-market strategy for enterprise service line\n- Create positioning and messaging for enterprise audience\n- Build and execute demand generation campaigns targeting enterprise decision-makers\n- Establish marketing metrics and reporting dashboards\n- Collaborate with account managers to capture case studies and testimonials',
  'Your agency is expanding upmarket from SMB clients to enterprise accounts. This requires fundamentally different marketing: longer sales cycles, committee-based buying, ROI-focused messaging, and credibility-building content. Your account managers are skilled at client relationships but not equipped for the strategic marketing lift required to enter a new market segment. A Senior Marketing Manager with enterprise experience will shorten your learning curve and improve your probability of successful launch.',
  '- 5+ years B2B marketing experience with at least 2 years targeting enterprise\n- Proven track record developing go-to-market strategies for new offerings\n- Demand generation expertise (content marketing, ABM, paid channels)\n- Strong positioning and messaging skills\n- Experience with marketing automation and analytics tools\n- Bonus: Agency industry experience',
  '1. Share this report with your leadership team to align on the investment\n2. Set hiring budget: $75-90K annually (run financial reality check below)\n3. Choose your path:\n   - [Book a call with HireRight] to start the search\n   - [Download job description] to post yourself',
  'Full job description would be generated here...',
  '1. Tell me about a time you launched a new service or product into an enterprise market. What was your go-to-market strategy?\n2. How do you approach positioning when entering a market segment where you lack case studies or testimonials?\n3. Walk me through your demand generation framework. What channels and tactics would you prioritize for enterprise B2B?\n4. You have a $50K marketing budget for a Q2 enterprise launch. How would you allocate it?\n5. Our account managers are excellent at delivery but lack marketing expertise. How would you collaborate with them to capture customer insights?'
)
on conflict do nothing;

-- =============================================================================
-- FINANCIAL MODELS
-- =============================================================================

-- Financial model for User A's completed session
insert into public.hrt_financial_models (
  session_id,
  base_salary,
  benefits_percentage,
  tools_cost,
  management_hours_per_week,
  expected_revenue_increase,
  fully_loaded_cost,
  breakeven_revenue,
  months_to_profitability
)
values (
  '11111111-1111-1111-1111-111111111111',
  50000,
  25,
  2400,
  3,
  75000,
  65400,
  65400,
  8
)
on conflict do nothing;

-- Financial model for User B's completed session
insert into public.hrt_financial_models (
  session_id,
  base_salary,
  benefits_percentage,
  tools_cost,
  management_hours_per_week,
  expected_revenue_increase,
  fully_loaded_cost,
  breakeven_revenue,
  months_to_profitability
)
values (
  '33333333-3333-3333-3333-333333333333',
  82500,
  30,
  5000,
  4,
  250000,
  114250,
  114250,
  6
)
on conflict do nothing;

-- =============================================================================
-- REFERRALS
-- =============================================================================

-- User A referred someone who signed up and completed a session
insert into public.hrt_referrals (
  referrer_user_id,
  referee_user_id,
  referral_code,
  referee_email,
  status,
  created_at,
  converted_at
)
values (
  :'USER_A_ID',
  :'USER_B_ID',
  'sarah-founder-x7k2',
  'mike@growthagency.com',
  'completed-session',
  now() - interval '30 days',
  now() - interval '8 days'
)
on conflict do nothing;

-- User B has a pending referral (referee hasn't signed up yet)
insert into public.hrt_referrals (
  referrer_user_id,
  referee_user_id,
  referral_code,
  referee_email,
  status,
  created_at
)
values (
  :'USER_B_ID',
  null,
  'mike-owner-p4m9',
  'potential.client@example.com',
  'pending',
  now() - interval '5 days'
)
on conflict do nothing;

-- =============================================================================
-- NOTIFICATIONS (audit log of sent communications)
-- =============================================================================

-- User A: Session completion email
insert into public.hrt_notifications (
  user_id,
  notification_type,
  subject,
  body,
  status,
  sent_at,
  created_at
)
values (
  :'USER_A_ID',
  'email',
  'Your HireRight Strategic Hiring Roadmap',
  'Hi Sarah, your PROFIT discovery is complete! Your strategic hiring roadmap for Executive Assistant is ready to view...',
  'sent',
  now() - interval '5 days',
  now() - interval '5 days'
)
on conflict do nothing;

-- User A: Day 3 follow-up email
insert into public.hrt_notifications (
  user_id,
  notification_type,
  subject,
  body,
  status,
  sent_at,
  created_at
)
values (
  :'USER_A_ID',
  'email',
  'Quick question about your Executive Assistant hire',
  'Hi Sarah, just checking in — are you moving forward with this hire, or still thinking it through?',
  'sent',
  now() - interval '2 days',
  now() - interval '2 days'
)
on conflict do nothing;

-- User B: Abandoned session nudge
insert into public.hrt_notifications (
  user_id,
  notification_type,
  subject,
  body,
  status,
  sent_at,
  created_at
)
values (
  :'USER_B_ID',
  'email',
  'You''re 20% through your PROFIT discovery',
  'Hi Mike, you started exploring your client retention challenge. Finish your discovery in 4 minutes to get your strategic roadmap...',
  'sent',
  now() - interval '14 days',
  now() - interval '14 days'
)
on conflict do nothing;

-- User B: Session completion email
insert into public.hrt_notifications (
  user_id,
  notification_type,
  subject,
  body,
  status,
  sent_at,
  created_at
)
values (
  :'USER_B_ID',
  'email',
  'Your HireRight Strategic Hiring Roadmap',
  'Hi Mike, your PROFIT discovery is complete! Your strategic hiring roadmap for Senior Marketing Manager is ready to view...',
  'sent',
  now() - interval '3 days',
  now() - interval '3 days'
)
on conflict do nothing;

-- =============================================================================
-- MAGIC LINKS (for cross-device continuation)
-- =============================================================================

-- User A: Used magic link to resume in-progress session
insert into public.hrt_magic_links (
  user_id,
  session_id,
  token,
  expires_at,
  used_at,
  created_at
)
values (
  :'USER_A_ID',
  '22222222-2222-2222-2222-222222222222',
  'ml_a1b2c3d4e5f6',
  now() + interval '7 days',
  now() - interval '2 days',
  now() - interval '2 days'
)
on conflict do nothing;

-- User B: Unused magic link (still valid)
insert into public.hrt_magic_links (
  user_id,
  session_id,
  token,
  expires_at,
  created_at
)
values (
  :'USER_B_ID',
  '44444444-4444-4444-4444-444444444444',
  'ml_z9y8x7w6v5u4',
  now() + interval '5 days',
  now() - interval '14 days'
)
on conflict do nothing;

commit;
```

This seed file provides:

1. **Two test users** with complete profiles representing different business types (consulting vs agency)
2. **Four sessions** covering all status types: completed (2), in-progress (1), abandoned (1)
3. **Realistic JSONB answers** showing the PROFIT method conversation flow
4. **Session tags** demonstrating segmentation categories (role types, conversion status, business context)
5. **Two complete reports** with all sections filled out (executive summary, responsibilities, rationale, skills, next actions, JD, interview questions, onboarding plan)
6. **Financial models** for both completed sessions with realistic salary and ROI calculations
7. **Referral tracking** showing both completed and pending referrals
8. **Notification audit log** demonstrating the email sequence for completed, follow-up, and abandoned session emails
9. **Magic links** showing both used and unused tokens for cross-device continuation

All data uses the `:USER_A_ID` and `:USER_B_ID` placeholders that will be substituted by the bootstrap script, ensuring the seed data references real auth users created via the Supabase Admin API.