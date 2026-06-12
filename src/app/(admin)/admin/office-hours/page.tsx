// src/app/(admin)/admin/office-hours/page.tsx
// Admin view of office hours RSVPs, grouped by session date.

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

interface Rsvp {
  id: string;
  email: string;
  full_name: string;
  company: string | null;
  question: string | null;
  session_label: string;
  created_at: string;
}

async function getRsvps(): Promise<{ data: Rsvp[] | null; error: string | null }> {
  try {
    const _supabase = await createClient();
    const supabase = _supabase as unknown as SupabaseClient;

    const { data, error } = await supabase
      .from("hr_office_hours_rsvps")
      .select("id, email, full_name, company, question, session_label, created_at")
      .order("session_label", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      if (error.code === "42P01") return { data: [], error: null }; // table not yet created
      return { data: null, error: "Failed to load RSVPs" };
    }

    return { data: (data ?? []) as Rsvp[], error: null };
  } catch {
    return { data: null, error: "Failed to load RSVPs" };
  }
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export default async function AdminOfficeHoursPage() {
  const { data: rsvps, error } = await getRsvps();

  // Group by session_label
  const grouped: Record<string, Rsvp[]> = {};
  for (const rsvp of rsvps ?? []) {
    if (!grouped[rsvp.session_label]) grouped[rsvp.session_label] = [];
    grouped[rsvp.session_label].push(rsvp);
  }
  const sessionLabels = Object.keys(grouped).sort().reverse();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Office Hours RSVPs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {rsvps?.length ?? 0} total registrations
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {sessionLabels.length === 0 && !error ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-center text-sm text-gray-400">
          No RSVPs yet. Share the{" "}
          <a href="/office-hours" className="text-blue-600 hover:underline">
            office hours page
          </a>{" "}
          to start collecting registrations.
        </div>
      ) : (
        <div className="space-y-8">
          {sessionLabels.map((label) => {
            const sessionRsvps = grouped[label];
            return (
              <div key={label} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-800">{label}</h2>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {sessionRsvps.length} registered
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Registrant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Question
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Registered
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sessionRsvps.map((rsvp) => (
                        <tr key={rsvp.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{rsvp.full_name}</p>
                            <p className="text-xs text-gray-400">{rsvp.email}</p>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {rsvp.company ?? <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                            {rsvp.question ? (
                              <p className="line-clamp-2">{rsvp.question}</p>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-400">
                            {formatDate(rsvp.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
