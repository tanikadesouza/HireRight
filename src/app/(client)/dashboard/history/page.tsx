// src/app/(client)/dashboard/history/page.tsx
// Server Component — session history comparison view (US-011)

import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/services/auth";
import { getSessionsWithReports } from "@/lib/services/profit-sessions";
import { SessionCompare } from "@/components/client/SessionCompare";

export default async function HistoryPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const { data: sessions, error } = await getSessionsWithReports();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Session History</h1>
          <p className="text-sm text-gray-500 mt-1">
            Select two completed sessions to compare them side-by-side.
          </p>
        </div>

        {error ? (
          <div className="bg-white rounded-xl border border-red-200 p-6 text-sm text-red-600">
            {error}
          </div>
        ) : (
          <SessionCompare sessions={sessions ?? []} />
        )}
      </div>
    </main>
  );
}
