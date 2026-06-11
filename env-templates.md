# Env Templates

The PRD generator emits these as a single artifact. Extract each fenced block into a real file at the project root, commit both, then create local-only `.env.local` and `.env.test` from these templates and fill in real values.

## .env.example
Copy to: project-root/.env.example   (committed)

```dotenv
# === Frontend (bundled into client JS — must NOT contain secrets) ===
# Used by: src/lib/supabase/client.ts (NEXT_PUBLIC_* prefix is bundled by Next.js)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000

# === Bootstrap script + local admin scripts ===
# Used by: scripts/create-test-users.mjs (no NEXT_PUBLIC_ prefix — server-only)
# These mirror the NEXT_PUBLIC_ values for the supabase-js admin client.
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# === CLI / migrations ===
# Used by: supabase CLI for `supabase db push`, `supabase functions deploy`
# Get from: https://supabase.com/dashboard/account/tokens
SUPABASE_ACCESS_TOKEN=

# === Edge function runtime config ===
# REQUIRED — supabase/functions/_shared/rate-limit.ts throws at module load
# if this is unset (no longer has a default fallback). Set via
# `supabase secrets set RATE_LIMITS_TABLE=hr_rate_limits` before
# deploying any edge function. Silent fail-open is a security bug — every
# rate-limit check would target a nonexistent unprefixed table and pass.
RATE_LIMITS_TABLE=hr_rate_limits

# === Third-party integrations from PRD Section 4 ===
# Integration: Anthropic Claude (Conversational AI)
# Used by: supabase/functions/hr_continue_discovery, hr_generate_report
# Purpose: Powers the PROFIT discovery conversational AI
ANTHROPIC_API_KEY=

# Integration: Resend (Email Delivery)
# Used by: supabase/functions/hr_send_report_email, hr_send_followup, hr_bulk_email
# Purpose: Transactional emails (signup, session completion, report delivery, follow-ups)
RESEND_API_KEY=

# Integration: Stripe (Payment Processing — Phase 5 only, not Phase 1)
# Used by: supabase/functions/hr_create_checkout, hr_stripe_webhook (future)
# Purpose: Freemium paywall (not active in Phase 1)
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=

# === Observability — omitted entirely (Tier 0) ===
# Per PRD Section 8.5: No observability tier specified. If Tier 2 is chosen later,
# add BOTH lines below. The chosen vendor secret (Mailgun/Resend/Postmark) must match
# which integration was named in PRD §4. For HireRight, that's Resend (already above),
# so RESEND_API_KEY serves dual purpose. If implementing Tier 2 alert notifier:
# ALERT_NOTIFIER_SECRET=
```

## .env.test.example
Copy to: project-root/.env.test.example   (committed)
Then:    cp .env.test.example .env.test   (gitignored — fill in real values)

```dotenv
# Test users created by scripts/create-test-users.mjs.
# Both must exist in Supabase Auth before running abuse tests or Playwright.
TEST_USER_A_EMAIL=
TEST_USER_A_PASSWORD=
TEST_USER_B_EMAIL=
TEST_USER_B_PASSWORD=

# Admin test user (for testing admin-only routes and functions)
# User Model is multi-isolated with admin role, so admin test user required.
TEST_ADMIN_EMAIL=
TEST_ADMIN_PASSWORD=
```