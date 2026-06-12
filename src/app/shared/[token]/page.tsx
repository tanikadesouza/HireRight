// src/app/shared/[token]/page.tsx
// Public Server Component — view-only report for recipients with a share link.
// No account required. Access is gated by the share token (hard-to-guess UUID).
// US-004: Share Results with Team

import Link from "next/link";
import { getReportByShareToken } from "@/lib/services/reports";
import type { ReportData, RecommendedRole } from "@/lib/services/reports";

interface SharedReportPageProps {
  params: Promise<{ token: string }>;
}

function RoleTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    full_time: "Full-Time",
    fractional: "Fractional",
    contractor: "Contractor",
  };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      {labels[type] ?? type}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

export default async function SharedReportPage({ params }: SharedReportPageProps) {
  const { token } = await params;

  const { data: report, error } = await getReportByShareToken(token);

  if (error || !report) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-2xl">
            🔒
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Report not found</h1>
          <p className="text-sm text-gray-500 mb-6">
            This link may have expired or the report was removed. Ask the founder to share it
            again.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            Learn about HireRight →
          </Link>
        </div>
      </main>
    );
  }

  const reportData = report.report_data as ReportData;
  const role: RecommendedRole = reportData.recommended_role;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Minimal header — no nav, just branding */}
      <div className="border-b border-gray-200 bg-white px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="font-bold text-gray-900 text-lg tracking-tight">HireRight</span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
            View-only · Shared report
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            PROFIT Strategic Hiring Roadmap
          </p>
          <h1 className="text-2xl font-bold text-gray-900">{role.title}</h1>
          {reportData.confidence_score !== null && (
            <span
              className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                reportData.confidence_score >= 8
                  ? "bg-green-100 text-green-800"
                  : reportData.confidence_score >= 5
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              Confidence: {reportData.confidence_score}/10
            </span>
          )}
        </div>

        <div className="space-y-6">
          {/* Executive Summary */}
          <Section title="Executive Summary">
            <p className="text-gray-800 leading-relaxed">{reportData.executive_summary}</p>
          </Section>

          {/* Recommended Role */}
          <Section title="Recommended Role">
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl font-bold text-gray-900">{role.title}</h3>
                <RoleTypeBadge type={role.type} />
              </div>
              {role.salary_range && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Salary Range:</span> {role.salary_range}
                </p>
              )}
              {role.responsibilities && role.responsibilities.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Responsibilities</h4>
                  <ul className="space-y-1.5">
                    {role.responsibilities.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {role.required_skills && role.required_skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {role.required_skills.map((skill, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Why This Role */}
          <Section title="Why This Role">
            <p className="text-gray-800 leading-relaxed">{reportData.alignment_rationale}</p>
          </Section>

          {/* Next 3 Actions */}
          {reportData.next_actions && reportData.next_actions.length > 0 && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <h2 className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-4">
                Recommended Next 3 Actions
              </h2>
              <ol className="space-y-3">
                {reportData.next_actions.slice(0, 3).map((action, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm text-blue-900 leading-relaxed">{action}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Red Flags */}
          {reportData.red_flags && reportData.red_flags.length > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
              <h2 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3">
                Watch Out For
              </h2>
              <ul className="space-y-2">
                {reportData.red_flags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                    <span className="mt-0.5 text-amber-600 flex-shrink-0">⚠</span>
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Internal Candidate Note */}
          {reportData.internal_candidate_note && (
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-6">
              <h2 className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-3">
                Internal Candidate Opportunity
              </h2>
              <p className="text-sm text-purple-900 leading-relaxed">
                {reportData.internal_candidate_note}
              </p>
            </div>
          )}

          {/* CTA — invite recipient to do their own PROFIT session */}
          <div className="bg-gray-900 rounded-2xl p-8 text-center">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Powered by HireRight
            </p>
            <h3 className="text-xl font-bold text-white mb-3">
              Ready to map out your own strategic hire?
            </h3>
            <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
              Use the PROFIT method to identify the right role for your business in under 15
              minutes — free.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors"
              >
                Start PROFIT Discovery — Free
              </Link>
              <a
                href="https://calendly.com/hireright/discovery"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium text-sm rounded-xl transition-colors"
              >
                Book a call with Tanika →
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
