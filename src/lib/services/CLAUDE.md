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
