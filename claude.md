# HireRight — CLAUDE.md

Prefix: hr_
Architecture type: Dashboard
Single-user: no
Security templates repo: https://github.com/atibadesouza/Security-Repo

---

## Setup

Run these commands in order. Do not skip any step.

1. Clone security templates:
   ```bash
   git clone https://github.com/atibadesouza/Security-Repo /tmp/security-templates
   ```

2. Initialize project (Next.js with Tailwind v3):
   ```bash
   # Step 2a: scaffold WITHOUT --tailwind (default would be v4)
   npx create-next-app@15 . \
     --typescript --eslint --app --src-dir --import-alias "@/*" \
     --no-tailwind --no-turbopack

   # Step 2b: install Tailwind v3 explicitly
   npm i -D tailwindcss@^3.4 postcss autoprefixer
   npx tailwindcss init -p
   ```

   Then add this to `src/app/globals.css`:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

3. Copy security scaffolding:
   ```bash
   cp -r /tmp/security-templates/_shared/                       supabase/functions/_shared/
   mkdir -p src/lib/supabase
   cp    /tmp/security-templates/client/supabaseClient.ts       src/lib/supabase/client.ts
   cp    /tmp/security-templates/client/supabaseServerClient.ts src/lib/supabase/server.ts
   cp    /tmp/security-templates/client/middleware.ts           src/lib/supabase/middleware.ts
   cp    /tmp/security-templates/client/apiClient.ts            src/lib/apiClient.ts
   cp    /tmp/security-templates/client/serverApiClient.ts      src/lib/serverApiClient.ts
   cp    /tmp/security-templates/scripts/_supabase-node-client.mjs scripts/_supabase-node-client.mjs
   cp    /tmp/security-templates/scripts/start-dev.mjs               scripts/start-dev.mjs
   cp    /tmp/security-templates/scripts/verify-login-flow.mjs       scripts/verify-login-flow.mjs
   cp    /tmp/security-templates/scripts/verify-layer-boundaries.mjs scripts/verify-layer-boundaries.mjs
   cp    /tmp/security-templates/scripts/verify-cors-on-errors.mjs   scripts/verify-cors-on-errors.mjs
   cp    /tmp/security-templates/scripts/verify-test-coverage.mjs    scripts/verify-test-coverage.mjs
   cp    /tmp/security-templates/scripts/verify-test-realness.mjs    scripts/verify-test-realness.mjs
   mkdir -p tests/fixtures tests/e2e/auth
   cp    /tmp/security-templates/tests/fixtures/sample.csv          tests/fixtures/sample.csv
   cp    /tmp/security-templates/tests/fixtures/sample.vcf          tests/fixtures/sample.vcf
   cp    /tmp/security-templates/tests/fixtures/sample.ics          tests/fixtures/sample.ics
   cp    /tmp/security-templates/tests/fixtures/README.md           tests/fixtures/README.md
   cp    /tmp/security-templates/tests/e2e/auth/auth-flow.spec.ts   tests/e2e/auth/auth-flow.spec.ts
   cp    /tmp/security-templates/tests/coverage-manifest.template.json tests/coverage-manifest.json
   mkdir -p docs/plans
   cp    /tmp/security-templates/docs/plans/phase-0-bootstrap.template.md \
         docs/plans/$(date +%Y-%m-%d)-phase-0-bootstrap.md
   cp    /tmp/security-templates/.gitignore        .gitignore
   cp    /tmp/security-templates/.env.example      .env.example
   cp    /tmp/security-templates/.env.test.example .env.test.example
   cp    /tmp/security-templates/ci/pre-commit-hook.sh .git/hooks/pre-commit
   chmod +x .git/hooks/pre-commit
   mkdir -p .github/workflows .semgrep
   cp    /tmp/security-templates/ci/github-actions.yml .github/workflows/security-checks.yml
   cp    /tmp/security-templates/ci/semgrep-rules.yml  .semgrep/semgrep-rules.yml
   cp    /tmp/security-templates/tests/abuse-test.ts   tests/abuse-test.ts
   cp    /tmp/security-templates/sql/rls-gate-check.sql sql/rls-gate-check.sql
   ```

   Then create middleware.ts at the repo root:
   ```typescript
   // middleware.ts
   import { type NextRequest } from "next/server";
   import { updateSession } from "@/lib/supabase/middleware";

   export async function middleware(request: NextRequest) {
     return updateSession(request);
   }

   export const config = {
     matcher: [
       "/((?!_next/static|_next/image|favicon.ico|auth/signout).*)",
     ],
   };
   ```

3a. Create local env files from templates:
    ```bash
    cp .env.example .env.local
    cp .env.test.example .env.test
    # Fill in real values in .env.local (never commit this file)
    # Confirm with: git check-ignore .env.local .env.test
    ```

3b. Clone observability templates (Tier 1):
    ```bash
    git clone https://github.com/atibadesouza/Observability-Repo /tmp/observability-templates

    # Tier 1 utilities
    cp /tmp/observability-templates/functions/_shared/error-logger.ts supabase/functions/_shared/
    cp /tmp/observability-templates/functions/_shared/job-logger.ts   supabase/functions/_shared/
    cp /tmp/observability-templates/functions/_shared/severity.ts     supabase/functions/_shared/
    ```

4. Initialize Supabase:
   ```bash
   supabase init
   ```
   Copy the seed migration SQL into `supabase/migrations/20240101000000_initial_schema.sql`

5. Start local Supabase:
   ```bash
   supabase start
   ```

6. Apply migrations:
   ```bash
   supabase db push
   ```

7. Verify security gates:
   ```bash
   psql $(supabase status -o env | grep DATABASE_URL | cut -d= -f2-) -f sql/rls-gate-check.sql --set ON_ERROR_STOP=1
   ```

8. Install dependencies:
   ```bash
   npm install @supabase/ssr @supabase/supabase-js zod stripe resend
   ```

8c. Install Superpowers (agentic methodology):
    ```
    /plugin install superpowers@claude-plugins-official
    ```

9. Bootstrap test users + apply seed data:
   ```bash
   node scripts/create-test-users.mjs
   psql $(supabase status -o env | grep DATABASE_URL | cut -d= -f2-) -f supabase/seed.runnable.sql
   ```

10. Create empty PITFALLS.md scaffold:
    ```bash
    mkdir -p docs/reference
    cat > docs/reference/PITFALLS.md <<'EOF'
    # PITFALLS.md

    > Project-specific gotchas, root-cause notes, and "don't do this"
    > reminders. Auto-maintained by the post-commit-pitfalls hook.

    _No pitfalls recorded yet._
    EOF
    ```

