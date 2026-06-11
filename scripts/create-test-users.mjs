#!/usr/bin/env node
// create-test-users.mjs — bootstrap test users in Supabase Auth
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

function readEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  const content = readFileSync(envPath, "utf8");
  const vars = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) vars[m[1].trim()] = m[2].trim();
  }
  return vars;
}

async function main() {
  const env = readEnv();
  const url = env["NEXT_PUBLIC_SUPABASE_URL"];
  const serviceKey = env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const users = [
    {
      email: env["TEST_OWNER_EMAIL"] || "owner@test.hireright.dev",
      password: env["TEST_OWNER_PASSWORD"] || "TestPassword123!",
      role: "client",
    },
    {
      email: env["TEST_CLIENT_EMAIL"] || "client@test.hireright.dev",
      password: env["TEST_CLIENT_PASSWORD"] || "TestPassword123!",
      role: "client",
    },
  ];

  for (const u of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { role: u.role },
    });
    if (error) {
      console.error(`Failed to create ${u.email}:`, error.message);
    } else {
      console.log(`Created user: ${data.user.email} (${data.user.id})`);
    }
  }
}

main().catch(console.error);
