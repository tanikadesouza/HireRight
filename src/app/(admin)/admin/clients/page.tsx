// src/app/(admin)/admin/clients/page.tsx
// Admin clients list — shows all registered users with session counts and tags.

import Link from "next/link";
import { getAllUsers, getAllSessions } from "@/lib/services/admin";
import type { AdminUser, AdminSession } from "@/lib/services/admin";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

export default async function AdminClientsPage() {
  const [{ data: users }, { data: sessions }] = await Promise.all([
    getAllUsers(),
    getAllSessions(),
  ]);

  const allUsers: AdminUser[] = users ?? [];
  const allSessions: AdminSession[] = sessions ?? [];

  // Build session counts per user
  const sessionCountMap = new Map<string, { total: number; completed: number }>();
  for (const session of allSessions) {
    const existing = sessionCountMap.get(session.user_id) ?? { total: 0, completed: 0 };
    sessionCountMap.set(session.user_id, {
      total: existing.total + 1,
      completed: existing.completed + (session.status === "completed" ? 1 : 0),
    });
  }

  const clientUsers = allUsers.filter((u) => u.role !== "admin");
  const adminUsers = allUsers.filter((u) => u.role === "admin");

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {clientUsers.length} registered user{clientUsers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/bulk-email"
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Bulk Email
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Total Users
          </p>
          <p className="text-3xl font-bold text-gray-900">{clientUsers.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Active (has sessions)
          </p>
          <p className="text-3xl font-bold text-blue-600">
            {clientUsers.filter((u) => (sessionCountMap.get(u.id)?.total ?? 0) > 0).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Converted (completed)
          </p>
          <p className="text-3xl font-bold text-green-600">
            {clientUsers.filter((u) => (sessionCountMap.get(u.id)?.completed ?? 0) > 0).length}
          </p>
        </div>
      </div>

      {/* Clients table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">Client Accounts</h2>
        </div>

        {clientUsers.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No clients yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clientUsers.map((user) => {
                  const counts = sessionCountMap.get(user.id) ?? { total: 0, completed: 0 };
                  const hasCompleted = counts.completed > 0;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.full_name ?? "(no name)"}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{counts.total}</td>
                      <td className="px-6 py-4">
                        {hasCompleted ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            {counts.completed} completed
                          </span>
                        ) : counts.total > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            In progress
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/sessions?user=${user.id}`}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Sessions
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin accounts (collapsed) */}
      {adminUsers.length > 0 && (
        <details className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <summary className="px-6 py-4 cursor-pointer text-sm font-semibold text-gray-700 select-none list-none flex items-center gap-2">
            <span>Admin Accounts ({adminUsers.length})</span>
          </summary>
          <div className="border-t border-gray-200 divide-y divide-gray-100">
            {adminUsers.map((user) => (
              <div key={user.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.full_name ?? "(no name)"}
                  </p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <span className="text-xs text-gray-400">{formatDate(user.created_at)}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
