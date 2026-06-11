// src/components/admin/SessionTable.tsx
// Reusable table component for the admin session list.

import Link from "next/link";
import type { AdminSession } from "@/lib/services/admin";

interface SessionTableProps {
  sessions: AdminSession[];
  showActions?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  abandoned: "bg-gray-100 text-gray-600",
  generating_report: "bg-purple-100 text-purple-800",
};

const STATUS_LABELS: Record<string, string> = {
  in_progress: "In Progress",
  completed: "Completed",
  abandoned: "Abandoned",
  generating_report: "Generating Report",
};

const STEP_LABELS: Record<string, string> = {
  pinpoint: "Pinpoint",
  revamp: "Revamp",
  optimize: "Optimize",
  fill: "Fill",
  implement: "Implement",
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function SessionTable({ sessions, showActions = true }: SessionTableProps) {
  if (sessions.length === 0) {
    return (
      <p className="text-center text-gray-500 text-sm py-10">No sessions found.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="pb-3 pr-4 font-semibold text-gray-500">Client</th>
            <th className="pb-3 pr-4 font-semibold text-gray-500">Email</th>
            <th className="pb-3 pr-4 font-semibold text-gray-500">Status</th>
            <th className="pb-3 pr-4 font-semibold text-gray-500">Step</th>
            <th className="pb-3 pr-4 font-semibold text-gray-500">Created</th>
            {showActions && (
              <th className="pb-3 font-semibold text-gray-500">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sessions.map((session) => (
            <tr key={session.id} className="hover:bg-gray-50">
              <td className="py-3 pr-4 text-gray-900 font-medium">
                {session.user?.full_name ?? "—"}
              </td>
              <td className="py-3 pr-4 text-gray-600">
                {session.user?.email ?? "—"}
              </td>
              <td className="py-3 pr-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    STATUS_STYLES[session.status] ?? STATUS_STYLES.abandoned
                  }`}
                >
                  {STATUS_LABELS[session.status] ?? session.status}
                </span>
              </td>
              <td className="py-3 pr-4 text-gray-600">
                {session.current_step
                  ? STEP_LABELS[session.current_step] ?? session.current_step
                  : "—"}
              </td>
              <td className="py-3 pr-4 text-gray-500 text-xs">
                {formatDate(session.created_at)}
              </td>
              {showActions && (
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/sessions/${session.id}`}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Details
                    </Link>
                    {session.status === "completed" && (
                      <Link
                        href={`/reports/${session.id}`}
                        className="text-xs text-green-600 hover:text-green-800 font-medium"
                      >
                        View Report
                      </Link>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
