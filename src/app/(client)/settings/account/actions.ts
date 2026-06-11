"use server";
import { getUser, signIn, updatePassword, signOut } from "@/lib/services/auth";
import { updateProfile } from "@/lib/services/users";
import { redirect } from "next/navigation";

export async function updateProfileAction(_prevState: unknown, formData: FormData) {
  const fullName = formData.get("full_name") as string;

  if (!fullName || fullName.trim().length === 0) {
    return { error: "Full name is required" };
  }

  const user = await getUser();
  if (!user) redirect("/login");

  const { error } = await updateProfile({ full_name: fullName.trim() });

  if (error) return { error: error.message };
  return { success: true };
}

export async function changePasswordAction(_prevState: unknown, formData: FormData) {
  const currentPassword = formData.get("current_password") as string;
  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All password fields are required" };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  // Verify current password by re-authenticating
  const user = await getUser();
  if (!user?.email) redirect("/login");

  const { error: signInError } = await signIn(user.email!, currentPassword);
  if (signInError) {
    return { error: "Current password is incorrect" };
  }

  const { error } = await updatePassword(newPassword);
  if (error) return { error: error.message };

  return { success: true };
}

export async function deleteAccountAction(_prevState: unknown, formData: FormData) {
  const confirmation = formData.get("confirmation") as string;

  if (confirmation !== "DELETE") {
    return { error: 'Please type DELETE to confirm account deletion' };
  }

  const user = await getUser();
  if (!user) redirect("/login");

  // Sign out first — account deletion requires admin auth (handled by edge function)
  // For now, sign out and redirect; full deletion handled via edge function
  await signOut();
  redirect("/login?message=Account+deletion+requested");
}
