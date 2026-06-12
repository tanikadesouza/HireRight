"use client";

// RSVP form for office hours — collects name, email, company, optional session ID.
// Submits via Server Action; on success shows confirmation.

import { useActionState } from "react";
import { rsvpForOfficeHours } from "./actions";

interface Props {
  sessionDate: string;
  sessionTime: string;
}

export function OfficeHoursRsvpForm({ sessionDate, sessionTime }: Props) {
  const [state, action, pending] = useActionState(rsvpForOfficeHours, null);

  if (state?.success) {
    return (
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-900 mb-1">You&apos;re registered!</p>
        <p className="text-xs text-gray-500 leading-relaxed">
          Check your email for the Zoom link. We&apos;ll also send a reminder
          the day before.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="session_date" value={sessionDate} />
      <input type="hidden" name="session_time" value={sessionTime} />

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Full name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="full_name"
          required
          placeholder="Alex Johnson"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          required
          placeholder="alex@company.com"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Company <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          name="company"
          placeholder="Acme Consulting"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          What would you like help with? <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          name="question"
          rows={2}
          placeholder="e.g. deciding between fractional and full-time…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {state?.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors text-sm"
      >
        {pending ? "Registering…" : "Reserve My Spot"}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Free. Zoom link sent to your email.
      </p>
    </form>
  );
}
