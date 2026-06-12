"use server";

import { addUserTag, removeUserTag, createTag } from "@/lib/services/admin";
import { revalidatePath } from "next/cache";

export async function assignTagAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ error: string | null }> {
  const userId = formData.get("user_id") as string;
  const tagId = formData.get("tag_id") as string;
  const sessionId = formData.get("session_id") as string;

  if (!userId || !tagId) return { error: "Missing required fields" };

  const { error } = await addUserTag(userId, tagId);
  if (error) return { error };

  revalidatePath(`/admin/sessions/${sessionId}`);
  return { error: null };
}

export async function removeTagAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ error: string | null }> {
  const userId = formData.get("user_id") as string;
  const tagId = formData.get("tag_id") as string;
  const sessionId = formData.get("session_id") as string;

  if (!userId || !tagId) return { error: "Missing required fields" };

  const { error } = await removeUserTag(userId, tagId);
  if (error) return { error };

  revalidatePath(`/admin/sessions/${sessionId}`);
  return { error: null };
}

export async function createAndAssignTagAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ error: string | null }> {
  const userId = formData.get("user_id") as string;
  const tagName = (formData.get("tag_name") as string)?.trim();
  const sessionId = formData.get("session_id") as string;

  if (!userId || !tagName) return { error: "Tag name required" };
  if (tagName.length > 50) return { error: "Tag name too long (max 50 chars)" };

  const { data: newTag, error: createError } = await createTag(tagName);
  if (createError || !newTag) return { error: createError ?? "Failed to create tag" };

  const { error: assignError } = await addUserTag(userId, newTag.id);
  if (assignError) return { error: assignError };

  revalidatePath(`/admin/sessions/${sessionId}`);
  return { error: null };
}
