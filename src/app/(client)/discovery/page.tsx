// src/app/(client)/discovery/page.tsx
// Server Component — PROFIT discovery entry point.
// Checks for active session; shows Start button or redirects to active session.

import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/services/auth";
import { getSessions } from "@/lib/services/profit-sessions";
import StartDiscoveryButton from "@/components/client/StartDiscoveryButton";

const STEP_LABELS: Record<string, string> = {
  pinpoint: "Pinpoint Goals",
  revamp: "Revamp Team",
  optimize: "Optimize Roles",
  fill: "Fill the Gaps",
  implement: "Implement & Tune",
};

const STEP_PROGRESS: Record<string, number> = {
  pinpoint: 20,
  revamp: 40,
  optimize: 60,
  fill: 80,
  implement: 100,
};

export default async function DiscoveryPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const { data: sessions } = await getSessions();

  // If there's an active in_progress session, redirect to it
  const activeSession = sessions?.find((s) => s.status === "in_progress");
  if (activeSession) {
    redirect(`/discovery/${activeSession.id}`);
  }

  // Find the most recent abandoned session (for recovery prompt)
  const recentAbandoned = sessions
    ?.filter((s) => s.status === "abandoned")
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full space-y-4">
        {/* Abandoned session recovery banner */}
        {recentAbandoned && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold">
                !
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900 mb-0.5">
                  You have an unfinished session
                </p>
                <p className="text-xs text-amber-700 mb-3">
                  You were on:{" "}
                  <span className="font-medium">
                    {recentAbandoned.current_step
                      ? STEP_LABELS[recentAbandoned.current_step] ?? recentAbandoned.current_step
                      : "Pinpoint Goals"}
                  </span>
                  {recentAbandoned.current_step && (
                    <span className="ml-1 text-amber-600">
                      ({STEP_PROGRESS[recentAbandoned.current_step] ?? 20}% complete)
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/discovery/${recentAbandoned.id}`}
                    className="inline-flex items-center px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Resume session →
                  </Link>
                  <span className="text-xs text-amber-600">or start a new one below</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main start card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="mb-6">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 text-2xl font-bold mb-4">
              P
            </span>
            <h1 className="text-2xl font-bold text-gray-900">
              {recentAbandoned ? "Start a New PROFIT Discovery" : "Start Your PROFIT Discovery"}
            </h1>
            <p className="mt-3 text-gray-600 leading-relaxed">
              The PROFIT method is a 5-step strategic process that helps you
              identify exactly who to hire and when. Takes about 10&ndash;15
              minutes.
            </p>
          </div>

          <div className="flex justify-around text-sm text-gray-500 mb-8 font-medium">
            {["P", "R", "O", "F", "I"].map((letter, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-700">
                  {letter}
                </span>
              </div>
            ))}
          </div>

          <StartDiscoveryButton />

          {/* US-041: Book-a-call escape hatch */}
          <p className="mt-6 text-xs text-gray-400">
            Prefer to talk it through?{" "}
            <a
              href="https://calendly.com/hireright/discovery"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Book a call with Tanika instead →
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
