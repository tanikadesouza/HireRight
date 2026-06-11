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
