// src/app/(client)/dashboard/page.tsx
// Server Component — user dashboard with PROFIT session history.

import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/services/auth";
import { getSessions } from "@/lib/services/profit-sessions";
import type { ProfitSession } from "@/lib/services/profit-sessions";

const STEP_LABELS: Record<string, string> = {
  pinpoint: "Pinpoint Goals",
  revamp: "Revamp Team",
  optimize: "Optimize Roles",
  fill: "Fill the Gaps",
  implement: "Implement & Tune",
};

const STATUS_STYLES: Record<string, string> = {
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  abandoned: "bg-gray-100 text-gray-600",
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

function SessionCard({ session }: { session: ProfitSession }) {
  const isCompleted = session.status === "completed";
  const isInProgress = session.status === "in_progress";
  const sessionData = session.session_data as Record<string, unknown>;
  const roleRecommended = isCompleted
    ? (sessionData?.recommended_role as string | undefined)
    : undefined;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                STATUS_STYLES[session.status] ?? STATUS_STYLES.abandoned
              }`}
            >
              {session.status === "in_progress"
                ? "In Progress"
                : session.status === "completed"
                ? "Completed"
                : "Abandoned"}
            </span>
            {session.current_step && (
              <span className="text-xs text-gray-500">
                {STEP_LABELS[session.current_step] ?? session.current_step}
              </span>
            )}
          </div>

          {roleRecommended && (
            <p className="text-sm font-medium text-gray-900 mb-1 truncate">
              Role: {roleRecommended}
            </p>
          )}

          <p className="text-xs text-gray-400">
            {isCompleted && session.completed_at
              ? `Completed ${formatDate(session.completed_at)}`
              : `Started ${formatDate(session.created_at)}`}
          </p>
        </div>

        <div className="flex-shrink-0">
          {isCompleted && (
            <Link
              href={`/reports/${session.id}`}
              className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              View Report
            </Link>
          )}
          {isInProgress && (
            <Link
              href={`/discovery/${session.id}`}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Continue
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const { data: sessions } = await getSessions();
  const hasActiveSessions = sessions && sessions.length > 0;
  const hasInProgress = sessions?.some((s) => s.status === "in_progress");

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-0.5 text-sm">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            {!hasInProgress && (
              <Link
                href="/discovery"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <span>+</span>
                Start New PROFIT Session
              </Link>
            )}
            <Link
              href="/referrals"
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-medium text-gray-700 transition-colors"
            >
              Referrals
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-medium text-gray-700 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Sessions list */}
        {hasActiveSessions ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Your Sessions
              </h2>
              {sessions!.filter((s) => s.status === "completed").length >= 2 && (
                <Link
                  href="/dashboard/history"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Compare sessions →
                </Link>
              )}
            </div>
            <div className="space-y-3">
              {sessions!.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 text-2xl font-bold mb-4">
              P
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              No sessions yet
            </h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Start your first PROFIT discovery to identify exactly who to hire and when.
            </p>
            <Link
              href="/discovery"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Start PROFIT Discovery
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
