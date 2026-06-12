// src/app/(admin)/admin/dashboard/page.tsx
// Server Component — admin dashboard with stats and recent sessions.
// Middleware guards this route; only admin role can access /admin/*.

import Link from "next/link";
import { getAllSessions, getAllUsers } from "@/lib/services/admin";
import { SessionTable } from "@/components/admin/SessionTable";
import type { AdminSession, AdminUser } from "@/lib/services/admin";

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

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

function BarRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-28 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 w-8 text-right flex-shrink-0">
        {count}
      </span>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [{ data: sessions }, { data: users }] = await Promise.all([
    getAllSessions(),
    getAllUsers(),
  ]);
  const allSessions: AdminSession[] = sessions ?? [];
  const allUsers: AdminUser[] = (users ?? []).filter((u) => u.role !== "admin");

  const totalSessions = allSessions.length;
  const completedToday = allSessions.filter(
    (s) => s.status === "completed" && s.completed_at && isToday(s.completed_at)
  ).length;
  const newUsersLast7 = allUsers.filter((u) => isWithinLastDays(u.created_at, 7)).length;
  const completedTotal = allSessions.filter((s) => s.status === "completed").length;
  const inProgressTotal = allSessions.filter((s) => s.status === "in_progress").length;
  const abandonedTotal = allSessions.filter((s) => s.status === "abandoned").length;
  const conversionRate =
    totalSessions > 0 ? Math.round((completedTotal / totalSessions) * 100) : 0;

  // Step funnel — for non-completed in_progress sessions, count by step
  const inProgressSessions = allSessions.filter((s) => s.status === "in_progress");
  const stepCounts: Record<string, number> = {};
  for (const s of inProgressSessions) {
    const step = s.current_step ?? "pinpoint";
    stepCounts[step] = (stepCounts[step] ?? 0) + 1;
  }
  const STEPS = ["pinpoint", "revamp", "optimize", "fill", "implement"];
  const STEP_LABELS: Record<string, string> = {
    pinpoint: "Pinpoint",
    revamp: "Revamp",
    optimize: "Optimize",
    fill: "Fill",
    implement: "Implement",
  };

  // Recent signups (last 7 days)
  const recentUsers = [...allUsers]
    .filter((u) => isWithinLastDays(u.created_at, 7))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const recentSessions = allSessions.slice(0, 8);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Total Sessions
          </p>
          <p className="text-3xl font-bold text-gray-900">{totalSessions}</p>
          <p className="text-xs text-gray-400 mt-1">{allUsers.length} registered users</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Completed Today
          </p>
          <p className="text-3xl font-bold text-green-600">{completedToday}</p>
          <p className="text-xs text-gray-400 mt-1">{completedTotal} all-time</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            New Users (7d)
          </p>
          <p className="text-3xl font-bold text-blue-600">{newUsersLast7}</p>
          <p className="text-xs text-gray-400 mt-1">{inProgressTotal} sessions active</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Conversion Rate
          </p>
          <p className="text-3xl font-bold text-purple-600">{conversionRate}%</p>
          <p className="text-xs text-gray-400 mt-1">{abandonedTotal} abandoned</p>
        </div>
      </div>

      {/* Two-column analytics row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Session status breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Session Status
          </h2>
          <div className="space-y-3">
            <BarRow label="Completed" count={completedTotal} total={totalSessions} color="bg-green-500" />
            <BarRow label="In Progress" count={inProgressTotal} total={totalSessions} color="bg-blue-500" />
            <BarRow label="Abandoned" count={abandonedTotal} total={totalSessions} color="bg-gray-400" />
          </div>
          <p className="text-xs text-gray-400 mt-4">{totalSessions} sessions total</p>
        </div>

        {/* Active sessions by step */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Active Sessions by Step
          </h2>
          {inProgressTotal === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No active sessions</p>
          ) : (
            <div className="space-y-3">
              {STEPS.map((step) => (
                <BarRow
                  key={step}
                  label={STEP_LABELS[step]}
                  count={stepCounts[step] ?? 0}
                  total={inProgressTotal}
                  color="bg-blue-400"
                />
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-4">{inProgressTotal} active sessions</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3 mb-8">
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
        <Link
          href="/admin/office-hours"
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Office Hours RSVPs
        </Link>
      </div>

      {/* Bottom row: recent signups + recent sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
        {/* Recent signups */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Recent Signups</h2>
            <Link
              href="/admin/clients"
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              View all
            </Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No signups in last 7 days</p>
          ) : (
            <ul className="space-y-3">
              {recentUsers.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {u.full_name ?? "(no name)"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatDate(u.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
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
    </div>
  );
}
