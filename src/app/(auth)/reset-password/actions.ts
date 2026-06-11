"use server";
import { updatePassword } from "@/lib/services/auth";
import { redirect } from "next/navigation";

export async function resetPasswordAction(_prevState: unknown, formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  const { error } = await updatePassword(password);

  if (error) return { error: error.message };

  redirect("/login?message=Password+updated+successfully");
}
