#!/usr/bin/env node
// verify-test-realness.mjs — checks for anti-patterns in test files
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

function walk(dir, files = []) {
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full, files);
      else if (full.match(/\.spec\.(ts|js)$/)) files.push(full);
    }
  } catch {}
  return files;
}

const antiPatterns = [
  { pattern: /dispatchEvent\(['"]click['"]\)/, label: "dispatchEvent click" },
  { pattern: /\.mock\(/, label: "API mock" },
];

const violations = [];
for (const file of walk("tests")) {
  const content = readFileSync(file, "utf8");
  for (const { pattern, label } of antiPatterns) {
    if (pattern.test(content)) violations.push(`${file}: ${label}`);
  }
}

if (violations.length > 0) {
  console.error("Test anti-patterns found:");
  violations.forEach((v) => console.error(`  ${v}`));
  process.exit(1);
}
console.log("verify-test-realness: PASS");
