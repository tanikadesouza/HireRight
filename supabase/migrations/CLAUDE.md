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
