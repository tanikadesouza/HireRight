import { NextResponse, type NextRequest } from "next/server";
import { signOut } from "@/lib/services/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  await signOut();

  // Explicitly clear all sb-* cookies (signOut() alone doesn't clear them in all envs)
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const response = NextResponse.redirect(new URL("/login", request.url));
  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.delete(cookie.name);
    }
  }

  return response;
}
