import { test, expect } from "@playwright/test";

// Read dev port from .next/dev-port (written by start-dev.mjs) or fall back to env/default
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

function getBaseUrl(): string {
  const portFile = resolve(process.cwd(), ".next/dev-port");
  if (existsSync(portFile)) {
    const port = readFileSync(portFile, "utf8").trim();
    return `http://localhost:${port}`;
  }
  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
}

const BASE_URL = getBaseUrl();

// Test credentials — must exist in Supabase Auth (created by create-test-users.mjs)
const TEST_EMAIL = process.env.TEST_OWNER_EMAIL ?? "owner@test.hireright.dev";
const TEST_PASSWORD = process.env.TEST_OWNER_PASSWORD ?? "TestPassword123!";

test.describe("Auth flow — UM-1 through UM-4", () => {
  test("UM-1: Sign in with valid credentials redirects to dashboard", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/login`);
    expect(page.url()).toContain("/login");

    await page.getByRole("textbox", { name: /email/i }).fill(TEST_EMAIL);
    await page.getByRole("textbox", { name: /password/i }).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
    expect(page.url()).toContain("/dashboard");
  });

  test("UM-1: Sign in with invalid credentials shows inline error", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/login`);

    await page.getByRole("textbox", { name: /email/i }).fill(TEST_EMAIL);
    await page
      .getByRole("textbox", { name: /password/i })
      .fill("wrong-password-123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Error message should appear — never a raw 500
    await expect(
      page.locator("p[role='alert'], [data-testid='error'], .text-red-500, .text-destructive").first()
    ).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain("/login");
  });

  test("UM-2: Sign out clears session and redirects to login", async ({
    page,
  }) => {
    // Sign in first
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole("textbox", { name: /email/i }).fill(TEST_EMAIL);
    await page.getByRole("textbox", { name: /password/i }).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });

    // Sign out
    await page.getByRole("button", { name: /sign out/i }).click();
    await page.waitForURL(`${BASE_URL}/login`, { timeout: 10000 });
    expect(page.url()).toContain("/login");

    // Verify session is gone — navigating to dashboard redirects back to login
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });

  test("UM-3: Forgot password always shows confirmation screen", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/forgot-password`);

    // Submit with any email (real or fake — response must be the same)
    await page
      .getByRole("textbox", { name: /email/i })
      .fill("nonexistent@example.com");
    await page.getByRole("button", { name: /send|reset|submit/i }).click();

    // Should show confirmation screen — never reveal if email exists
    await expect(
      page.getByText(/check your email|reset link|sent/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("UM-8: Signup with weak password shows inline error", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/signup`);

    await page.getByRole("textbox", { name: /email/i }).fill("newuser@example.com");
    await page.getByRole("textbox", { name: /name/i }).fill("Test User");
    await page.getByRole("textbox", { name: /password/i }).fill("short");
    await page.getByRole("button", { name: /sign up|create/i }).click();

    await expect(
      page.getByText(/at least 8 characters/i).first()
    ).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain("/signup");
  });

  test("Unauthenticated user is redirected to /login from protected route", async ({
    page,
  }) => {
    // Visit dashboard without being signed in
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });

  test("Authenticated user is redirected away from /login", async ({
    page,
  }) => {
    // Sign in
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole("textbox", { name: /email/i }).fill(TEST_EMAIL);
    await page.getByRole("textbox", { name: /password/i }).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });

    // Now try to visit /login — should redirect away
    await page.goto(`${BASE_URL}/login`);
    await page.waitForURL(/\/dashboard/, { timeout: 5000 });
    expect(page.url()).toContain("/dashboard");
  });
});
