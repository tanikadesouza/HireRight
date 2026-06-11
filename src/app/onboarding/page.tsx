// src/app/onboarding/page.tsx
// US-002: 3-step onboarding flow (Client Component with step state).
// Explains PROFIT, collects company info, then redirects to discovery.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const INDUSTRY_OPTIONS = [
  "Business Consulting",
  "Marketing Agency",
  "Law Firm",
  "Healthcare",
  "Creative Agency",
  "Tech/Software",
  "Real Estate",
  "Financial Services",
  "Education",
  "Other",
];

const PROFIT_STEPS = [
  {
    letter: "P",
    title: "Pinpoint Goals",
    description: "Clarify what business goal you're working toward right now",
  },
  {
    letter: "R",
    title: "Revamp Team Structure",
    description: "Map your current team composition and roles",
  },
  {
    letter: "O",
    title: "Optimize Roles",
    description: "Identify who on your team can evolve or transition",
  },
  {
    letter: "F",
    title: "Fill the Gaps",
    description: "Define the specific role and skills you need",
  },
  {
    letter: "I",
    title: "Implement & Tune",
    description: "Set your timeline, budget, and success metrics",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [industry, setIndustry] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [isPending, setIsPending] = useState(false);

  function handleNext() {
    setStep((prev) => prev + 1);
  }

  async function handleFinish() {
    setIsPending(true);
    // Phase 2: save industry + teamSize to hr_users profile
    // For now, redirect directly to discovery
    router.push("/discovery");
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`w-2 h-2 rounded-full transition-colors ${
                n === step ? "bg-blue-600" : n < step ? "bg-blue-300" : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Welcome + PROFIT explainer */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Welcome to HireRight</h1>
              <p className="mt-2 text-gray-500 text-sm">
                We use the PROFIT method to help you hire with confidence.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {PROFIT_STEPS.map((s) => (
                <div key={s.letter} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
                    {s.letter}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-xl px-4 py-3 mb-6 text-center">
              <p className="text-sm text-blue-700 font-medium">
                Estimated time: ~10 minutes
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Get Started
            </button>
          </div>
        )}

        {/* Step 2: Company info */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Tell us about your business</h2>
              <p className="mt-2 text-gray-500 text-sm">
                This helps us give you more relevant insights.
              </p>
            </div>

            <div className="space-y-5 mb-8">
              <div>
                <label
                  htmlFor="industry"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Industry
                </label>
                <select
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Select an industry</option>
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="teamSize"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Current team size
                </label>
                <input
                  id="teamSize"
                  type="number"
                  min="1"
                  max="10000"
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors text-sm"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: CTA */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              You&apos;re all set!
            </h2>
            <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
              Your PROFIT discovery session is ready to go. Let&apos;s identify exactly who you
              need to hire next.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors text-sm"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={isPending}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                {isPending ? "Launching..." : "Start PROFIT Discovery"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
