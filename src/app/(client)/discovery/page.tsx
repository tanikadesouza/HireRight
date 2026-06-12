// src/app/(client)/discovery/page.tsx
// Server Component — PROFIT discovery entry point.
// Checks for active session; shows Start button or redirects to active session.

import { redirect } from "next/navigation";
import { getUser } from "@/lib/services/auth";
import { getSessions } from "@/lib/services/profit-sessions";
import StartDiscoveryButton from "@/components/client/StartDiscoveryButton";

export default async function DiscoveryPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const { data: sessions } = await getSessions();

  // If there's an active in_progress session, redirect to it
  const activeSession = sessions?.find((s) => s.status === "in_progress");
  if (activeSession) {
    redirect(`/discovery/${activeSession.id}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="mb-6">
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 text-2xl font-bold mb-4">
            P
          </span>
          <h1 className="text-2xl font-bold text-gray-900">
            Start Your PROFIT Discovery
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
    </main>
  );
}
