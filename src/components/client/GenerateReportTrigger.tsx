"use client";

import { useEffect, useState } from "react";
import { generateReportAction } from "@/app/(client)/reports/[sessionId]/actions";
import type { ReportData } from "@/lib/services/reports";
import { ReportCard } from "./ReportCard";

interface GenerateReportTriggerProps {
  sessionId: string;
}

export function GenerateReportTrigger({ sessionId }: GenerateReportTriggerProps) {
  const [state, setState] = useState<"generating" | "done" | "error">("generating");
  const [report, setReport] = useState<ReportData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const result = await generateReportAction(sessionId);
      if (cancelled) return;

      if (result.error) {
        // 409 means already generating — poll after 10 seconds
        if (result.error.status === 409) {
          await new Promise((resolve) => setTimeout(resolve, 10_000));
          if (!cancelled) run();
          return;
        }
        setState("error");
        setErrorMsg(result.error.message ?? "Failed to generate report");
        return;
      }

      setReport(result.data);
      setState("done");
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (state === "generating") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        <p className="text-gray-600 font-medium">Generating your roadmap...</p>
        <p className="text-sm text-gray-400">
          Our AI is synthesizing your discovery session into a strategic hiring plan.
        </p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="bg-red-50 rounded-xl border border-red-200 p-6 text-center">
        <p className="text-red-700 font-medium">Failed to generate report</p>
        <p className="text-sm text-red-500 mt-1">{errorMsg}</p>
      </div>
    );
  }

  if (report) {
    return <ReportCard report={report} sessionId={sessionId} />;
  }

  return null;
}
