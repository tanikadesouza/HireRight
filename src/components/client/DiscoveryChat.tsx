"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { sendMessageAction } from "@/app/(client)/discovery/[sessionId]/actions";
import type { ProfitSession, ProfitMessage } from "@/lib/services/profit-sessions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Props {
  session: ProfitSession;
  initialMessages: ProfitMessage[];
}

// ---------------------------------------------------------------------------
// Testimonials (US-023) — shown as non-blocking callouts on step transitions
// ---------------------------------------------------------------------------

const STEP_TESTIMONIALS: Record<string, string[]> = {
  revamp: [
    "\"I was about to hire an admin assistant. PROFIT showed me I actually needed an ops manager. That one insight saved me from a $60K mistake.\" — Sarah K., consulting founder",
    "\"The team mapping step made me realize two of my contractors were doing overlapping work. Fixed that before hiring anyone new.\" — Marcus T., service agency CEO",
  ],
  optimize: [
    "\"I had no idea I could promote someone internally. HireRight identified the gap AND the person already on my team.\" — Priya M., coaching practice",
    "\"The internal-vs-external question stopped me from hiring externally for a role my existing ops lead was ready for. Saved 6 months of recruiting.\" — James R., consulting firm",
  ],
  fill: [
    "\"The fractional vs. full-time check saved me from overcommitting. I started fractional, validated the role, then converted to full-time at 6 months.\" — Leah C., agency owner",
    "\"Having a salary range in the report meant I could post the job that day instead of spending a week researching comp.\" — Daniel W., founder",
  ],
  implement: [
    "\"The red flags section made me realize I was hiring before my onboarding process was ready. I took 2 weeks to document everything first — best decision I made.\" — Tamara B., founder",
    "\"The roadmap gave me and my business partner alignment in one conversation instead of weeks of back-and-forth.\" — Chris N., service business owner",
  ],
};

function pickTestimonial(step: string): string {
  const options = STEP_TESTIMONIALS[step] ?? [];
  if (options.length === 0) return "";
  return options[Math.floor(Math.random() * options.length)];
}

// ---------------------------------------------------------------------------
// Step config
// ---------------------------------------------------------------------------

const STEPS = [
  { key: "pinpoint", label: "P", fullLabel: "Pinpoint", progress: 20 },
  { key: "revamp", label: "R", fullLabel: "Revamp", progress: 40 },
  { key: "optimize", label: "O", fullLabel: "Optimize", progress: 60 },
  { key: "fill", label: "F", fullLabel: "Fill", progress: 80 },
  { key: "implement", label: "I", fullLabel: "Implement", progress: 100 },
];

const STEP_PROGRESS: Record<string, number> = {
  pinpoint: 20,
  revamp: 40,
  optimize: 60,
  fill: 80,
  implement: 100,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DiscoveryChat({ session, initialMessages }: Props) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Seed chat messages from DB history (filter to user/assistant only)
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
      }))
  );

  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(session.current_step ?? "pinpoint");
  const [progress, setProgress] = useState(STEP_PROGRESS[session.current_step ?? "pinpoint"] ?? 20);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [testimonial, setTestimonial] = useState<string | null>(null);
  const testimonialTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  // Add the assistant's first question if no messages yet
  const hasMessages = messages.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isPending) return;

    setInput("");
    setError(null);
    setIsPending(true);

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const result = await sendMessageAction(session.id, trimmed);

      if (result.error) {
        setError(result.error.message || "Failed to send message. Please try again.");
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        return;
      }

      const { assistant_message, current_step, progress: newProgress, discovery_complete } = result.data;

      // Add assistant response
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: assistant_message,
        },
      ]);

      const prevStep = currentStep;
      setCurrentStep(current_step as "pinpoint" | "revamp" | "optimize" | "fill" | "implement");
      setProgress(newProgress);

      // Show testimonial on step transitions (not for very fast sessions < 2 min)
      if (current_step !== prevStep && !discovery_complete) {
        const quote = pickTestimonial(current_step);
        if (quote) {
          setTestimonial(quote);
          if (testimonialTimer.current) clearTimeout(testimonialTimer.current);
          testimonialTimer.current = setTimeout(() => setTestimonial(null), 6000);
        }
      }

      if (discovery_complete) {
        setGeneratingRoadmap(true);
        // Brief pause so user sees the message, then redirect to report
        setTimeout(() => {
          router.push(`/reports/${session.id}`);
        }, 2000);
      }
    } finally {
      setIsPending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  const activeStepIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-gray-900">PROFIT Discovery</h1>
            <span className="text-sm text-gray-500">{progress}% complete</span>
          </div>

          {/* Progress bar */}
          <div className="relative">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Step labels */}
            <div className="flex justify-between mt-2">
              {STEPS.map((step, index) => {
                const isActive = step.key === currentStep;
                const isDone = index < activeStepIndex;
                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <span
                      className={`text-xs font-medium ${
                        isActive
                          ? "text-blue-600"
                          : isDone
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                    <span
                      className={`text-xs hidden sm:block ${
                        isActive
                          ? "text-blue-600"
                          : isDone
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      {step.fullLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Show first question if no messages yet */}
          {!hasMessages && (
            <div className="flex justify-start">
              <div className="max-w-[80%] bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <p className="text-gray-800 text-sm leading-relaxed">
                  Let&apos;s start with the P in PROFIT &mdash; Pinpoint Goals. What business goal
                  are you working toward right now? What transition or change are you navigating?
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isPending && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-5">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          {/* Generating roadmap state */}
          {generatingRoadmap && (
            <div className="flex justify-center py-4">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Generating your roadmap...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Testimonial callout (US-023) — non-blocking, auto-dismiss after 6s */}
      {testimonial && (
        <div className="flex-shrink-0 px-4 py-3 bg-blue-50 border-t border-blue-100">
          <div className="max-w-2xl mx-auto flex items-start gap-3">
            <span className="text-blue-400 text-lg flex-shrink-0 mt-0.5">💬</span>
            <p className="text-sm text-blue-800 leading-relaxed flex-1 italic">{testimonial}</p>
            <button
              type="button"
              onClick={() => setTestimonial(null)}
              className="flex-shrink-0 text-blue-300 hover:text-blue-500 text-xs mt-0.5"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex-shrink-0 px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="max-w-2xl mx-auto text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Input area */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-4">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isPending || generatingRoadmap}
            placeholder="Type your response..."
            rows={2}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || isPending || generatingRoadmap}
            className="flex-shrink-0 h-11 w-11 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </form>
        <div className="max-w-2xl mx-auto mt-2 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Press Enter to send &middot; Shift+Enter for new line
          </p>
          <ContinueOnAnotherDevice sessionId={session.id} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// US-028 — Continue on another device
// ---------------------------------------------------------------------------

function ContinueOnAnotherDevice({ sessionId }: { sessionId: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSend() {
    setStatus("sending");
    try {
      const res = await fetch(`/api/sessions/${sessionId}/continue-link`, {
        method: "POST",
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
    setTimeout(() => setStatus("idle"), 4000);
  }

  return (
    <button
      type="button"
      onClick={handleSend}
      disabled={status === "sending" || status === "sent"}
      className="text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:cursor-default"
    >
      {status === "sending"
        ? "Sending link…"
        : status === "sent"
        ? "✓ Link sent to your email"
        : status === "error"
        ? "Failed — try again"
        : "Continue on another device →"}
    </button>
  );
}
