"use server";
import { generateReport, upsertHiringStage } from "@/lib/services/reports";
import type { HiringStage } from "@/lib/services/reports";
import { revalidatePath } from "next/cache";

export async function generateReportAction(sessionId: string) {
  return generateReport(sessionId);
}

export async function updateHiringStageAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ error: string | null }> {
  const sessionId = formData.get("session_id") as string;
  const stage = formData.get("stage") as HiringStage;
  const notes = (formData.get("notes") as string | null)?.trim() || undefined;

  if (!sessionId || !stage) return { error: "Missing required fields" };

  const { error } = await upsertHiringStage(sessionId, stage, notes);
  if (error) return { error };

  revalidatePath(`/reports/${sessionId}`);
  return { error: null };
}

