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
