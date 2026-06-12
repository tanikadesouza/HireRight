// src/app/office-hours/page.tsx
// US-032: Monthly Hiring Strategy Office Hours — RSVP form + upcoming schedule.
// Public page; RSVP writes to hr_office_hours_rsvps via Server Action.

import type { Metadata } from "next";
import Link from "next/link";
import { OfficeHoursRsvpForm } from "./OfficeHoursRsvpForm";

export const metadata: Metadata = {
  title: "Monthly Hiring Strategy Office Hours",
  description:
    "Join Tanika live each month for strategic hiring Q&A, PROFIT method coaching, and peer founder discussion.",
};

// Next session details (admin-managed — update monthly)
const NEXT_SESSION = {
  date: "Wednesday, July 9, 2026",
  time: "12:00 PM – 1:00 PM ET",
  platform: "Zoom",
  spotsLeft: 38,
  totalSpots: 50,
};

const PAST_SESSIONS = [
  { date: "June 4, 2026", topic: "When to promote internally vs. hire externally", attendees: 44 },
  { date: "May 7, 2026", topic: "Fractional hiring: making the most of part-time talent", attendees: 41 },
  { date: "April 2, 2026", topic: "Salary benchmarking for small teams in 2026", attendees: 47 },
];

export default function OfficeHoursPage() {
  const percentFull = Math.round(
    ((NEXT_SESSION.totalSpots - NEXT_SESSION.spotsLeft) / NEXT_SESSION.totalSpots) * 100
  );

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900">
            HireRight
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/resources"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:block"
            >
              Resources
            </Link>
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Left: info */}
          <div>
            {/* Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Monthly — Free to attend
            </span>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Hiring Strategy Office Hours
            </h1>
            <p className="text-gray-600 text-base mb-6 leading-relaxed">
              Join Tanika and fellow founders for a live monthly session on strategic hiring.
              Bring your questions, your PROFIT report, or just listen in. Every session
              is recorded and shared with registrants.
            </p>

            {/* What to expect */}
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">What to expect</h2>
              <div className="space-y-3">
                {[
                  {
                    icon: "🎙️",
                    title: "Live Q&A with Tanika",
                    desc: "Bring your specific hiring situation and get real-time coaching.",
                  },
                  {
                    icon: "👥",
                    title: "Peer founder discussion",
                    desc: "Learn from others navigating similar hiring decisions.",
                  },
                  {
                    icon: "📋",
                    title: "PROFIT method deep-dive",
                    desc: "Each session focuses on one step or decision from the PROFIT framework.",
                  },
                  {
                    icon: "🎬",
                    title: "Recording shared post-session",
                    desc: "Can't make it live? All registrants get the recording within 24 hours.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Past sessions */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Past sessions</h2>
              <div className="space-y-2">
                {PAST_SESSIONS.map((ps) => (
                  <div
                    key={ps.date}
                    className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ps.topic}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{ps.date}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-3">
                      {ps.attendees} attended
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: RSVP card */}
          <div className="md:sticky md:top-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Session details */}
              <div className="bg-blue-600 px-5 py-4 text-white">
                <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1">
                  Next Session
                </p>
                <p className="text-base font-bold">{NEXT_SESSION.date}</p>
                <p className="text-sm text-blue-200 mt-0.5">{NEXT_SESSION.time}</p>
              </div>

              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-500">Spots remaining</span>
                  <span className="font-semibold text-gray-900">
                    {NEXT_SESSION.spotsLeft} / {NEXT_SESSION.totalSpots}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${percentFull}%` }}
                  />
                </div>
              </div>

              <div className="p-5">
                <OfficeHoursRsvpForm
                  sessionDate={NEXT_SESSION.date}
                  sessionTime={NEXT_SESSION.time}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
