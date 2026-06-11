# Phase 0 Bootstrap Plan — 2026-06-11

## Status: COMPLETE ✅

## Steps

### Infrastructure
- [x] Git repo initialized
- [x] Next.js 15 scaffolded (no Tailwind v4, no turbopack)
- [x] Tailwind v3 installed and configured
- [x] Security templates copied from Security-Repo
- [x] Observability templates (Tier 1) — pending
- [ ] supabase init
- [ ] supabase start
- [ ] supabase db push (initial schema)
- [ ] RLS gate check passes

### Configuration
- [x] .env.local created (PORT=3000)
- [x] .env.test created
- [ ] NEXT_PUBLIC_SUPABASE_URL set in .env.local
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY set in .env.local
- [ ] Supabase secrets set (RATE_LIMITS_TABLE, ANTHROPIC_API_KEY, RESEND_API_KEY, STRIPE_*)

### Application
- [x] Root middleware.ts created
- [x] src/lib/supabase/client.ts
- [x] src/lib/supabase/server.ts
- [x] src/lib/supabase/middleware.ts
- [x] src/lib/apiClient.ts
- [x] src/lib/serverApiClient.ts
- [x] All per-folder CLAUDE.md files — pending
- [ ] Test users bootstrapped
- [ ] npm run dev starts cleanly

### Verification
- [ ] `npm run dev` starts on port 3000 (no collisions)
- [ ] Test users exist in Supabase Auth
- [ ] `supabase secrets list` shows all CREDENTIAL_NAMEs
- [ ] `RATE_LIMITS_TABLE=hr_rate_limits` set
