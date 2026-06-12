import Link from "next/link";
import { MicroWinDemo } from "@/components/client/MicroWinDemo";

const PROFIT_STEPS = [
  {
    letter: "P",
    title: "Pinpoint Goals",
    description:
      "Clarify the business outcome you need — not the tasks you want off your plate.",
  },
  {
    letter: "R",
    title: "Revamp Team Structure",
    description: "Map who's on your team now and what roles they actually fill vs. what's needed.",
  },
  {
    letter: "O",
    title: "Optimize Roles",
    description:
      "Identify which team members could transition to cover the gap with the right support.",
  },
  {
    letter: "F",
    title: "Fill the Gaps",
    description:
      "Define the exact skills, outcomes, and attributes the right hire must deliver.",
  },
  {
    letter: "I",
    title: "Implement & Tune",
    description:
      "Set the timeline, budget, and onboarding plan to make the hire succeed from day one.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I was about to hire an admin assistant. PROFIT showed me I actually needed an operations manager. That one insight saved me from a $60K mistake.",
    name: "Sarah K.",
    title: "Founder, consulting firm",
  },
  {
    quote:
      "I had no idea I could promote someone internally. HireRight identified the gap AND the person already on my team. We avoided a 6-month hiring process.",
    name: "Marcus T.",
    title: "CEO, service agency",
  },
  {
    quote:
      "The roadmap was ready in 12 minutes. I shared it with my partner and we aligned on the hire in one conversation instead of arguing for weeks.",
    name: "Priya M.",
    title: "Co-founder, coaching practice",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-gray-900 text-lg tracking-tight">HireRight</span>
          <div className="flex items-center gap-3">
            <Link
              href="/success-stories"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-1.5 hidden sm:block"
            >
              Stories
            </Link>
            <Link
              href="/resources"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-1.5 hidden sm:block"
            >
              Resources
            </Link>
            <Link
              href="/office-hours"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-1.5 hidden md:block"
            >
              Office Hours
            </Link>
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-blue-700 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Strategic hiring clarity in under 15 minutes
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-6 max-w-3xl mx-auto">
          Hire the right person for the{" "}
          <span className="text-blue-600">right problem</span> — not just the
          loudest symptom.
        </h1>

        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Most founders hire to offload tasks. HireRight uses the PROFIT method to help you hire
          for business transformation — so your next hire accelerates growth instead of adding
          overhead.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-xl transition-colors shadow-sm"
          >
            Start PROFIT Discovery — Free
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold text-base rounded-xl hover:bg-gray-50 transition-colors"
          >
            Sign in
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          No credit card required · Complete in ~10 minutes · Get your roadmap instantly
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Prefer to talk it through?{" "}
          <a
            href="https://calendly.com/hireright/discovery"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 font-medium"
          >
            Book a call with Tanika →
          </a>
        </p>
      </section>

      {/* Social proof strip */}
      <section className="border-y border-gray-100 bg-gray-50 py-5">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500 font-medium">
          <span>✓ 5-step PROFIT method</span>
          <span>✓ AI-powered discovery</span>
          <span>✓ Strategic roadmap in minutes</span>
          <span>✓ Trusted by 500+ founders</span>
        </div>
      </section>

      {/* Micro-win demo */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
            Try it now — no account needed
          </p>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Answer one question. Get an instant insight.
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            This is Step 1 of the 5-step PROFIT discovery. Sign up to complete the full session
            and receive your strategic hiring roadmap.
          </p>
        </div>

        <MicroWinDemo />
      </section>

      {/* PROFIT method */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">The PROFIT Method</h2>
            <p className="text-gray-400 max-w-lg mx-auto">
              A proven 5-step framework developed by a staffing agency founder to help service
              business owners hire strategically — not reactively.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PROFIT_STEPS.map((step) => (
              <div
                key={step.letter}
                className="bg-gray-800 rounded-xl p-5 border border-gray-700"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg mb-3">
                  {step.letter}
                </div>
                <h3 className="font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Your complete strategic hiring roadmap
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Every completed PROFIT session generates a full report — ready to act on immediately.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: "📋",
              title: "Role Recommendation",
              description:
                "Specific title, type (full-time/fractional/contractor), salary range, and required skills.",
            },
            {
              icon: "💰",
              title: "Financial Reality Check",
              description:
                "Fully-loaded cost calculator with break-even timeline and risk assessment.",
            },
            {
              icon: "📄",
              title: "Ready-to-Post Job Description",
              description: "AI-written JD based on your PROFIT answers. Copy and post immediately.",
            },
            {
              icon: "❓",
              title: "Interview Question Bank",
              description:
                "10 tailored questions — behavioral, situational, and culture-fit — specific to your hire.",
            },
            {
              icon: "📅",
              title: "90-Day Onboarding Plan",
              description:
                "Week-by-week roadmap to set your new hire up for success from day one.",
            },
            {
              icon: "⚠️",
              title: "Red Flag Diagnostics",
              description:
                "Honest signals if you should wait, document processes, or solve a people problem first.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-200 transition-colors"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-gray-900 mb-1.5">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-blue-50 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            What founders say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm">
                <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Your next hire is either an investment or an expense.
        </h2>
        <p className="text-gray-500 mb-8 text-lg leading-relaxed">
          The PROFIT method tells you which — and gives you a clear roadmap to make it the former.
          Free to start. Takes 10 minutes.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl transition-colors shadow-md"
        >
          Start PROFIT Discovery — Free
        </Link>
        <p className="text-xs text-gray-400 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <span className="font-bold text-gray-700">HireRight</span>
          <p className="text-sm text-gray-400">
            Strategic hiring clarity for service business founders.
          </p>
        </div>
      </footer>
    </main>
  );
}
