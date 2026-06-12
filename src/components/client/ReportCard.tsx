"use client";

import { useState } from "react";
import type { ReportData } from "@/lib/services/reports";
import type { OnboardingPlan } from "@/lib/services/reports";
import { FinancialCalculator } from "./FinancialCalculator";
import { ShareReportModal } from "./ShareReportModal";

interface ReportCardProps {
  report: ReportData;
  sessionId: string;
  shareToken?: string | null;
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function OnboardingPlanSection({ plan }: { plan: OnboardingPlan }) {
  const phases = [
    { label: "Week 1", content: plan.week_1, color: "bg-blue-50 border-blue-200 text-blue-800" },
    { label: "Weeks 2–4", content: plan.weeks_2_4, color: "bg-indigo-50 border-indigo-200 text-indigo-800" },
    { label: "Month 2", content: plan.month_2, color: "bg-purple-50 border-purple-200 text-purple-800" },
    { label: "Month 3", content: plan.month_3, color: "bg-green-50 border-green-200 text-green-800" },
  ];

  return (
    <details className="bg-white rounded-xl border border-gray-200 group">
      <summary className="p-6 cursor-pointer font-semibold text-gray-800 hover:text-gray-900 select-none list-none flex items-center justify-between">
        <span>90-Day Onboarding Plan</span>
        <svg
          className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="px-6 pb-6 pt-0 border-t border-gray-100">
        <div className="pt-5 space-y-3">
          <p className="text-xs text-gray-500">
            Week-by-week roadmap to set your new hire up for success.
          </p>
          {phases.map(({ label, content, color }) => (
            <div key={label} className={`rounded-lg border p-4 ${color}`}>
              <p className="text-xs font-bold uppercase tracking-wider mb-1.5 opacity-70">
                {label}
              </p>
              <p className="text-sm leading-relaxed">{content}</p>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}

function JointReviewButton({ roleTitle }: { roleTitle: string }) {
  const [open, setOpen] = useState(false);
  const [coName, setCoName] = useState("");
  const [coEmail, setCoEmail] = useState("");

  // Build Calendly URL with prefilled custom answers for co-founder attendee.
  // Calendly supports ?name=&email=&a1= (custom questions) in embed links.
  function buildCalendlyUrl() {
    const base = "https://calendly.com/hireright/joint-review";
    const params = new URLSearchParams();
    if (coName) params.set("a1", coName);   // custom question 1: co-founder name
    if (coEmail) params.set("a2", coEmail); // custom question 2: co-founder email
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl text-sm hover:bg-gray-50 transition-colors"
      >
        Schedule Joint Review
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Schedule Joint Review</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-5">
              Review your{" "}
              <span className="font-medium text-gray-700">{roleTitle}</span> roadmap with
              your business partner or co-founder. Add their details so they&apos;ll be
              included in the calendar invite (max 2 additional attendees).
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Co-founder / partner name <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={coName}
                  onChange={(e) => setCoName(e.target.value)}
                  placeholder="Alex Johnson"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Their email <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="email"
                  value={coEmail}
                  onChange={(e) => setCoEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <a
              href={buildCalendlyUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="block w-full text-center py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Choose a Time →
            </a>
            <p className="text-xs text-gray-400 text-center mt-2">
              Confirmation sent to all attendees
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function AssistantBookButton({ roleTitle }: { roleTitle: string }) {
  const subject = encodeURIComponent("Please schedule: HireRight Strategic Hiring Debrief");
  const body = encodeURIComponent(
    `Hi,\n\nI just completed the PROFIT method for my next strategic hire (${roleTitle}) and need to book a follow-up call with Tanika at HireRight.\n\nHere's the scheduling link: https://calendly.com/hireright/discovery\n\nPlease find a time this week and add it to my calendar.\n\nThanks!`
  );

  return (
    <a
      href={`mailto:?subject=${subject}&body=${body}`}
      className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl text-sm hover:bg-gray-50 transition-colors"
    >
      Have assistant book
    </a>
  );
}

export function ReportCard({ report, sessionId, shareToken }: ReportCardProps) {
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

      {/* Financial Reality Check */}
      <details className="bg-white rounded-xl border border-gray-200 group">
        <summary className="p-6 cursor-pointer font-semibold text-gray-800 hover:text-gray-900 select-none list-none flex items-center justify-between">
          <span>Financial Reality Check</span>
          <svg
            className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="px-6 pb-6 pt-0 border-t border-gray-100">
          <div className="pt-5">
            <FinancialCalculator suggestedSalary={role.salary_range} />
          </div>
        </div>
      </details>

      {/* AI-Generated Job Description */}
      {report.job_description && (
        <details className="bg-white rounded-xl border border-gray-200 group">
          <summary className="p-6 cursor-pointer font-semibold text-gray-800 hover:text-gray-900 select-none list-none flex items-center justify-between">
            <span>Job Description (Ready to Post)</span>
            <svg
              className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="px-6 pb-6 pt-0 border-t border-gray-100">
            <div className="pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Auto-generated from your PROFIT session. Copy and customize before posting.
                </p>
                <CopyButton text={report.job_description} />
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-mono text-xs">
                {report.job_description}
              </div>
            </div>
          </div>
        </details>
      )}

      {/* Interview Question Bank */}
      {report.interview_questions && (
        <details className="bg-white rounded-xl border border-gray-200 group">
          <summary className="p-6 cursor-pointer font-semibold text-gray-800 hover:text-gray-900 select-none list-none flex items-center justify-between">
            <span>Interview Question Bank</span>
            <svg
              className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="px-6 pb-6 pt-0 border-t border-gray-100">
            <div className="pt-5 space-y-5">
              <p className="text-xs text-gray-500">
                10 tailored interview questions based on your PROFIT discovery session.
              </p>

              {report.interview_questions.behavioral &&
                report.interview_questions.behavioral.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Behavioral
                    </h4>
                    <ol className="space-y-2">
                      {report.interview_questions.behavioral.map((q, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          {q}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

              {report.interview_questions.situational &&
                report.interview_questions.situational.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Situational
                    </h4>
                    <ol className="space-y-2">
                      {report.interview_questions.situational.map((q, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          {q}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

              {report.interview_questions.culture_fit &&
                report.interview_questions.culture_fit.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Culture Fit
                    </h4>
                    <ol className="space-y-2">
                      {report.interview_questions.culture_fit.map((q, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          {q}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

              <div className="pt-1">
                <CopyButton
                  text={[
                    report.interview_questions.behavioral?.length
                      ? `BEHAVIORAL QUESTIONS\n${report.interview_questions.behavioral.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
                      : "",
                    report.interview_questions.situational?.length
                      ? `\nSITUATIONAL QUESTIONS\n${report.interview_questions.situational.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
                      : "",
                    report.interview_questions.culture_fit?.length
                      ? `\nCULTURE FIT QUESTIONS\n${report.interview_questions.culture_fit.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
                      : "",
                  ]
                    .filter(Boolean)
                    .join("\n")}
                />
              </div>
            </div>
          </div>
        </details>
      )}

      {/* 90-Day Onboarding Plan */}
      {report.onboarding_plan && (
        <OnboardingPlanSection plan={report.onboarding_plan} />
      )}

      {/* CTA Buttons */}
      <div className="flex flex-wrap gap-3" data-print-hide>
        <a
          href="https://calendly.com/hireright/discovery"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Book a Call
        </a>
        <JointReviewButton roleTitle={role.title} />
        <AssistantBookButton roleTitle={role.title} />
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl text-sm hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Save as PDF
        </button>
        <ShareReportModal sessionId={sessionId} roleTitle={role.title} shareToken={shareToken ?? undefined} />
      </div>
    </div>
  );
}
