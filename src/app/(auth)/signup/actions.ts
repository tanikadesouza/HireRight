"use server";
import { cookies } from "next/headers";
import { signUp } from "@/lib/services/auth";
import { recordReferralSignup } from "@/lib/services/referrals";
import { redirect } from "next/navigation";

export async function signUpAction(_prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;

  if (!email || !password || !fullName) {
    return { error: "All fields are required" };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const { error, data } = await signUp(email, password, fullName);

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "An account with this email already exists" };
    }
    return { error: error.message };
  }

  // Check for referral cookie and attribute the signup if found
  try {
    const cookieStore = await cookies();
    const referralCode = cookieStore.get("hr_referral_code")?.value;
    if (referralCode && data?.user?.id) {
      await recordReferralSignup(referralCode, email, data.user.id);
      // Clear the referral cookie
      cookieStore.delete("hr_referral_code");
    }
  } catch {
    // Non-fatal — referral tracking should never block signup
  }

  redirect("/onboarding");
}
