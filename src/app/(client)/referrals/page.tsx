// src/app/(client)/referrals/page.tsx
// Server Component — referral program dashboard (US-026)

import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/services/auth";
import { getMyReferralCode, getMyReferrals } from "@/lib/services/referrals";
import { ReferralLinkCopy } from "./ReferralLinkCopy";

export default async function ReferralsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const [{ data: code }, { data: stats }] = await Promise.all([
    getMyReferralCode(),
    getMyReferrals(),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hireright.app";
  const referralUrl = code ? `${appUrl}/r/${code}` : null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            ← Dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Referral Program</h1>
        <p className="text-sm text-gray-500 mb-8">
          Share HireRight with fellow founders. You earn a reward when someone you refer completes
          their first PROFIT discovery session.
        </p>

        {/* Referral link */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Your Referral Link
          </h2>
          {referralUrl ? (
            <ReferralLinkCopy url={referralUrl} />
          ) : (
            <p className="text-sm text-gray-400 italic">
              Referral code not yet generated. Contact support if this persists.
            </p>
          )}
          <p className="text-xs text-gray-400 mt-3">
            Anyone who signs up through your link is attributed to you. You earn a reward when
            they complete their first session.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Referred", value: stats?.total ?? 0 },
            { label: "Signed Up", value: stats?.signed_up ?? 0 },
            { label: "Completed Session", value: stats?.completed ?? 0 },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-gray-200 p-5 text-center"
            >
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              <p className="text-xs font-medium text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-6 mb-6">
          <h2 className="text-sm font-semibold text-blue-700 uppercase tracking-wider mb-4">
            How It Works
          </h2>
          <ol className="space-y-3">
            {[
              "Share your unique referral link with a founder friend.",
              "They sign up at HireRight using your link.",
              "When they complete their first PROFIT discovery session, you both earn a reward.",
              "Rewards are delivered within 48 hours of their session completion.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-blue-900">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Referral history */}
        {stats && stats.referrals.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Referral History</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {stats.referrals.map((r) => (
                <div key={r.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.referee_email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(r.created_at))}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      r.status === "converted"
                        ? "bg-green-100 text-green-800"
                        : r.status === "completed_session"
                        ? "bg-blue-100 text-blue-800"
                        : r.status === "signed_up"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {r.status === "pending"
                      ? "Pending"
                      : r.status === "signed_up"
                      ? "Signed up"
                      : r.status === "completed_session"
                      ? "Session complete"
                      : "Converted"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats && stats.referrals.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">
            No referrals yet. Share your link to get started!
          </div>
        )}
      </div>
    </main>
  );
}
