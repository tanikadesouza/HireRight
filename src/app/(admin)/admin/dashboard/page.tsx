// src/app/(admin)/admin/dashboard/page.tsx
// Server Component — admin dashboard with stats and recent sessions.
// Middleware guards this route; only admin role can access /admin/*.

import Link from "next/link";
import { getAllSessions } from "@/lib/services/admin";
import { SessionTable } from "@/components/admin/SessionTable";
import type { AdminSession } from "@/lib/services/admin";

function isToday(dateString: string): boolean {
  const d = new Date(dateString);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isWithinLastDays(dateString: string, days: number): boolean {
  const d = new Date(dateString);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d >= cutoff;
}

export default async function AdminDashboardPage() {
  const { data: sessions } = await getAllSessions();
  const allSessions: AdminSession[] = sessions ?? [];

  const totalSessions = allSessions.length;
  const completedToday = allSessions.filter(
    (s) => s.status === "completed" && s.completed_at && isToday(s.completed_at)
  ).length;
  const abandonedLast7 = allSessions.filter(
    (s) => s.status === "abandoned" && isWithinLastDays(s.created_at, 7)
  ).length;
  const completedTotal = allSessions.filter((s) => s.status === "completed").length;
  const conversionRate =
    totalSessions > 0 ? Math.round((completedTotal / totalSessions) * 100) : 0;

  const recentSessions = allSessions.slice(0, 10);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Total Sessions
          </p>
          <p className="text-3xl font-bold text-gray-900">{totalSessions}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Completed Today
          </p>
          <p className="text-3xl font-bold text-green-600">{completedToday}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Abandoned (7d)
          </p>
          <p className="text-3xl font-bold text-gray-500">{abandonedLast7}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Conversion Rate
          </p>
          <p className="text-3xl font-bold text-blue-600">{conversionRate}%</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3 mb-10">
        <Link
          href="/admin/sessions"
          className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          All Sessions
        </Link>
        <Link
          href="/admin/clients"
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clients
        </Link>
        <Link
          href="/admin/bulk-email"
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Bulk Email
        </Link>
      </div>

      {/* Recent sessions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-800">Recent Sessions</h2>
          <Link
            href="/admin/sessions"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View all
          </Link>
        </div>
        <SessionTable sessions={recentSessions} showActions />
      </div>
    </div>
  );
}
