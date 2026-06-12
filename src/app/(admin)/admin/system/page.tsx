// src/app/(admin)/admin/system/page.tsx
// Admin system health — cron job run history and email delivery stats.
// Middleware guards /admin/* routes (admin role required).

import { getRecentJobRuns, getEmailLogStats } from "@/lib/services/admin";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function durationSec(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return "running…";
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  return `${(ms / 1000).toFixed(1)}s`;
}

export default async function AdminSystemPage() {
  const [{ data: jobRuns }, { data: emailStats }] = await Promise.all([
    getRecentJobRuns(30),
    getEmailLogStats(),
  ]);

  const runs = jobRuns ?? [];
  const stats = emailStats ?? [];

  const lastRun = runs[0] ?? null;
  const successCount = runs.filter((r) => r.status === "success").length;
  const failureCount = runs.filter((r) => r.status === "failure").length;

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">System Health</h1>
      <p className="text-sm text-gray-500 mb-8">
        Cron job history and automated email delivery (last 30 days).
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Last Run
          </p>
          {lastRun ? (
            <>
              <p className="text-sm font-bold text-gray-900">{formatDate(lastRun.started_at)}</p>
              <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                lastRun.status === "success" ? "bg-green-100 text-green-700" :
                lastRun.status === "failure" ? "bg-red-100 text-red-700" :
                "bg-yellow-100 text-yellow-700"
              }`}>
                {lastRun.status}
              </span>
            </>
          ) : (
            <p className="text-sm text-gray-400">No runs yet</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Successful Runs
          </p>
          <p className="text-3xl font-bold text-green-600">{successCount}</p>
          <p className="text-xs text-gray-400 mt-1">of {runs.length} recent</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Failed Runs
          </p>
          <p className={`text-3xl font-bold ${failureCount > 0 ? "text-red-600" : "text-gray-300"}`}>
            {failureCount}
          </p>
          <p className="text-xs text-gray-400 mt-1">of {runs.length} recent</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Emails Sent (30d)
          </p>
          <p className="text-3xl font-bold text-blue-600">
            {stats.reduce((sum, s) => sum + s.sent, 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {stats.reduce((sum, s) => sum + s.failed, 0)} failed
          </p>
        </div>
      </div>

      {/* Email stats breakdown */}
      {stats.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Email Delivery by Type (Last 30 Days)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">Email Type</th>
                  <th className="pb-2 text-right font-semibold text-gray-500 text-xs uppercase tracking-wider">Sent</th>
                  <th className="pb-2 text-right font-semibold text-gray-500 text-xs uppercase tracking-wider">Failed</th>
                  <th className="pb-2 text-right font-semibold text-gray-500 text-xs uppercase tracking-wider">Success Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.map((s) => {
                  const total = s.sent + s.failed;
                  const rate = total > 0 ? Math.round((s.sent / total) * 100) : 0;
                  return (
                    <tr key={s.email_type}>
                      <td className="py-2 pr-4">
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-700">
                          {s.email_type}
                        </code>
                      </td>
                      <td className="py-2 text-right font-medium text-green-700">{s.sent}</td>
                      <td className="py-2 text-right font-medium text-red-500">{s.failed || "—"}</td>
                      <td className="py-2 text-right">
                        <span className={`text-xs font-semibold ${
                          rate >= 95 ? "text-green-600" : rate >= 80 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Job run history */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Cron Job Run History
          </h2>
        </div>

        {runs.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            No job runs recorded yet. Cron will log here once it fires.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {runs.map((run) => (
              <div key={run.id} className="px-6 py-3 flex items-start gap-4">
                <span className={`mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                  run.status === "success" ? "bg-green-100 text-green-700" :
                  run.status === "failure" ? "bg-red-100 text-red-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {run.status}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-gray-800 truncate">{run.job_name}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {durationSec(run.started_at, run.completed_at)}
                    </span>
                  </div>
                  {run.output && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{run.output}</p>
                  )}
                  {run.error_message && (
                    <p className="text-xs text-red-500 mt-0.5 truncate">{run.error_message}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(run.started_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
