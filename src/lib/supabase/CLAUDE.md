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
