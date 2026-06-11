"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const TEASER_RESPONSES: Record<string, string> = {
  default:
    "That's a pivotal moment. Founders navigating transitions like yours often discover they don't need more hands — they need a different kind of leverage. The PROFIT method will help you pinpoint whether you need a hire who executes, one who leads, or one who creates systems so you can step back. Ready to find out?",
  scale:
    "Scaling typically means your bottleneck has shifted from 'doing the work' to 'managing the doing.' Before you hire for execution, let's explore whether you first need someone to build the systems that make execution possible. The PROFIT method surfaces that distinction in about 10 minutes.",
  revenue:
    "Revenue goals usually point to one of three gaps: more leads (marketing/sales hire), faster conversions (ops hire), or higher capacity (delivery hire). The PROFIT method will help you identify which of those is actually your constraint right now — so you hire for the right problem.",
  team:
    "Team challenges are often a symptom, not the root cause. Before adding a new person, the PROFIT method explores whether a role redefinition or internal promotion could solve the same problem for less cost and disruption. Let's find out what you actually need.",
  client:
    "Client capacity issues usually signal one of two things: you need delivery capacity (a hire who does the work), or you need operational leverage (a hire who systematizes the work so you can do more). The PROFIT method will clarify which — and help you avoid the expensive mistake of hiring for the wrong one.",
};

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("scale") || lower.includes("grow") || lower.includes("expand"))
    return TEASER_RESPONSES.scale;
  if (lower.includes("revenue") || lower.includes("income") || lower.includes("profit"))
    return TEASER_RESPONSES.revenue;
  if (lower.includes("team") || lower.includes("hire") || lower.includes("staff"))
    return TEASER_RESPONSES.team;
  if (lower.includes("client") || lower.includes("customer") || lower.includes("capacity"))
    return TEASER_RESPONSES.client;
  return TEASER_RESPONSES.default;
}

export function MicroWinDemo() {
  const [stage, setStage] = useState<"idle" | "typing" | "thinking" | "response">("idle");
  const [userInput, setUserInput] = useState("");
  const [response, setResponse] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (stage === "idle") inputRef.current?.focus();
  }, [stage]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userInput.trim() || stage === "thinking") return;

    const answer = userInput.trim();
    setStage("thinking");

    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 600));

    setResponse(getResponse(answer));
    setStage("response");
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gray-900 px-5 py-3 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <span className="text-gray-400 text-xs font-medium ml-2">PROFIT Discovery — Preview</span>
      </div>

      <div className="p-6 space-y-4">
        {/* AI question */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            P
          </div>
          <div className="bg-blue-50 rounded-xl rounded-tl-none px-4 py-3 max-w-prose">
            <p className="text-sm text-blue-900 leading-relaxed">
              <strong>Let&apos;s start with the P in PROFIT — Pinpoint Goals.</strong>
              <br />
              What business goal are you working toward right now? What transition or pivot are you
              navigating?
            </p>
          </div>
        </div>

        {/* User input or response */}
        {stage === "idle" || stage === "typing" ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">
                You
              </div>
              <textarea
                ref={inputRef}
                value={userInput}
                onChange={(e) => {
                  setUserInput(e.target.value);
                  setStage(e.target.value ? "typing" : "idle");
                }}
                placeholder="Type your answer here..."
                rows={3}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl rounded-tl-none text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!userInput.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Get my insight →
              </button>
            </div>
          </form>
        ) : stage === "thinking" ? (
          <div className="flex items-center gap-3 py-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              P
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* User bubble */}
            <div className="flex items-start gap-3 justify-end">
              <div className="bg-gray-100 rounded-xl rounded-tr-none px-4 py-3 max-w-prose">
                <p className="text-sm text-gray-800">{userInput}</p>
              </div>
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">
                You
              </div>
            </div>

            {/* AI response */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                P
              </div>
              <div className="bg-blue-50 rounded-xl rounded-tl-none px-4 py-3 max-w-prose">
                <p className="text-sm text-blue-900 leading-relaxed">{response}</p>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-center">
              <p className="text-white text-sm font-semibold mb-3">
                That&apos;s just Step 1 of 5. Your full strategic hiring roadmap is 4 questions away.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 font-bold text-sm rounded-lg hover:bg-blue-50 transition-colors"
              >
                Get my full PROFIT roadmap →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
