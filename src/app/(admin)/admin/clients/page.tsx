// src/app/(admin)/admin/clients/page.tsx
// Admin clients list — shows all registered users with session counts, tags, and tag filter.

import Link from "next/link";
import { getAllUsers, getAllSessions, getTags, getAllUserTagsMap } from "@/lib/services/admin";
import type { AdminUser, AdminSession, AdminTag } from "@/lib/services/admin";

interface AdminClientsPageProps {
  searchParams: Promise<{ tag?: string }>;
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

export default async function AdminClientsPage({ searchParams }: AdminClientsPageProps) {
  const { tag: tagFilter } = await searchParams;

  const [{ data: users }, { data: sessions }, { data: allTags }, userTagsMap] =
    await Promise.all([
      getAllUsers(),
      getAllSessions(),
      getTags(),
      getAllUserTagsMap(),
    ]);

  const allUsers: AdminUser[] = users ?? [];
  const allSessions: AdminSession[] = sessions ?? [];
  const tags: AdminTag[] = allTags ?? [];

  // Build session counts per user
  const sessionCountMap = new Map<string, { total: number; completed: number }>();
  for (const session of allSessions) {
    const existing = sessionCountMap.get(session.user_id) ?? { total: 0, completed: 0 };
    sessionCountMap.set(session.user_id, {
      total: existing.total + 1,
      completed: existing.completed + (session.status === "completed" ? 1 : 0),
    });
  }

  let clientUsers = allUsers.filter((u) => u.role !== "admin");
  const adminUsers = allUsers.filter((u) => u.role === "admin");

  // Apply tag filter
  if (tagFilter) {
    clientUsers = clientUsers.filter((u) => {
      const userTags = userTagsMap.get(u.id) ?? [];
      return userTags.some((t) => t.name === tagFilter);
    });
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {clientUsers.length} registered user{clientUsers.length !== 1 ? "s" : ""}
            {tagFilter ? ` tagged "${tagFilter}"` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/admin/export?type=users"
            download
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </a>
          <Link
            href="/admin/bulk-email"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Bulk Email
          </Link>
        </div>
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

      {/* Tag filter */}
      {tags.length > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Filter by tag:
          </span>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/clients"
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !tagFilter
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </Link>
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/admin/clients?tag=${encodeURIComponent(tag.name)}`}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  tagFilter === tag.name
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Clients table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">Client Accounts</h2>
        </div>

        {clientUsers.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            {tagFilter ? `No clients tagged "${tagFilter}".` : "No clients yet."}
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
                    Tags
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
                  const userTags = userTagsMap.get(user.id) ?? [];
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
                      <td className="px-6 py-4">
                        {userTags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {userTags.map((tag) => (
                              <Link
                                key={tag.id}
                                href={`/admin/clients?tag=${encodeURIComponent(tag.name)}`}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                              >
                                {tag.name}
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
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
