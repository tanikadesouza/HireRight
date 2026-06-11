"use server";
import { signIn } from "@/lib/services/auth";
import { redirect } from "next/navigation";

export async function signInAction(_prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await signIn(email, password);

  if (error) {
    return { error: "Invalid email or password" };
  }

  redirect("/dashboard");
}
