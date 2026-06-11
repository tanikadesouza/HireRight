#!/usr/bin/env node
// verify-test-coverage.mjs — checks P0 stories have test specs
import { existsSync } from "fs";
const required = [
  "tests/e2e/auth/auth-flow.spec.ts",
];
let failed = false;
for (const f of required) {
  if (!existsSync(f)) {
    console.error(`MISSING TEST: ${f}`);
    failed = true;
  } else {
    console.log(`  OK: ${f}`);
  }
}
if (failed) process.exit(1);
console.log("verify-test-coverage: PASS");
