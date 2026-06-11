"use server";
import { resetPasswordForEmail } from "@/lib/services/auth";
import { headers } from "next/headers";

export async function forgotPasswordAction(_prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const headersList = await headers();
  const origin = headersList.get("origin") || "http://localhost:3000";

  // Always call resetPasswordForEmail — never reveal if email exists
  await resetPasswordForEmail(email, `${origin}/auth/callback?next=/reset-password`);

  // Always return success (prevent user enumeration)
  return { success: true };
}
