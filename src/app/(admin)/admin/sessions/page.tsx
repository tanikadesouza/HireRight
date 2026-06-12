// src/app/(admin)/admin/sessions/page.tsx
// Server Component — admin view of all client sessions across all users.
// Middleware guards /admin/* routes (admin role required).

import Link from "next/link";
import { getAllSessions } from "@/lib/services/admin";
import { SessionTable } from "@/components/admin/SessionTable";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "abandoned", label: "Abandoned" },
];

interface SessionsPageProps {
  searchParams: Promise<{ status?: string; user?: string }>;
}

export default async function AdminSessionsPage({ searchParams }: SessionsPageProps) {
  const params = await searchParams;
  const statusFilter = params.status ?? "all";
  const userFilter = params.user;

  const { data: sessions, error } = await getAllSessions({
    status: statusFilter === "all" ? undefined : statusFilter,
    userId: userFilter,
  });

  // Resolve user name for the filter banner (pull from first session result)
  const filteredUser = userFilter && sessions && sessions.length > 0
    ? sessions[0].user
    : null;

  // Build base href preserving user filter across status tabs
  function tabHref(status: string) {
    const p = new URLSearchParams();
    if (status !== "all") p.set("status", status);
    if (userFilter) p.set("user", userFilter);
    const qs = p.toString();
    return `/admin/sessions${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
        <a
          href="/admin/export?type=sessions"
          download
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </a>
      </div>

      {/* User filter banner */}
      {userFilter && (
        <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm">
          <span className="text-blue-700">
            Showing sessions for:{" "}
            <span className="font-semibold">
              {filteredUser?.full_name ?? filteredUser?.email ?? userFilter}
            </span>
          </span>
          <Link
            href="/admin/sessions"
            className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium underline"
          >
            Clear filter
          </Link>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {STATUS_OPTIONS.map((opt) => {
          const isActive = statusFilter === opt.value;
          return (
            <Link
              key={opt.value}
              href={tabHref(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      {/* Sessions table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {error ? (
          <p className="text-center text-red-600 text-sm py-6">{error}</p>
        ) : (
          <SessionTable sessions={sessions ?? []} showActions />
        )}
      </div>
    </div>
  );
}
