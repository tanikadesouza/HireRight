// POST /api/reports/[sessionId]/share
// Sends the report link to one or more recipients via Resend.
// Auth: requires valid session (cookies). Rate-limited to 5 recipients per call.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/services/auth";
import { getReport } from "@/lib/services/reports";

const ShareSchema = z.object({
  recipients: z.array(z.string().email()).min(1).max(5),
  personal_message: z.string().max(1000).optional(),
  report_url: z.string().url(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  // Auth check
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse + validate body
  let body: z.infer<typeof ShareSchema>;
  try {
    const raw = await req.json();
    body = ShareSchema.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Verify the report belongs to this user
  const { data: report, error: reportError } = await getReport(sessionId);
  if (reportError || !report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey || resendKey.startsWith("placeholder")) {
    // Resend not configured — acknowledge but don't send
    return NextResponse.json(
      { ok: true, note: "Email service not configured — link was not sent" },
      { status: 200 }
    );
  }

  const roleTitle = report.report_data.recommended_role?.title ?? "Strategic Hiring Roadmap";
  const personalMsg =
    body.personal_message ||
    `I used the PROFIT method to map out my next strategic hire (${roleTitle}). Take a look and let me know what you think.`;

  // Send one email per recipient via Resend
  const sendResults = await Promise.allSettled(
    body.recipients.map(async (recipientEmail) => {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "HireRight <noreply@hireright.app>",
          to: recipientEmail,
          subject: `${roleTitle} — Strategic Hiring Roadmap from HireRight`,
          html: buildEmailHtml(personalMsg, roleTitle, body.report_url),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message ?? `Resend error ${res.status}`);
      }
    })
  );

  const failures = sendResults.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    return NextResponse.json(
      { error: "Some emails failed to send. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}

function buildEmailHtml(message: string, roleTitle: string, reportUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 32px 16px;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
    <div style="background: #1d4ed8; padding: 24px 32px;">
      <p style="color: #93c5fd; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 4px;">HireRight</p>
      <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0;">Strategic Hiring Roadmap</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">${escapeHtml(message)}</p>
      <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px;">Recommended Role</p>
        <p style="color: #111827; font-size: 16px; font-weight: 700; margin: 0;">${escapeHtml(roleTitle)}</p>
      </div>
      <a href="${reportUrl}" style="display: inline-block; background: #1d4ed8; color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 10px; text-decoration: none;">View Full Report →</a>
    </div>
    <div style="border-top: 1px solid #f3f4f6; padding: 16px 32px;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">Powered by <a href="https://hireright.app" style="color: #3b82f6; text-decoration: none;">HireRight</a> — Strategic Hiring Clarity</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