11. Write per-folder CLAUDE.md files (see Section 4 below for full content)

12. Extract .env templates:
    ```bash
    # Already copied in step 3a — verify they exist:
    ls -la .env.example .env.test.example
    ```

13a. Copy ADR template:
    ```bash
    mkdir -p docs/decisions
    cp /tmp/security-templates/docs/decisions/0000-template.md \
       docs/decisions/0000-template.md
    ```

13. Configure runtime secrets:
    ```bash
    # Rate limits table reference
    supabase secrets set RATE_LIMITS_TABLE=hr_rate_limits

    # Anthropic API key for Claude AI (conversational discovery)
    supabase secrets set ANTHROPIC_API_KEY=your_anthropic_key_here

    # Resend API key for transactional emails
    supabase secrets set RESEND_API_KEY=your_resend_key_here

    # Stripe keys for payment processing (future freemium)
    supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key_here
    supabase secrets set STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
    ```

---

## Rules

1. NEVER use the service_role key in application code. It exists only in test scripts and isolated admin functions.

2. NEVER accept user_id from request bodies, query parameters, headers, or any client-provided source. User identity is ALWAYS derived from the JWT via auth.uid() (database) or requireAuth() (edge functions).

3. NEVER create a table without enabling RLS and adding all four policies (SELECT, INSERT, UPDATE, DELETE) scoped to auth.uid().

4. NEVER create an edge function without the full middleware chain: handlePreflight → requireAuth → rateLimit → validateBody → createUserClient → safeError

5. NEVER create a public storage bucket. All buckets are private. All file access uses signed URLs.

6. NEVER return raw database errors to the client. Use safeError() to sanitize all error responses.

7. NEVER use string interpolation in SQL. All queries are parameterized.

8. NEVER use SECURITY DEFINER on Postgres functions unless explicitly justified in the PRD. Default is SECURITY INVOKER.

9. NEVER bypass RLS by using service_role or by setting roles directly.

10. NEVER hardcode secrets, API keys, or credentials in source code. Use Deno.env.get() for edge functions. Use NEXT_PUBLIC_* prefix for public frontend env vars. All third-party credentials live in Supabase Vault.

11. NEVER skip input validation. Every endpoint that accepts a request body — Supabase edge function OR Next.js Route Handler — MUST validate with Zod before touching the database. Edge functions use validateBody() from _shared/validate.ts; Route Handlers parse via Schema.parse(await req.json()).

12. NEVER use select("*") in production code. Always specify the exact columns needed.

13. ALWAYS prefix all tables, policies, indexes, functions, triggers, and storage buckets with hr_.

14. ALWAYS create migrations for schema changes. Never modify the database directly.

15. ALWAYS test that User A cannot access User B's data before marking any feature complete.

16. NEVER call a third-party API from the frontend. All external API calls are made exclusively from edge functions. API keys must never appear in client-side code or responses.

17. NEVER call a third-party API using an endpoint, auth method, or payload shape not specified in Section 6.5 of this document. Do not invent or assume API contracts.

18. NEVER delete an uploaded file if external processing fails. Set the record status to 'processing_failed', expose a retry mechanism in the UI, and log the failure with: file path, external service response code, and timestamp.

19. NEVER treat storage success and processing success as the same event. They are two separate operations with two separate failure modes. Handle each independently.

20. ALWAYS wrap every external API call in a try/catch. Never allow a third-party service failure to propagate as an unhandled 500. Return the sanitized error behavior specified in Section 6.5.

