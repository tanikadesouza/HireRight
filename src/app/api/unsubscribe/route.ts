// GET /api/unsubscribe?uid=<userId>&type=<prefKey>
// One-click email unsubscribe handler. Called from links in automated emails.
// No auth required — uses a SECURITY DEFINER RPC accessible to the anon role.
// Redirects to /unsubscribe?type=<prefKey>&status=ok (or ?status=error).

import { type NextRequest, NextResponse } from "next/server";
import { unsubscribeUser } from "@/lib/services/users";

const VALID_TYPES = new Set(["followup_14d", "followup_6mo", "marketing"]);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const uid = searchParams.get("uid")?.trim();
  const type = searchParams.get("type")?.trim();

  const base = req.nextUrl.clone();
  base.pathname = "/unsubscribe";
  base.search = "";

  // Validate params
  if (!uid || !type || !VALID_TYPES.has(type)) {
    base.searchParams.set("status", "invalid");
    return NextResponse.redirect(base);
  }

  // UUID format check (prevents obviou injections)
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(uid)) {
    base.searchParams.set("status", "invalid");
    return NextResponse.redirect(base);
  }

  const { error } = await unsubscribeUser(uid, type);

  if (error) {
    base.searchParams.set("status", "error");
    return NextResponse.redirect(base);
  }

  base.searchParams.set("type", type);
  base.searchParams.set("status", "ok");
  return NextResponse.redirect(base);
}
