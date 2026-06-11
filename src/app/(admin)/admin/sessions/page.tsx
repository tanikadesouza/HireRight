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
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminSessionsPage({ searchParams }: SessionsPageProps) {
  const params = await searchParams;
  const statusFilter = params.status ?? "all";

  const { data: sessions, error } = await getAllSessions({
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sessions</h1>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {STATUS_OPTIONS.map((opt) => {
          const isActive = statusFilter === opt.value;
          return (
            <Link
              key={opt.value}
              href={`/admin/sessions${opt.value !== "all" ? `?status=${opt.value}` : ""}`}
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
