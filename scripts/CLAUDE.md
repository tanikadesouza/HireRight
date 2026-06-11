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
