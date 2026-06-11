"use client";

import { useState } from "react";
import Link from "next/link";
import type { ProfitSession } from "@/lib/services/profit-sessions";

type SessionWithReport = ProfitSession & { report_data: Record<string, unknown> | null };

interface SessionCompareProps {
  sessions: SessionWithReport[];
}

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

function CompareRow({
  label,
  values,
}: {
  label: string;
  values: (string | null | undefined)[];
}) {
  return (
    <div className="grid grid-cols-[140px,1fr,1fr] gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-0.5">
        {label}
      </div>
      {values.map((val, i) => (
        <div key={i} className="text-sm text-gray-800 leading-relaxed">
          {val ?? <span className="text-gray-400 italic">Not available</span>}
        </div>
      ))}
    </div>
  );
}

export function SessionCompare({ sessions }: SessionCompareProps) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= 2) return [prev[1], id]; // shift window
      return [...prev, id];
    });
  }

  const selectedSessions = selected
    .map((id) => sessions.find((s) => s.id === id))
    .filter((s): s is SessionWithReport => Boolean(s));

  const comparing = selectedSessions.length === 2;

  return (
    <div className="space-y-6">
      {/* Session picker */}
      <div className="space-y-2">
        {sessions.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No completed sessions to compare yet.{" "}
            <Link href="/discovery" className="text-blue-600 underline">
              Start a session
            </Link>
          </div>
        )}

        {sessions.map((session) => {
          const report = session.report_data;
          const roleTitle = report?.recommended_role
            ? (report.recommended_role as Record<string, unknown>)?.title
            : null;
          const isChecked = selected.includes(session.id);

          return (
            <label
              key={session.id}
              className={`flex items-center gap-4 bg-white rounded-xl border p-4 cursor-pointer transition-colors ${
                isChecked ? "border-blue-400 ring-1 ring-blue-400" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleSelect(session.id)}
                className="w-4 h-4 accent-blue-600 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {String(roleTitle ?? "Untitled session")}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Completed {formatDate(session.completed_at)}
                </p>
              </div>
              <Link
                href={`/reports/${session.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 text-xs text-blue-600 hover:underline"
              >
                View report
              </Link>
            </label>
          );
        })}
      </div>

      {selected.length === 1 && (
        <p className="text-sm text-gray-500 text-center">
          Select one more session to compare.
        </p>
      )}

      {/* Comparison table */}
      {comparing && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[140px,1fr,1fr] gap-4 p-4 bg-gray-50 border-b border-gray-200">
            <div />
            {selectedSessions.map((s, i) => {
              const roleTitle = s.report_data?.recommended_role
                ? (s.report_data.recommended_role as Record<string, unknown>)?.title
                : null;
              return (
                <div key={i}>
                  <p className="text-xs font-semibold text-gray-500 mb-0.5">Session {i + 1}</p>
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {String(roleTitle ?? "—")}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(s.completed_at)}</p>
                </div>
              );
            })}
          </div>

          <div className="p-4 space-y-0">
            <CompareRow
              label="Business Goal"
              values={selectedSessions.map((s) =>
                s.report_data?.business_goal ? String(s.report_data.business_goal) : null
              )}
            />
            <CompareRow
              label="Current Team"
              values={selectedSessions.map((s) =>
                s.report_data?.current_team ? String(s.report_data.current_team) : null
              )}
            />
            <CompareRow
              label="Gaps Identified"
              values={selectedSessions.map((s) =>
                s.report_data?.gaps_identified ? String(s.report_data.gaps_identified) : null
              )}
            />
            <CompareRow
              label="Recommended Role"
              values={selectedSessions.map((s) => {
                const role = s.report_data?.recommended_role as
                  | Record<string, unknown>
                  | undefined;
                if (!role) return null;
                const type = String(role.type ?? "").replace("_", "-");
                return `${String(role.title ?? "")} (${type})`;
              })}
            />
            <CompareRow
              label="Salary Range"
              values={selectedSessions.map((s) => {
                const role = s.report_data?.recommended_role as
                  | Record<string, unknown>
                  | undefined;
                return role?.salary_range ? String(role.salary_range) : null;
              })}
            />
            <CompareRow
              label="Confidence"
              values={selectedSessions.map((s) =>
                s.report_data?.confidence_score != null
                  ? `${s.report_data.confidence_score}/10`
                  : null
              )}
            />
            <CompareRow
              label="Alignment"
              values={selectedSessions.map((s) =>
                s.report_data?.alignment_rationale
                  ? String(s.report_data.alignment_rationale)
                  : null
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
