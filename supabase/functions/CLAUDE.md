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
