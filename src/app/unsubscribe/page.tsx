// src/app/unsubscribe/page.tsx
// Confirmation page shown after a one-click email unsubscribe.
// Reached via redirect from GET /api/unsubscribe?uid=...&type=...&status=ok

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Unsubscribed — HireRight",
};

const PREF_LABELS: Record<string, string> = {
  followup_14d: "follow-up emails after your PROFIT discovery",
  followup_6mo: "the 6-month check-in email",
  marketing: "marketing and bulk emails",
};

interface UnsubscribePageProps {
  searchParams: Promise<{ status?: string; type?: string }>;
}

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const { status, type } = await searchParams;

  const isOk = status === "ok";
  const isInvalid = status === "invalid";
  const typeLabel = type ? PREF_LABELS[type] ?? "emails from HireRight" : "emails from HireRight";

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm max-w-md w-full p-8 text-center">
        {isOk ? (
          <>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">You&apos;ve been unsubscribed</h1>
            <p className="text-sm text-gray-500 mb-6">
              You&apos;ll no longer receive {typeLabel}. This takes effect immediately.
            </p>
            <p className="text-xs text-gray-400 mb-6">
              You can re-enable email notifications at any time in your account settings.
            </p>
          </>
        ) : isInvalid ? (
          <>
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856C18.07 19 19 18.07 19 17V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10c0 1.07.93 2 2 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid unsubscribe link</h1>
            <p className="text-sm text-gray-500 mb-6">
              This link appears to be invalid or expired. Sign in to manage your email
              preferences from your account settings.
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-500 mb-6">
              We couldn&apos;t process your unsubscribe request. Please try again or manage your
              preferences from your account settings.
            </p>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Go to dashboard
          </Link>
          <Link
            href="/settings/account"
            className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            Email settings
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          <Link href="/" className="hover:text-gray-600">
            HireRight
          </Link>
          {" "}— Strategic Hiring Clarity
          {" · "}
          <Link href="/privacy" className="hover:text-gray-600">
            Privacy Policy
          </Link>
        </p>
      </div>
    </main>
  );
}
