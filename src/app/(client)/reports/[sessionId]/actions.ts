"use server";
import { generateReport } from "@/lib/services/reports";

export async function generateReportAction(sessionId: string) {
  return generateReport(sessionId);
}
