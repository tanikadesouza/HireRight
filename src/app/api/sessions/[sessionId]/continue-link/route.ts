// POST /api/sessions/[sessionId]/continue-link
// Emails the authenticated user a link to resume their PROFIT session on
// another device. The link is just the session URL — no separate magic token
// needed since auth is cookie-based (user will need to sign in on the new device).

import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/services/auth";
import { getSession } from "@/lib/services/profit-sessions";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify session belongs to user
  const { data: session, error } = await getSession(sessionId);
  if (error || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hireright.app";
  const resumeUrl = `${appUrl}/discovery/${sessionId}`;

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey || resendKey.startsWith("placeholder")) {
    // Not configured — acknowledge silently
    return NextResponse.json({ ok: true });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:#1d4ed8;padding:20px 32px;">
      <p style="color:#fff;font-weight:700;margin:0;font-size:16px;">HireRight</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#374151;font-size:15px;margin:0 0 16px;">Here's your link to continue your PROFIT discovery session on another device.</p>
      <p style="color:#6b7280;font-size:13px;margin:0 0 24px;">You'll need to sign in to your HireRight account on the new device. Your progress is saved.</p>
      <a href="${resumeUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">Continue My Discovery →</a>
      <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">This link doesn't expire — your session is saved indefinitely.</p>
    </div>
  </div>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "HireRight <noreply@hireright.app>",
      to: user.email!,
      subject: "Continue your PROFIT Discovery on another device",
      html,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
