"use server";

// src/app/(admin)/admin/tags/actions.ts
// Server Actions for admin tags management (US-008 edge case).

import { revalidatePath } from "next/cache";
import { createTag, renameTag, deleteTag } from "@/lib/services/admin";

export async function createTagAction(formData: FormData): Promise<{ error?: string }> {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Tag name is required" };
  if (name.length > 50) return { error: "Tag name must be 50 characters or less" };

  const { error } = await createTag(name);
  if (error) return { error };

  revalidatePath("/admin/tags");
  revalidatePath("/admin/clients");
  return {};
}

export async function renameTagAction(formData: FormData): Promise<{ error?: string }> {
  const tagId = formData.get("tag_id") as string;
  const newName = (formData.get("new_name") as string)?.trim();

  if (!tagId) return { error: "Tag ID is required" };
  if (!newName) return { error: "New name is required" };
  if (newName.length > 50) return { error: "Tag name must be 50 characters or less" };

  const { error } = await renameTag(tagId, newName);
  if (error) return { error };

  revalidatePath("/admin/tags");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/sessions");
  return {};
}

export async function deleteTagAction(formData: FormData): Promise<{ error?: string }> {
  const tagId = formData.get("tag_id") as string;
  if (!tagId) return { error: "Tag ID is required" };

  const { error } = await deleteTag(tagId);
  if (error) return { error };

  revalidatePath("/admin/tags");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/sessions");
  return {};
}
