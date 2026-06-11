"use client";

import type { ReportData } from "@/lib/services/reports";

interface ReportCardProps {
  report: ReportData;
}

function ConfidenceBadge({ score }: { score: number }) {
  const color =
    score >= 8
      ? "bg-green-100 text-green-800"
      : score >= 5
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-800";

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${color}`}
    >
      Confidence: {score}/10
    </span>
  );
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

export function ReportCard({ report }: ReportCardProps) {
  const role = report.recommended_role;

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Executive Summary
        </h2>
        <p className="text-gray-800 leading-relaxed">{report.executive_summary}</p>
      </div>

      {/* Recommended Role */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Recommended Role
        </h2>
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
      </div>

      {/* Alignment Rationale */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Why This Role
        </h2>
        <p className="text-gray-800 leading-relaxed">{report.alignment_rationale}</p>
      </div>

      {/* Next 3 Actions */}
      {report.next_actions && report.next_actions.length > 0 && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
          <h2 className="text-sm font-semibold text-blue-700 uppercase tracking-wider mb-4">
            Your Next 3 Actions
          </h2>
          <ol className="space-y-3">
            {report.next_actions.slice(0, 3).map((action, i) => (
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
      {report.red_flags && report.red_flags.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
          <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wider mb-3">
            Watch Out For
          </h2>
          <ul className="space-y-2">
            {report.red_flags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                <span className="mt-0.5 text-amber-600 flex-shrink-0">⚠</span>
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Internal Candidate Note */}
      {report.internal_candidate_note && (
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-6">
          <h2 className="text-sm font-semibold text-purple-700 uppercase tracking-wider mb-3">
            Internal Candidate Opportunity
          </h2>
          <p className="text-sm text-purple-900 leading-relaxed">
            {report.internal_candidate_note}
          </p>
        </div>
      )}

      {/* Financial Reality Check (stub) */}
      <details className="bg-white rounded-xl border border-gray-200">
        <summary className="p-6 cursor-pointer font-semibold text-gray-800 hover:text-gray-900 select-none">
          Financial Reality Check
        </summary>
        <div className="px-6 pb-6 pt-0 border-t border-gray-100">
          <p className="text-sm text-gray-500 italic">
            A detailed breakdown of total compensation costs, payroll taxes, benefits, and
            onboarding investment will appear here in a future update.
          </p>
        </div>
      </details>

      {/* CTA Buttons */}
      <div className="flex flex-wrap gap-3">
        <a
          href="https://calendly.com/hireright/discovery"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Book a Call
        </a>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-gray-300 text-gray-500 font-medium rounded-xl text-sm cursor-not-allowed"
          title="Coming soon"
        >
          Download PDF
        </button>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-gray-300 text-gray-500 font-medium rounded-xl text-sm cursor-not-allowed"
          title="Coming soon"
        >
          Share
        </button>
      </div>
    </div>
  );
}
