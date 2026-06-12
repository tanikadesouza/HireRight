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

const PER_PAGE = 50;

interface SessionsPageProps {
  searchParams: Promise<{ status?: string; user?: string; page?: string }>;
}

export default async function AdminSessionsPage({ searchParams }: SessionsPageProps) {
  const params = await searchParams;
  const statusFilter = params.status ?? "all";
  const userFilter = params.user;
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const { data: sessions, total, error } = await getAllSessions({
    status: statusFilter === "all" ? undefined : statusFilter,
    userId: userFilter,
    page: currentPage,
  });

  const totalPages = Math.ceil(total / PER_PAGE);

  // Resolve user name for the filter banner (pull from first session result)
  const filteredUser = userFilter && sessions && sessions.length > 0
    ? sessions[0].user
    : null;

  // Build URL preserving all current filters + a specific page
  function pageHref(page: number) {
    const p = new URLSearchParams();
    if (statusFilter !== "all") p.set("status", statusFilter);
    if (userFilter) p.set("user", userFilter);
    if (page > 1) p.set("page", String(page));
    const qs = p.toString();
    return `/admin/sessions${qs ? `?${qs}` : ""}`;
  }

  // Build base href preserving user filter + resetting to page 1 on tab change
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
          {total > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {total} session{total !== 1 ? "s" : ""}
              {totalPages > 1 && ` · page ${currentPage} of ${totalPages}`}
            </p>
          )}
        </div>
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

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            {currentPage > 1 && (
              <Link
                href={pageHref(currentPage - 1)}
                className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Previous
              </Link>
            )}
            {/* Page number pills — show at most 5 around current page */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                ) : (
                  <Link
                    key={p}
                    href={pageHref(p as number)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      p === currentPage
                        ? "bg-gray-900 text-white"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </Link>
                )
              )}
            {currentPage < totalPages && (
              <Link
                href={pageHref(currentPage + 1)}
                className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
