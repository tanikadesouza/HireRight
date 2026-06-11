import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not add code between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public routes — allow through
  const publicPaths = [
    "/",
    "/about",
    "/method",
    "/privacy",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
    "/api/auth/signout",
  ];

  const isPublicPath =
    publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (
    user &&
    (pathname === "/login" ||
      pathname === "/signup" ||
      pathname === "/forgot-password")
  ) {
    const url = request.nextUrl.clone();
    const meta = user.user_metadata as { role?: string } | undefined;
    url.pathname =
      meta?.role === "admin" ? "/admin/dashboard" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // Admin route guard
  if (pathname.startsWith("/admin")) {
    const meta = user?.user_metadata as { role?: string } | undefined;
    if (!user || meta?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = user ? "/dashboard" : "/login";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
