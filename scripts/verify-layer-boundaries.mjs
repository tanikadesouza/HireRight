#!/usr/bin/env node
// verify-layer-boundaries.mjs — checks no Supabase imports in presentation layer
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

function walk(dir, files = []) {
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full, files);
      else if (full.match(/\.(ts|tsx)$/)) files.push(full);
    }
  } catch {}
  return files;
}

const violations = [];
const presentationDirs = ["src/app", "src/components"];

for (const dir of presentationDirs) {
  for (const file of walk(dir)) {
    if (file.endsWith("CLAUDE.md")) continue;
    const content = readFileSync(file, "utf8");
    if (content.includes("@/lib/supabase") || content.includes("supabase.from(")) {
      violations.push(file);
    }
  }
}

if (violations.length > 0) {
  console.error("Layer boundary violations found:");
  violations.forEach((v) => console.error(`  ${v}`));
  process.exit(1);
}
console.log("verify-layer-boundaries: PASS");
