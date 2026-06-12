// GET /r/[code]
// Referral link redirect. Sets a referral cookie (7-day) and redirects to /signup.
// Cookie is checked during signup to attribute the new user to the referrer.

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // Validate: referral codes are alphanumeric, 8-16 chars
  if (!/^[a-z0-9]{4,20}$/i.test(code)) {
    return NextResponse.redirect(new URL("/signup", process.env.NEXT_PUBLIC_APP_URL ?? "/"));
  }

  const response = NextResponse.redirect(
    new URL("/signup?ref=" + encodeURIComponent(code), process.env.NEXT_PUBLIC_APP_URL ?? "/")
  );

  // 7-day cookie — secure in production
  response.cookies.set("hr_referral_code", code, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}
