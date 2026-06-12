// src/app/(admin)/admin/sessions/[sessionId]/page.tsx
// Server Component — session detail view with messages summary, notes, and tags.
// Middleware guards /admin/* routes (admin role required).

import Link from "next/link";
import { getSessionWithUser, getNotes, getTags, getUserTags, getEmailLogForSession } from "@/lib/services/admin";
import type { EmailLogEntry } from "@/lib/services/admin";
import { getMessages } from "@/lib/services/profit-sessions";
import { getHiringStage, getReport, HIRING_STAGE_LABELS } from "@/lib/services/reports";
import type { FinancialModel } from "@/lib/services/reports";
import { NoteForm } from "@/components/admin/NoteForm";
import { TagManager } from "@/components/admin/TagManager";
import type { AdminNote, AdminTag } from "@/lib/services/admin";

interface AdminSessionDetailProps {
  params: Promise<{ sessionId: string }>;
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export default async function AdminSessionDetailPage({
  params,
}: AdminSessionDetailProps) {
  const { sessionId } = await params;

  const [sessionResult, notesResult, tagsResult, messagesResult, hiringStageResult, reportResult, emailLogResult] =
    await Promise.all([
      getSessionWithUser(sessionId),
      getNotes(sessionId),
      getTags(),
      getMessages(sessionId),
      getHiringStage(sessionId),
      getReport(sessionId),
      getEmailLogForSession(sessionId),
    ]);

  const session = sessionResult.data;
  const notes: AdminNote[] = notesResult.data ?? [];
  const allTags: AdminTag[] = tagsResult.data ?? [];

  // Fetch user's current tags (only if session found)
  const userTagsResult = session?.user
    ? await getUserTags(session.user.id)
    : { data: [], error: null };
  const userTags: AdminTag[] = userTagsResult.data ?? [];
  const messages = messagesResult.data ?? [];
  const hiringStage = hiringStageResult.data;
  const financialModel = reportResult.data?.report_data?.financial_model as FinancialModel | null | undefined;
  const emailLog: EmailLogEntry[] = emailLogResult.data ?? [];

  if (!session) {
    return (
      <div className="p-8">
        <p className="text-red-600">Session not found.</p>
        <Link
          href="/admin/sessions"
          className="mt-4 inline-block text-sm text-blue-600 hover:underline"
        >
          Back to sessions
        </Link>
      </div>
    );
  }

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const assistantMessageCount = messages.filter((m) => m.role === "assistant").length;

  return (
    <div className="p-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/admin/sessions" className="hover:text-gray-600">
          Sessions
        </Link>
        <span>/</span>
        <span className="text-gray-700 truncate max-w-xs">{session.id}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Detail</h1>
      <p className="text-sm text-gray-500 mb-8">
        Client: {session.user?.full_name ?? "Unknown"} &bull;{" "}
        {session.user?.email ?? "—"}
      </p>

      {/* Session data card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Session Info
        </h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-gray-400">Status</dt>
            <dd className="font-medium text-gray-800 capitalize">
              {session.status.replace(/_/g, " ")}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400">Current Step</dt>
            <dd className="font-medium text-gray-800 capitalize">
              {session.current_step ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400">Report Generated</dt>
            <dd className="font-medium text-gray-800">
              {session.report_generated ? "Yes" : "No"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400">Created</dt>
            <dd className="font-medium text-gray-800">{formatDate(session.created_at)}</dd>
          </div>
          {session.completed_at && (
            <div>
              <dt className="text-gray-400">Completed</dt>
              <dd className="font-medium text-gray-800">
                {formatDate(session.completed_at)}
              </dd>
            </div>
          )}
          {hiringStage && (
            <div>
              <dt className="text-gray-400">Hiring Stage</dt>
              <dd className="font-medium text-gray-800">
                {HIRING_STAGE_LABELS[hiringStage.stage as keyof typeof HIRING_STAGE_LABELS] ?? hiringStage.stage}
              </dd>
            </div>
          )}
        </dl>

        {session.status === "completed" && session.report_generated && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link
              href={`/reports/${session.id}`}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              View Report
            </Link>
          </div>
        )}
      </div>

      {/* Messages summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Conversation Summary
        </h2>
        {messages.length === 0 ? (
          <p className="text-sm text-gray-400">No messages yet.</p>
        ) : (
          <dl className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-gray-400">Total Messages</dt>
              <dd className="text-2xl font-bold text-gray-800">{messages.length}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Founder Messages</dt>
              <dd className="text-2xl font-bold text-gray-800">{userMessageCount}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Advisor Messages</dt>
              <dd className="text-2xl font-bold text-gray-800">
                {assistantMessageCount}
              </dd>
            </div>
          </dl>
        )}
      </div>

      {/* Financial Model (if founder used the calculator) */}
      {financialModel && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Financial Model (Founder&apos;s Inputs)
          </h2>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-400">Base Salary</dt>
              <dd className="font-medium text-gray-800">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(financialModel.base_salary)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">Benefits %</dt>
              <dd className="font-medium text-gray-800">{financialModel.benefits_pct}%</dd>
            </div>
            <div>
              <dt className="text-gray-400">Tools Cost</dt>
              <dd className="font-medium text-gray-800">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(financialModel.tools_cost)}/yr
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">Mgmt Time</dt>
              <dd className="font-medium text-gray-800">{financialModel.mgmt_hours} hrs/wk</dd>
            </div>
            <div>
              <dt className="text-gray-400">Their Hourly Rate</dt>
              <dd className="font-medium text-gray-800">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(financialModel.your_hourly_rate)}/hr
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">Expected Revenue Uplift</dt>
              <dd className="font-medium text-gray-800">
                {financialModel.expected_revenue > 0
                  ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(financialModel.expected_revenue) + "/yr"
                  : "Not entered"}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Client Tags — interactive assign/remove/create */}
      {session.user && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Client Tags
          </h2>
          <TagManager
            userId={session.user.id}
            sessionId={sessionId}
            allTags={allTags}
            userTags={userTags}
          />
        </div>
      )}

      {/* Email Log */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Automated Emails Sent
        </h2>
        {emailLog.length === 0 ? (
          <p className="text-sm text-gray-400">No automated emails sent for this session yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 text-left font-semibold text-gray-500">Type</th>
                  <th className="pb-2 text-left font-semibold text-gray-500">Subject</th>
                  <th className="pb-2 text-left font-semibold text-gray-500">Status</th>
                  <th className="pb-2 text-left font-semibold text-gray-500">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {emailLog.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-2 pr-4">
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                        {entry.email_type}
                      </code>
                    </td>
                    <td className="py-2 pr-4 text-gray-600 max-w-xs truncate">
                      {(entry.metadata?.subject as string) ?? "—"}
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        entry.status === "sent"
                          ? "bg-green-100 text-green-700"
                          : entry.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-2 text-gray-500">
                      {entry.sent_at ? formatDate(entry.sent_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Internal Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Internal Notes
        </h2>

        {/* Add note form */}
        <div className="mb-6">
          <NoteForm sessionId={sessionId} />
        </div>

        {/* Existing notes */}
        {notes.length === 0 ? (
          <p className="text-sm text-gray-400">No notes yet.</p>
        ) : (
          <ul className="space-y-4">
            {notes.map((note) => (
              <li
                key={note.id}
                className="border-l-2 border-gray-200 pl-4 py-1"
              >
                <p className="text-sm text-gray-800 leading-relaxed">{note.note_text}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(note.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
