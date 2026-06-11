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