21. NEVER make a direct Supabase or database call from the Presentation layer. Presentation = anything in app/ and components/. These files MUST NOT contain the substring supabase in any import path. Every read and write goes through a function exported from lib/services/*. Enforced by scripts/verify-layer-boundaries.mjs.

22. NEVER call a third-party API from the Service layer. The Service layer (lib/services/*) talks only to Supabase and to edge functions via apiClient. External HTTP calls happen exclusively inside edge functions.

23. ALWAYS keep the three layers cleanly separated: Presentation (app/, components/) → Service (lib/services/) → Agent (supabase/functions/). Data flows downward; responses flow back upward.

24. ALWAYS verify a fix end-to-end before claiming it complete. Type-checking and test suites verify code correctness, not feature correctness.

25. ALWAYS run the relevant test suite after every change. Do not wait to be reminded.

26. ALWAYS use available credentials to take destructive Supabase actions yourself when the project demands them. Do NOT ask the user to run these actions when you have the credentials to do them.

27. NEVER pin a model snapshot with a date suffix (e.g., claude-3-5-sonnet-20241022). Use the family alias only (claude-sonnet-4-5) and add an "as of YYYY-MM" comment.

28. NEVER read or update PITFALLS.md by hand. The post-commit-pitfalls hook maintains docs/reference/PITFALLS.md automatically.

29. ALWAYS save plans to docs/plans/YYYY-MM-DD-<slug>.md before presenting them in chat.

30. ALWAYS revise plans by overwriting the existing plan file. NEVER create *-v2.md or *-revised.md. Append a "## Review log" section at the bottom.

31. ALWAYS use createBrowserClient from @supabase/ssr for browser code via src/lib/supabase/client.ts. NEVER use createClient from @supabase/supabase-js directly.

32. Server Actions, Route Handlers, and Server Components MUST invoke edge functions through serverApiCall from @/lib/serverApiClient — NOT through apiCall.

33. Every edge function that creates or updates a record MUST use checkIdempotency from _shared/idempotency.ts before starting work.

34. For form submissions that need error handling, use useState(isPending) + try/finally — NOT useTransition.

35. Files > 1MB go from the client DIRECTLY to Supabase Storage, NEVER through a Server Action.

36. The signout Route Handler MUST explicitly clear all sb-* cookies before redirecting. Middleware MUST exempt /auth/signout from authenticated-redirect logic.

37. When you make a non-obvious decision during the build, write an ADR in docs/decisions/<NNNN>-<slug>.md using the template at docs/decisions/0000-template.md.

38. NEVER log PHI/PII in error logs or analytics. This includes: user names, email addresses, company names, strategic plans, financial data, hiring decisions. Log shape, not contents: { record_id, action, timestamp } instead of { user_input: "..." }.

39. ALWAYS use the Anthropic Messages API (not legacy Completions API) when calling Claude. The conversational discovery flow requires multi-turn context preservation.

40. ALWAYS enforce rate limits on AI-powered endpoints. The hr_ai_usage table tracks token consumption per user. Block requests that exceed daily limits.

41. NEVER expose raw AI responses to clients without validation. AI outputs must be parsed and validated against expected schemas before delivery.

42. ALWAYS preserve conversation history in hr_profit_sessions. Each user message and AI response is stored as a separate hr_profit_messages row for audit and retry.

43. NEVER allow users to inject system prompts or override AI instructions. User input is treated as conversation content only, never as instructions to the AI.

44. ALWAYS implement the "Save & Resume" pattern for long-form AI conversations. Users must be able to pause and continue sessions across devices.

45. NEVER charge users without explicit confirmation. The freemium paywall (future Phase 5) requires opt-in before processing payment.

---

## File Map

### Security (DO NOT MODIFY — copied from security templates)
- supabase/functions/_shared/auth.ts        → JWT verification + user derivation
- supabase/functions/_shared/rate-limit.ts  → Rate limiting middleware
- supabase/functions/_shared/cors.ts        → CORS handling
- supabase/functions/_shared/validate.ts    → Zod input validation
- supabase/functions/_shared/error-handler.ts → Sanitized error responses
- supabase/functions/_shared/idempotency.ts → Idempotency checking
- src/lib/supabase/client.ts                → Cookie-based browser client (@supabase/ssr)
- src/lib/supabase/server.ts                → Server-side client factory
- src/lib/supabase/middleware.ts            → Session refresh middleware
- src/lib/apiClient.ts                      → Edge function caller (browser)
- src/lib/serverApiClient.ts                → Edge function caller (server)

### Observability (Tier 1)
- supabase/functions/_shared/error-logger.ts → Error logging utility
- supabase/functions/_shared/job-logger.ts   → Cron job tracking
- supabase/functions/_shared/severity.ts     → Severity type definitions

### Database
- supabase/migrations/20240101000000_initial_schema.sql → Tables, RLS, policies, indexes, observability schema

### Deployment
- docs/deployment/MANUAL_SQL_OPERATIONS.md → Manual SQL operations checklist per environment

### Agent Layer (supabase/functions/) — external API + AI orchestration
- supabase/functions/hr_profit_discovery/index.ts → Conversational AI discovery using Claude
- supabase/functions/hr_financial_calculator/index.ts → ROI and break-even analysis
- supabase/functions/hr_salary_benchmark/index.ts → Market rate data retrieval
- supabase/functions/hr_job_description_generator/index.ts → AI-powered JD creation
- supabase/functions/hr_interview_questions/index.ts → Role-specific question generation
- supabase/functions/hr_send_report/index.ts → Email delivery via Resend
- supabase/functions/hr_stripe_webhook/index.ts → Payment processing (future Phase 5)

RULE: These are the ONLY places that call third-party APIs (Anthropic, Resend, Stripe). They are called from the Service layer via apiClient/serverApiCall.

### Service Layer (lib/services/) — business logic + DB access
- src/lib/services/auth.ts → Authentication state management
- src/lib/services/profit-sessions.ts → PROFIT session CRUD
- src/lib/services/users.ts → User profile management
- src/lib/services/admin.ts → Admin dashboard queries
- src/lib/services/referrals.ts → Referral tracking
- src/lib/services/payments.ts → Subscription management (future)

RULE: Presentation code imports FROM here. This layer never touches third-party HTTP APIs directly.

### Presentation Layer (app/ + components/) — UI only
- src/app/page.tsx → Landing page (educational PROFIT content, ungated)
- src/app/login/page.tsx → Sign in
- src/app/signup/page.tsx → Create account
- src/app/forgot-password/page.tsx → Request password reset
- src/app/reset-password/page.tsx → Set new password
- src/app/auth/callback/route.ts → Supabase Auth redirect handler
- src/app/auth/signout/route.ts → Sign out endpoint
- src/app/settings/account/page.tsx → Account settings
- src/app/dashboard/page.tsx → User dashboard (session history)
- src/app/profit/page.tsx → PROFIT discovery interface
- src/app/profit/[sessionId]/page.tsx → View saved session
- src/app/admin/page.tsx → Admin dashboard (role-gated)
- src/app/admin/sessions/page.tsx → All user sessions list
- src/app/admin/users/page.tsx → User management
- src/app/admin/analytics/page.tsx → Usage analytics
- src/components/profit/ConversationInterface.tsx → AI chat UI
- src/components/profit/ProgressBar.tsx → Session progress tracker
- src/components/profit/ReportCard.tsx → Final output display
- src/components/admin/SessionTable.tsx → Admin session list
- src/components/admin/UserFilters.tsx → Tagging and segmentation UI

RULE: No file in this layer may import @/lib/supabase/* or call supabase.from(...).

### Scripts
- scripts/create-test-users.mjs → Bootstrap test accounts
- scripts/setup-integrations.md → Step-by-step credential setup guide

### Tests
- tests/abuse-test.ts → Cross-user security tests
- tests/e2e/auth/auth-flow.spec.ts → Authentication flow tests
- tests/e2e/profit/discovery.spec.ts → PROFIT session end-to-end tests
- tests/e2e/admin/dashboard.spec.ts → Admin panel tests

### Documentation
- docs/reference/PITFALLS.md → Auto-maintained gotchas (DO NOT edit by hand)
- docs/decisions/0000-template.md → ADR template
- docs/architecture/profit-method.md → PROFIT methodology documentation
- docs/architecture/ai-conversation-flow.md → Conversational AI design patterns
- docs/deployment/stripe-setup.md → Stripe integration guide (future Phase 5)

### Claude Code hooks + skills
- .claude/hooks/prd-reminder.mjs → PRD update nudges
- .claude/hooks/post-commit-pitfalls.mjs → Auto-maintains PITFALLS.md
- .claude/hooks/save-plan.mjs → Archives plans
- .claude/skills/quickpush/ → /quickpush skill
- .claude/skills/reviewer/ → /reviewer skill
- .claude/skills/frontend-design/ → Production UI quality skill

### CI
- .github/workflows/security-checks.yml → Security gates
- .semgrep/semgrep-rules.yml → Static analysis rules

---

### .md File Rule (STRICT)

Every .md file MUST live in docs/ under the correct subfolder. Exceptions:
1. /CLAUDE.md (root contract)
2. /README.md (project readme)
3. Per-folder CLAUDE.md files (scaffolding contracts)
4. /scripts/setup-integrations.md (operator-facing setup)

All other .md files go under docs/ in these subfolders:

| Folder | Contents |
|--------|----------|
| docs/architecture/ | Architecture decisions, ERDs, system diagrams, ADRs |
| docs/deployment/ | Deploy runbooks, MANUAL_SQL_OPERATIONS.md, env setup guides |
| docs/domain/ | PROFIT method documentation, hiring terminology, business rules |
| docs/plans/ | Active and historical implementation plans |
| docs/investigations/ | Debug notes, incident writeups, RCAs |
| docs/runbooks/ | Ops procedures (credential rotation, data migrations) |
| docs/release-notes/ | Per-version change logs |
| docs/api/ | Internal API documentation |

---

### Per-Folder CLAUDE.md Files (MANDATORY)

Write these files verbatim at their specified paths:

#### src/app/CLAUDE.md
```markdown
# src/app/ — CLAUDE.md

Next.js App Router routes and layouts. Server Components by default.

## You MUST
- Use Server Components unless interactivity requires 'use client'
- Fetch data by calling service functions from lib/services/*
- Await params and searchParams (Next.js 15 async props)
- Handle loading/error states with loading.tsx and error.tsx
- Pass data to Client Components as props (never import supabase client here)

## You MUST NOT
- Import @/lib/supabase/* in any file in this folder
- Call supabase.from(...) directly
- Use 'use client' without justification (interactivity, hooks, event handlers)
- Fetch data in Client Components (do it in Server Component parent, pass as props)

## If you are about to …
- **Add a new route** → Create page.tsx with async component, call service layer
- **Add client interactivity** → Extract to component in src/components/, mark 'use client'
- **Debug hydration errors** → Check for Date/regex/functions passed as props (serialize first)

See root CLAUDE.md for full ruleset.
```

#### src/components/CLAUDE.md
```markdown
# src/components/ — CLAUDE.md

UI primitives and reusable components. Client Components when needed.

## You MUST
- Receive all data as props (never fetch internally)
- Use 'use client' only for interactivity (useState, useEffect, event handlers)
- Call service functions through custom hooks (not directly in components)
- Keep components pure and testable

## You MUST NOT
- Import @/lib/supabase/* in any file in this folder
- Call supabase.from(...) directly
- Fetch data from APIs inside components
- Pass sensitive data (API keys, service_role) as props

## If you are about to …
- **Add a form** → Use Server Actions from app/ routes, validate with Zod
- **Add real-time updates** → Create custom hook in lib/hooks/ that wraps service call
- **Add third-party integration** → Call edge function via apiClient in a hook

See root CLAUDE.md for full ruleset.
```

#### src/lib/services/CLAUDE.md
```markdown
# src/lib/services/ — CLAUDE.md

Business logic and database access layer. One file per domain.

## You MUST
- Use createBrowserClient() or createServerClient() from @/lib/supabase/
- Export functions that return typed results: { data, error }
- Validate all inputs with Zod before DB calls
- Sanitize errors before returning to caller
- Use parameterized queries (never string interpolation)

## You MUST NOT
- Call third-party APIs directly (use edge functions via apiClient instead)
- Expose service_role key (use user-scoped client only)
- Return raw database errors (sanitize with "Operation failed" messages)
- Import from app/ or components/ (single-direction dependency)

## If you are about to …
- **Add a new service** → Create domain-named file (e.g., profit-sessions.ts)
- **Call external API** → Invoke edge function via apiClient, not fetch()
- **Handle auth** → Use auth.ts service; derive user from JWT, never from params

See root CLAUDE.md for full ruleset.
```

#### src/lib/supabase/CLAUDE.md
```markdown
# src/lib/supabase/ — CLAUDE.md

Supabase client factories only. No business logic.

## You MUST
- Use client.ts for browser code (cookie-based @supabase/ssr)
- Use server.ts for Server Components, Route Handlers, Server Actions
- Use middleware.ts for session refresh on every request
- Keep these files unchanged unless updating Supabase SDK version

## You MUST NOT
- Import these files from app/ or components/ (only lib/services/ imports them)
- Add business logic here (belongs in lib/services/)
- Expose service_role key in client-accessible code

## If you are about to …
- **Debug auth issues** → Check middleware.ts matcher excludes /auth/signout
- **Add new auth provider** → Configure in Supabase dashboard, not in code

See root CLAUDE.md for full ruleset.
```

#### supabase/functions/CLAUDE.md
```markdown
# supabase/functions/ — CLAUDE.md

Edge functions (Deno runtime). External API calls and AI orchestration.

## You MUST
- Use full middleware chain: handlePreflight → requireAuth → rateLimit → validateBody → createUserClient → safeError
- Call logError() in every catch block
- Return CORS headers on every response (via corsHeaders(req))
- Store secrets in Supabase Vault (Deno.env.get())
- Validate all inputs with Zod via validateBody()
- Use service_role client ONLY for observability writes (logError, startJobRun)

## You MUST NOT
- Skip middleware steps (all are mandatory)
- Return raw errors to client (use safeError())
- Accept user_id from request body (derive from JWT via requireAuth)
- Call supabase.from() with service_role for user data (use createUserClient)

## If you are about to …
- **Add new edge function** → Copy skeleton from Section 9, include all middleware
- **Call external API** → Wrap in try/catch, follow contract from Section 6.5
- **Add cron function** → Use startJobRun/completeJobRun pattern

## Logger usage rules (Tier 1)

### Imports
```ts
import { logError } from "../_shared/error-logger.ts";
import { startJobRun, completeJobRun } from "../_shared/job-logger.ts";
import type { Severity } from "../_shared/severity.ts";
```

### Service-role client for observability writes only
```ts
const serviceClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
```

NEVER pass user-scoped client to loggers.

### Every cron function logs start + complete
```ts
const runId = await startJobRun(serviceClient, "my-cron-name");
try {
  const count = await doWork();
  await completeJobRun(serviceClient, runId, "success", `Done: ${count}`);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  await logError(serviceClient, {
    functionName: "my-cron-name",
    errorMessage: msg,
    errorDetail: err instanceof Error ? err.stack : undefined,
    severity: "error",
  });
  await completeJobRun(serviceClient, runId, "failure", undefined, msg);
  throw err;
}
```

### Every catch block calls logError
```ts
try {
  await externalApi.callSomeRoute(payload);
} catch (err) {
  await logError(serviceClient, {
    functionName: "hr_profit_discovery",
    errorMessage: err instanceof Error ? err.message : String(err),
    errorDetail: err instanceof Error ? err.stack : undefined,
    severity: "error",
    inputParams: { session_id: input.sessionId, step: input.step },
  });
  return safeError(req, 502, "AI service temporarily unavailable");
}
```

### NEVER log PHI/PII
Log shape, not contents:
```ts
// WRONG: inputParams: { request: req.body }
// RIGHT: inputParams: { session_id: req.body.id, fields: Object.keys(req.body) }
```

See root CLAUDE.md for full ruleset.
```

#### supabase/migrations/CLAUDE.md
```markdown
# supabase/migrations/ — CLAUDE.md

Database schema migrations. One migration per logical change.

## You MUST
- Prefix all objects with hr_
- Enable RLS on every table
- Add all four policies (SELECT, INSERT, UPDATE, DELETE) scoped to auth.uid()
- Use timestamptz for timestamps
- Add updated_at triggers
- Create indexes on foreign keys and query-heavy columns

## You MUST NOT
- Edit applied migrations (create new one instead)
- Create tables without RLS
- Use SECURITY DEFINER without explicit justification
- Create public storage buckets

## If you are about to …
- **Add new table** → Use template from Section 9, include RLS + policies + indexes
- **Modify schema** → Create new migration, never edit existing
- **Add enum** → Use CHECK constraint or separate lookup table

See root CLAUDE.md for full ruleset.
```

#### tests/CLAUDE.md
```markdown
# tests/ — CLAUDE.md

Test suites: unit, integration, e2e, security (abuse tests).

## You MUST
- Run abuse tests before every deployment
- Test cross-user isolation for every user-data table
- Use .env.test for credentials (never hardcode)
- Verify both success AND failure paths
- Test rate limits trigger correctly

## You MUST NOT
- Skip security tests to speed up CI
- Use production credentials in tests
- Commit .env.test to git

## If you are about to …
- **Add new feature** → Add corresponding abuse test case
- **Fix security bug** → Add regression test
- **Debug test failure** → Check .env.test exists and has valid credentials

See root CLAUDE.md for full ruleset.
```

#### scripts/CLAUDE.md
```markdown
# scripts/ — CLAUDE.md

Admin and one-off scripts. Local-only, never deployed.

## You MUST
- Use service_role key (permitted here ONLY)
- Document what each script does in header comment
- Use .env for credentials (never hardcode)
- Add to README.md when adding new script

## You MUST NOT
- Call these from application code
- Commit credentials to git
- Run destructive scripts without confirmation prompt

## If you are about to …
- **Add data migration** → Create dated script, document in MANUAL_SQL_OPERATIONS.md
- **Bootstrap test data** → Use create-test-users.mjs pattern
- **Debug production issue** → Create read-only diagnostic script first

See root CLAUDE.md for full ruleset.
```

---

## Database

### hr_users
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, references auth.users |
| email | text | not null, unique |
| full_name | text | |
| role | text | not null, default 'client', CHECK (role IN ('client', 'admin')) |
| referral_code | text | unique, generated on insert |
| referred_by | uuid | FK → hr_users.id |
| created_at | timestamptz | not null, default now() |
| updated_at | timestamptz | not null, default now(), auto-trigger |

Policies: hr_users_select_own, hr_users_insert_own, hr_users_update_own, hr_users_delete_own
Admin override: hr_users_admin_all
Indexes: hr_users_email_idx, hr_users_referral_code_idx

### hr_profit_sessions
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK → auth.users, not null, default auth.uid() |
| status | text | not null, default 'in_progress', CHECK (status IN ('in_progress', 'completed', 'abandoned')) |
| current_step | text | CHECK (current_step IN ('pinpoint', 'revamp', 'optimize', 'fill', 'implement')) |
| session_data | jsonb | not null, default '{}' |
| report_generated | boolean | not null, default false |
| completed_at | timestamptz | |
| created_at | timestamptz | not null, default now() |
| updated_at | timestamptz | not null, default now(), auto-trigger |

Policies: hr_profit_sessions_select_own, hr_profit_sessions_insert_own, hr_profit_sessions_update_own, hr_profit_sessions_delete_own
Admin override: hr_profit_sessions_admin_all
Indexes: hr_profit_sessions_user_id_idx, hr_profit_sessions_status_idx

### hr_profit_messages
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| session_id | uuid | FK → hr_profit_sessions, not null, ON DELETE CASCADE |
| role | text | not null, CHECK (role IN ('user', 'assistant', 'system')) |
| content | text | not null |
| metadata | jsonb | default '{}' |
| created_at | timestamptz | not null, default now() |

Policies: hr_profit_messages_select_via_session, hr_profit_messages_insert_via_session
Indexes: hr_profit_messages_session_id_idx, hr_profit_messages_created_at_idx

### hr_ai_usage
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK → auth.users, not null |
| session_id | uuid | FK → hr_profit_sessions |
| function_name | text | not null |
| tokens_used | integer | not null, default 0 |
| cost_usd | numeric(10,4) | default 0.0000 |
| created_at | timestamptz | not null, default now() |

Policies: hr_ai_usage_insert_own (via function), hr_ai_usage_select_own
Admin override: hr_ai_usage_admin_all
Indexes: hr_ai_usage_user_id_idx, hr_ai_usage_created_at_idx

### hr_referrals
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| referrer_id | uuid | FK → auth.users, not null |
| referred_id | uuid | FK → auth.users, not null, unique |
| status | text | not null, default 'pending', CHECK (status IN ('pending', 'completed', 'rewarded')) |
| reward_granted_at | timestamptz | |
| created_at | timestamptz | not null, default now() |

Policies: hr_referrals_select_own, hr_referrals_insert (via function)
Indexes: hr_referrals_referrer_id_idx, hr_referrals_referred_id_idx

### hr_tags
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| name | text | not null, unique |
| description | text | |
| created_at | timestamptz | not null, default now() |

Policies: Admin-only (SELECT requires role='admin')

### hr_user_tags
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK → auth.users, not null |
| tag_id | uuid | FK → hr_tags, not null |
| created_at | timestamptz | not null, default now() |

Unique constraint: (user_id, tag_id)
Policies: Admin-only (INSERT/DELETE require role='admin')
Indexes: hr_user_tags_user_id_idx, hr_user_tags_tag_id_idx

### hr_subscriptions (future Phase 5)
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK → auth.users, not null, unique |
| stripe_customer_id | text | unique |
| stripe_subscription_id | text | unique |
| status | text | not null, CHECK (status IN ('active', 'canceled', 'past_due')) |
| plan | text | not null, CHECK (plan IN ('free', 'unlimited')) |
| current_period_end | timestamptz | |
| created_at | timestamptz | not null, default now() |
| updated_at | timestamptz | not null, default now(), auto-trigger |

Policies: hr_subscriptions_select_own, hr_subscriptions_update (via webhook only)

### hr_rate_limits
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK → auth.users, not null |
| function_name | text | not null |
| tier | text | not null, CHECK (tier IN ('auth', 'read', 'write', 'expensive')) |
| request_count | integer | not null, default 1 |
| window_start | timestamptz | not null, default now() |
| created_at | timestamptz | not null, default now() |

Unique constraint: (user_id, function_name, window_start)
Policies: Managed by rate-limit middleware (no direct user access)

### Observability Tables (Tier 1)

#### hr_system_error_logs
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK → auth.users |
| function_name | text | not null |
| error_message | text | not null |
| error_detail | text | |
| severity | text | not null, CHECK (severity IN ('debug', 'info', 'warn', 'error', 'critical')) |
| input_params | jsonb | |
| created_at | timestamptz | not null, default now() |

Policies: Admin-only SELECT
Indexes: hr_system_error_logs_function_name_idx, hr_system_error_logs_severity_idx, hr_system_error_logs_created_at_idx

#### hr_job_runs
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| job_name | text | not null |
| status | text | not null, CHECK (status IN ('running', 'success', 'failure')) |
| output | text | |
| error_message | text | |
| started_at | timestamptz | not null, default now() |
| completed_at | timestamptz | |

Policies: Admin-only SELECT
Indexes: hr_job_runs_job_name_idx, hr_job_runs_status_idx, hr_job_runs_started_at_idx

**BEFORE deploying to any environment**, check docs/deployment/MANUAL_SQL_OPERATIONS.md for pending manual SQL operations that must be run in the Supabase SQL Editor.

---

## Edge Functions

### hr_profit_discovery
- Method: POST
- Rate limit tier: expensive
- Input schema:
  ```typescript
  z.object({
    sessionId: z.string().uuid(),
    userMessage: z.string().min(1).max(5000).trim(),
    step: z.enum(["pinpoint", "revamp", "optimize", "fill", "implement"]).optional(),
  })
  ```
- Success response (200):
  ```json
  {
    "data": {
      "assistantMessage": "string",
      "nextStep": "pinpoint|revamp|optimize|fill|implement|complete",
      "sessionStatus": "in_progress|completed"
    }
  }
  ```
- Error responses:
  - 400: Invalid input (Zod validation failure)
  - 401: Missing or invalid JWT
  - 429: Rate limit exceeded (AI usage cap)
  - 500: "AI service temporarily unavailable"
- Tables touched: hr_profit_sessions (READ/WRITE), hr_profit_messages (WRITE), hr_ai_usage (WRITE)
- External calls: Anthropic Claude API — see Section 6.5
- Notes: Multi-turn conversation with Claude. Preserves full conversation history in hr_profit_messages. Uses checkIdempotency on sessionId before processing to prevent duplicate messages on retry.

### hr_financial_calculator
- Method: POST
- Rate limit tier: write
- Input schema:
  ```typescript
  z.object({
    annualSalary: z.number().min(0).max(1000000),
    benefits: z.number().min(0).max(100000),
    tools: z.number().min(0).max(50000),
    managementHoursPerWeek: z.number().min(0).max(40),
    revenueIncrease: z.number().min(0).max(10000000),
    marginPercent: z.number().min(0).max(100),
  })
  ```
- Success response (200):
  ```json
  {
    "data": {
      "fullyLoadedCost": 85000,
      "breakEvenMonths": 18,
      "revenueRequired": 120000,
      "recommendation": "This hire is financially viable if you can generate $120K in additional revenue within 18 months."
    }
  }
  ```
- Error responses:
  - 400: Invalid input
  - 401: Missing or invalid JWT
  - 429: Rate limit exceeded
- Tables touched: None (pure calculation)
- External calls: None
- Notes: Calculation logic embedded in function. No external API.

### hr_salary_benchmark
- Method: POST
- Rate limit tier: read
- Input schema:
  ```typescript
  z.object({
    roleTitle: z.string().min(1).max(200).trim(),
    industry: z.string().min(1).max(100).trim(),
    location: z.string().min(1).max(100).trim(),
  })
  ```
- Success response (200):
  ```json
  {
    "data": {
      "salaryMin": 60000,
      "salaryMax": 90000,
      "median": 75000,
      "benefits": "Health insurance, 401k matching, 15 days PTO",
      "source": "BLS 2024"
    }
  }
  ```
- Error responses:
  - 400: Invalid input
  - 401: Missing or invalid JWT
  - 429: Rate limit exceeded
  - 502: "Salary data service unavailable"
- Tables touched: None
- External calls: None (uses static dataset embedded in function; future: external API)
- Notes: Currently returns mock data based on role keywords. Future phase will integrate real-time salary API.

### hr_job_description_generator
- Method: POST
- Rate limit tier: expensive
- Input schema:
  ```typescript
  z.object({
    sessionId: z.string().uuid(),
  })
  ```
- Success response (200):
  ```json
  {
    "data": {
      "jobDescription": "string (full JD in markdown)",
      "title": "string",
      "responsibilities": ["string"],
      "qualifications": ["string"]
    }
  }
  ```
- Error responses:
  - 400: Invalid session ID or session not completed
  - 401: Missing or invalid JWT
  - 429: Rate limit exceeded
  - 500: "AI service temporarily unavailable"
- Tables touched: hr_profit_sessions (READ), hr_profit_messages (READ), hr_ai_usage (WRITE)
- External calls: Anthropic Claude API — see Section 6.5
- Notes: Reads completed PROFIT session data, synthesizes into JD using Claude.

### hr_interview_questions
- Method: POST
- Rate limit tier: expensive
- Input schema:
  ```typescript
  z.object({
    sessionId: z.string().uuid(),
  })
  ```
- Success response (200):
  ```json
  {
    "data": {
      "questions": [
        {
          "category": "behavioral|situational|technical|cultural",
          "question": "string",
          "rationale": "string"
        }
      ]
    }
  }
  ```
- Error responses:
  - 400: Invalid session ID or session not completed
  - 401: Missing or invalid JWT
  - 429: Rate limit exceeded
  - 500: "AI service temporarily unavailable"
- Tables touched: hr_profit_sessions (READ), hr_profit_messages (READ), hr_ai_usage (WRITE)
- External calls: Anthropic Claude API — see Section 6.5
- Notes: Generates 10-15 interview questions tailored to the role identified in PROFIT session.

### hr_send_report
- Method: POST
- Rate limit tier: write
- Input schema:
  ```typescript
  z.object({
    sessionId: z.string().uuid(),
    recipientEmail: z.string().email().optional(),
  })
  ```
- Success response (200):
  ```json
  {
    "data": {
      "sent": true,
      "to": "user@example.com"
    }
  }
  ```
- Error responses:
  - 400: Invalid session ID or session not completed
  - 401: Missing or invalid JWT
  - 429: Rate limit exceeded
  - 502: "Email service temporarily unavailable"
- Tables touched: hr_profit_sessions (READ)
- External calls: Resend API — see Section 6.5
- Notes: Sends PROFIT report PDF via email. If recipientEmail not provided, sends to session owner's email. Uses checkIdempotency to prevent duplicate sends.

### hr_stripe_webhook (future Phase 5)
- Method: POST
- Rate limit tier: N/A (webhook, no user auth)
- Input schema:
  ```typescript
  z.object({
    type: z.string(),
    data: z.object({
      object: z.any(),
    }),
  })
  ```
- Success response (200):
  ```json
  { "received": true }
  ```
- Error responses:
  - 400: Invalid webhook signature
  - 500: "Webhook processing failed"
- Tables touched: hr_subscriptions (WRITE)
- External calls: None (receives webhook from Stripe)
- Notes: Verifies webhook signature using STRIPE_WEBHOOK_SECRET. Updates subscription status based on Stripe events. Must use service_role client to update hr_subscriptions (no user context).

---

## 6.5 External Integration Contracts

### Anthropic Claude API

- Research source: https://docs.anthropic.com/claude/reference/messages_post
- Base URL: `https://api.anthropic.com/v1/`
- Auth method: Bearer token (x-api-key header)
- Secret name: `ANTHROPIC_API_KEY` (stored in Supabase Vault)
- Called from edge function(s): `hr_profit_discovery`, `hr_job_description_generator`, `hr_interview_questions`
- Trigger: User submits message in PROFIT discovery OR requests JD/interview questions
- Rate limit: 10,000 tokens per minute per project (monitor via hr_ai_usage table)

**Outbound request shape:**
```typescript
const response = await fetch(`https://api.anthropic.com/v1/messages`, {
  method: "POST",
  headers: {
    "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
    "anthropic-version": "2023-06-01",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "claude-sonnet-4-0", // as of 2025-01
    max_tokens: 4096,
    system: "You are a strategic hiring consultant...", // Full system prompt defined in function
    messages: [
      { role: "user", content: userMessage },
      // ... conversation history from hr_profit_messages
    ],
  }),
});
```

**Response handling:**
```typescript
if (response.status === 401) {
  // Invalid API key — log error, return 502
  await logError(serviceClient, {
    functionName: "hr_profit_discovery",
    errorMessage: "Anthropic API authentication failed",
    severity: "critical",
  });
  return safeError(req, 502, "AI service configuration error");
}

if (response.status === 429) {
  // Rate limit hit — retry with exponential backoff (max 3 attempts)
  const retryAfter = response.headers.get("retry-after") || "60";
  await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
  // Retry logic here...
}

if (response.status >= 500) {
  // Anthropic server error — log and return sanitized error
  await logError(serviceClient, {
    functionName: "hr_profit_discovery",
    errorMessage: `Anthropic API error: ${response.status}`,
    errorDetail: await response.text(),
    severity: "error",
  });
  return safeError(req, 502, "AI service temporarily unavailable");
}

const data = await response.json();
const assistantMessage = data.content[0].text;
const tokensUsed = data.usage.input_tokens + data.usage.output_tokens;

// Record usage in hr_ai_usage table
await supabase.from("hr_ai_usage").insert({
  user_id: user.id,
  session_id: sessionId,
  function_name: "hr_profit_discovery",
  tokens_used: tokensUsed,
  cost_usd: (tokensUsed / 1000) * 0.015, // $15/million tokens (current pricing)
});
```

**Never:**
- Call this API from the frontend
- Expose ANTHROPIC_API_KEY in any response body or log
- Assume the API is available without checking response status
- Use any endpoint not listed above
- Log user conversation content (log token counts and session IDs only)

---

### Resend Email API

- Research source: https://resend.com/docs/api-reference/emails/send-email
- Base URL: `https://api.resend.com/`
- Auth method: Bearer token (Authorization header)
- Secret name: `RESEND_API_KEY` (stored in Supabase Vault)
- Called from edge function(s): `hr_send_report`
- Trigger: User requests PROFIT report delivery OR shares results with team
- Rate limit: 100 emails per hour per domain (enforce in hr_rate_limits)

**Outbound request shape:**
```typescript
const response = await fetch(`https://api.resend.com/emails`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: "HireRight <noreply@hireright.app>",
    to: [recipientEmail],
    subject: "Your Strategic Hiring Roadmap",
    html: reportHtml, // Rendered from PROFIT session data
    attachments: [
      {
        filename: "PROFIT_Report.pdf",
        content: base64PdfContent,
      },
    ],
  }),
});
```

**Response handling:**
```typescript
if (response.status === 401) {
  // Invalid API key
  await logError(serviceClient, {
    functionName: "hr_send_report",
    errorMessage: "Resend API authentication failed",
    severity: "critical",
  });
  return safeError(req, 502, "Email service configuration error");
}

if (response.status === 429) {
  // Rate limit exceeded — return retry-after
  return new Response(
    JSON.stringify({ error: "Too many emails sent — try again in 1 hour" }),
    {
      status: 429,
      headers: {
        ...corsHeaders(req),
        "Content-Type": "application/json",
        "Retry-After": "3600",
      },
    }
  );
}

if (response.status >= 500) {
  // Resend server error
  await logError(serviceClient, {
    functionName: "hr_send_report",
    errorMessage: `Resend API error: ${response.status}`,
    severity: "error",
  });
  return safeError(req, 502, "Email service temporarily unavailable — report saved to your account");
}

const data = await response.json();
// Success — store email ID for tracking
```

**Never:**
- Call this API from the frontend
- Expose RESEND_API_KEY in any response body or log
- Send emails without user consent (only on explicit "Send Report" action)
- Include raw user data in email logs (log recipient email and timestamp only)
- Assume email delivery succeeded without checking response status

---

### Stripe API (future Phase 5)

- Research source: https://stripe.com/docs/api
- Base URL: `https://api.stripe.com/v1/`
- Auth method: Bearer token (Authorization header)
- Secret name: `STRIPE_SECRET_KEY` (stored in Supabase Vault)
- Webhook secret: `STRIPE_WEBHOOK_SECRET` (stored in Supabase Vault)
- Called from edge function(s): `hr_stripe_webhook` (incoming webhook)
- Trigger: Stripe sends webhook for subscription events (payment_intent.succeeded, customer.subscription.updated, etc.)
- Rate limit: N/A (Stripe controls webhook delivery)

**Webhook signature verification:**
```typescript
import Stripe from "npm:stripe@^14.0.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const signature = req.headers.get("stripe-signature");
const body = await req.text();

let event: Stripe.Event;
try {
  event = stripe.webhooks.constructEvent(
    body,
    signature!,
    Deno.env.get("STRIPE_WEBHOOK_SECRET")!
  );
} catch (err) {
  await logError(serviceClient, {
    functionName: "hr_stripe_webhook",
    errorMessage: "Invalid webhook signature",
    severity: "warn",
  });
  return new Response("Invalid signature", { status: 400 });
}

// Handle event types
switch (event.type) {
  case "customer.subscription.created":
  case "customer.subscription.updated":
    const subscription = event.data.object as Stripe.Subscription;
    await supabase.from("hr_subscriptions").upsert({
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status === "active" ? "active" : "canceled",
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    });
    break;

  case "customer.subscription.deleted":
    const deletedSub = event.data.object as Stripe.Subscription;
    await supabase.from("hr_subscriptions").update({
      status: "canceled",
    }).eq("stripe_subscription_id", deletedSub.id);
    break;

  default:
    // Unhandled event type — log and ignore
    console.log(`Unhandled Stripe event: ${event.type}`);
}

return new Response(JSON.stringify({ received: true }), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});
```

**Never:**
- Process webhooks without signature verification
- Expose STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET in logs or responses
- Assume webhook delivery is synchronous (events may arrive out of order)
- Use Stripe API from frontend (all payment operations go through edge functions)

---

## 6.6 Observability rules — read before adding any logging

This project's observability stack lives in `supabase/migrations/hr_*.sql`, `supabase/functions/_shared/{error-logger,job-logger,severity}.ts`.

### 6.6.0 Tier 1 — structured logging

This app is Tier 1 (edge functions, async operations, external API dependencies).

- **ALWAYS wrap logger calls so they cannot throw.** Shipped writers (`logError`, `startJobRun`, `completeJobRun`) have internal try/catch.
- **DO** call them at the top level of your handler.
- **DO NOT** wrap them in your own try/catch.
- **DO NOT** branch on their return value as a control-flow decision.

### 6.6.1 NEVER log PHI/PII/secrets

The producer (the function calling `logError`) is responsible for redaction.

- **NEVER** `JSON.stringify(req)` or `JSON.stringify(body)` into `inputParams`. Pluck the fields that matter: `session_id`, `function_name`, `error_code`, `attempt_count`.
- **NEVER** put auth tokens, API keys, signing secrets, session tokens, or cookies into any log payload.
- **NEVER** log free-text user input where the field could contain PHI/PII. Log the field's *length* or *presence*: `{ message_length: 142 }` instead of `{ message: "..." }`.

### 6.6.2 Loggers NEVER throw — they cannot fail the caller

If a PR introduces:

```ts
try { await logError(serviceClient, { ... }); }
catch (logErr) { /* ... */ }
```

Reject it. The catch block can never execute. Correct pattern: `await logError(serviceClient, { ... });` — bare. No try/catch.

### 6.6.3 Use the severity ladder from severity.ts — do not invent levels

Valid severities: `debug | info | warn | error | critical`.

| Wrong | Use instead |
|-------|-------------|
| `notice` | `info` |
| `verbose` | `debug` |
| `fatal` | `critical` |
| `warning` | `warn` |
| `trace` | `debug` |

### 6.6.4 Cron jobs MUST log start and complete

Every cron edge function follows this shape exactly:

```ts
const runId = await startJobRun(serviceClient, "my-cron-name");
try {
  // ... work ...
  await completeJobRun(serviceClient, runId, "success", `Did ${n} things`);
} catch (err) {
  await logError(serviceClient, {
    functionName: "my-cron-name",
    errorMessage: err instanceof Error ? err.message : String(err),
    errorDetail: err instanceof Error ? err.stack : undefined,
    severity: "error",
  });
  await completeJobRun(serviceClient, runId, "failure", undefined,
                       err instanceof Error ? err.message : String(err));
  throw err;
}
```

### 6.6.5 The user_id field is mandatory where the event has user context

When you call `logError` from a code path that knows which user it's operating on, pass `user_id: user.id`. The admin UI's per-user filtering depends on this column being populated.

### 6.6.6 References

- `Observability-Repo/PRINCIPLES.md` — full rationale for each rule.
- `Observability-Repo/TIER_MATRIX.md` — when each tier fires.
- `supabase/functions/_shared/severity.ts` — canonical Severity type.
- The migrations under `supabase/migrations/hr_*.sql` — canonical schema.

---

## Environment Variables

### Inventory (single source of truth)

| Variable | Where it lives | Public? | Notes |
|----------|----------------|---------|-------|
| NEXT_PUBLIC_SUPABASE_URL | Hosting platform env (Vercel) + .env.local | Yes (NEXT_PUBLIC_) | Bundled into client JS |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Hosting platform env + .env.local | Yes (NEXT_PUBLIC_) | Bundled into client JS |
| SUPABASE_URL | Supabase secrets (for edge functions) + .env | No | Edge functions read via Deno.env.get() |
| SUPABASE_SERVICE_ROLE_KEY | Supabase secrets ONLY (and local admin scripts via .env) | No | Never in client bundle, never in git, never in edge-function source visible to users |
| ANTHROPIC_API_KEY | Supabase secrets | No | Claude AI API key for PROFIT discovery |
| RESEND_API_KEY | Supabase secrets | No | Email delivery API key |
| STRIPE_SECRET_KEY | Supabase secrets | No | Payment processing (future Phase 5) |
| STRIPE_WEBHOOK_SECRET | Supabase secrets | No | Webhook signature verification (future Phase 5) |
| RATE_LIMITS_TABLE | Supabase secrets | No | Table name for rate limiting (value: hr_rate_limits) |
| TEST_OWNER_EMAIL | .env.test only | No | Test user credentials for Playwright |
| TEST_OWNER_PASSWORD | .env.test only | No | Test user credentials for Playwright |
| TEST_CLIENT_EMAIL | .env.test only | No | Test user credentials for Playwright |
| TEST_CLIENT_PASSWORD | .env.test only |