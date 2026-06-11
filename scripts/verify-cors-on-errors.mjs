#!/usr/bin/env node
// verify-cors-on-errors.mjs — checks edge functions return CORS headers on errors
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

function walk(dir, files = []) {
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full, files);
      else if (full.endsWith("index.ts")) files.push(full);
    }
  } catch {}
  return files;
}

let anyFunctions = false;
const violations = [];

for (const file of walk("supabase/functions")) {
  if (file.includes("_shared")) continue;
  anyFunctions = true;
  const content = readFileSync(file, "utf8");
  if (content.includes("safeError") && !content.includes("corsHeaders")) {
    violations.push(file);
  }
}

if (violations.length > 0) {
  console.error("Edge functions missing CORS headers on errors:");
  violations.forEach((v) => console.error(`  ${v}`));
  process.exit(1);
}
console.log("verify-cors-on-errors: PASS");
