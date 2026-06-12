"use server";

import { z } from "zod";
import { getUser } from "@/lib/services/auth";
import { getUsersByTag, getTags } from "@/lib/services/admin";

const BulkEmailSchema = z.object({
  tagName: z.string().min(1),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
});

export type BulkEmailFormState = {
  status: "idle" | "success" | "error";
  message: string;
  recipientCount?: number;
};

export async function previewRecipientsAction(tagName: string): Promise<{
  count: number;
  error: string | null;
}> {
  const user = await getUser();
  if (!user) return { count: 0, error: "Unauthorized" };

  const { data, error } = await getUsersByTag(tagName);
  if (error) return { count: 0, error };
  return { count: data?.length ?? 0, error: null };
}

export async function sendBulkEmailAction(
  _prevState: BulkEmailFormState,
  formData: FormData
): Promise<BulkEmailFormState> {
  const user = await getUser();
  if (!user) return { status: "error", message: "Unauthorized" };

  const parsed = BulkEmailSchema.safeParse({
    tagName: formData.get("tagName"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Invalid form data" };
  }

  const { tagName, subject, body } = parsed.data;

  const { data: recipients, error: fetchError } = await getUsersByTag(tagName);
  if (fetchError) return { status: "error", message: fetchError };
  if (!recipients || recipients.length === 0) {
    return { status: "error", message: "No clients found with this tag" };
  }

  if (recipients.length > 100) {
    return {
      status: "error",
      message: `Too many recipients (${recipients.length}). Max 100 per send.`,
    };
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey || resendKey.startsWith("placeholder")) {
    return {
      status: "success",
      message: `Email service not configured — would have sent to ${recipients.length} recipient(s).`,
      recipientCount: recipients.length,
    };
  }

  // Send in batches of 10 to avoid overloading Resend
  const BATCH_SIZE = 10;
  const errors: string[] = [];

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map(async (recipient) => {
        const personalizedBody = body
          .replace(/\{\{name\}\}/g, recipient.full_name ?? "there")
          .replace(/\{\{email\}\}/g, recipient.email);

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "HireRight <noreply@hireright.app>",
            to: recipient.email,
            subject,
            html: buildBulkEmailHtml(
              recipient.full_name ?? "there",
              personalizedBody,
              recipient.user_id
            ),
          }),
        });

        if (!res.ok) {
          errors.push(recipient.email);
        }
      })
    );
  }

  if (errors.length > 0) {
    return {
      status: "error",
      message: `Sent to ${recipients.length - errors.length} of ${recipients.length} recipients. Failed: ${errors.slice(0, 3).join(", ")}${errors.length > 3 ? "..." : ""}`,
      recipientCount: recipients.length - errors.length,
    };
  }

  return {
    status: "success",
    message: `Email sent to ${recipients.length} recipient(s).`,
    recipientCount: recipients.length,
  };
}

function buildBulkEmailHtml(name: string, bodyText: string, userId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hireright.app";
  const unsubUrl = `${appUrl}/api/unsubscribe?uid=${userId}&type=marketing`;

  const paragraphs = bodyText
    .split(/\n\n+/)
    .map((p) => `<p style="margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 32px 16px;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
    <div style="background: #1d4ed8; padding: 20px 32px;">
      <p style="color: #ffffff; font-size: 16px; font-weight: 700; margin: 0;">HireRight</p>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">Hi ${name},</p>
      ${paragraphs}
    </div>
    <div style="border-top: 1px solid #f3f4f6; padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">HireRight — Strategic Hiring Clarity</p>
      <a href="${unsubUrl}" style="color: #9ca3af; font-size: 12px; text-decoration: underline;">Unsubscribe</a>
    </div>
  </div>
</body>
</html>`;
}

export { getTags };
