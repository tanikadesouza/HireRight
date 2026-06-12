// src/app/(client)/reports/[sessionId]/page.tsx
// Server Component — shows the PROFIT hiring report for a completed session.

import { redirect } from "next/navigation";
import { getUser } from "@/lib/services/auth";
import { getReport, getHiringStage } from "@/lib/services/reports";
import { ReportCard } from "@/components/client/ReportCard";
import { GenerateReportTrigger } from "@/components/client/GenerateReportTrigger";
import { HiringTracker } from "@/components/client/HiringTracker";
import type { ReportData } from "@/lib/services/reports";

interface ReportPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { sessionId } = await params;

  const user = await getUser();
  if (!user) redirect("/login");

  const [{ data: report, error }, { data: hiringStage }] = await Promise.all([
    getReport(sessionId),
    getHiringStage(sessionId),
  ]);

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center max-w-md">
          <h1 className="text-lg font-semibold text-red-700 mb-2">
            Could not load report
          </h1>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </main>
    );
  }

  const reportData = report?.report_data as ReportData | undefined;
  const shareToken = report?.share_token ?? null;
  const roleTitle = reportData?.recommended_role?.title ?? "Your Hiring Roadmap";
  const confidenceScore = reportData?.confidence_score ?? null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                PROFIT Hiring Roadmap
              </p>
              <h1 className="text-2xl font-bold text-gray-900">{roleTitle}</h1>
            </div>
            {confidenceScore !== null && (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  confidenceScore >= 8
                    ? "bg-green-100 text-green-800"
                    : confidenceScore >= 5
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                Confidence: {confidenceScore}/10
              </span>
            )}
          </div>
        </div>

        {/* Report content */}
        {reportData ? (
          <>
            <ReportCard report={reportData} sessionId={sessionId} shareToken={shareToken} />
            <div className="mt-6">
              <HiringTracker sessionId={sessionId} currentRecord={hiringStage} />
            </div>
          </>
        ) : (
          <GenerateReportTrigger sessionId={sessionId} />
        )}
      </div>
    </main>
  );
}
