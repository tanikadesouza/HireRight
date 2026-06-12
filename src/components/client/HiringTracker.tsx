"use client";

// Hiring stage progress tracker shown on the report page.
// Allows founders to track their hiring pipeline from JD → Hired.

import { useActionState } from "react";
import { updateHiringStageAction } from "@/app/(client)/reports/[sessionId]/actions";

// Inlined here to avoid importing server-only service module in a client component
export type HiringStage =
  | "drafting_jd"
  | "posted"
  | "shortlisting"
  | "interviewing"
  | "offer_made"
  | "hired";

export interface HiringStageRecord {
  id: string;
  session_id: string;
  user_id: string;
  stage: HiringStage;
  notes: string | null;
  updated_at: string;
  created_at: string;
}

const HIRING_STAGES: HiringStage[] = [
  "drafting_jd",
  "posted",
  "shortlisting",
  "interviewing",
  "offer_made",
  "hired",
];

const HIRING_STAGE_LABELS: Record<HiringStage, string> = {
  drafting_jd:  "Drafting JD",
  posted:       "Posted",
  shortlisting: "Shortlisting",
  interviewing: "Interviewing",
  offer_made:   "Offer Made",
  hired:        "Hired!",
};

interface HiringTrackerProps {
  sessionId: string;
  currentRecord: HiringStageRecord | null;
}

export function HiringTracker({ sessionId, currentRecord }: HiringTrackerProps) {
  const currentStage: HiringStage = currentRecord?.stage ?? "drafting_jd";
  const currentIdx = HIRING_STAGES.indexOf(currentStage);

  const [state, formAction, isPending] = useActionState(updateHiringStageAction, null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Hiring Progress
        </h2>
        {currentRecord && (
          <span className="text-xs text-gray-400">
            {currentStage === "hired" ? "Congrats! Role filled." : "Tap a stage to update"}
          </span>
        )}
      </div>

      {/* Stage pipeline */}
      <div className="flex items-center gap-0 mb-5 overflow-x-auto pb-1">
        {HIRING_STAGES.map((stage, idx) => {
          const isDone = idx <= currentIdx;
          const isActive = idx === currentIdx;
          const isLast = idx === HIRING_STAGES.length - 1;

          return (
            <div key={stage} className="flex items-center flex-shrink-0">
              <form action={formAction}>
                <input type="hidden" name="session_id" value={sessionId} />
                <input type="hidden" name="stage" value={stage} />
                <button
                  type="submit"
                  disabled={isPending}
                  title={`Mark as: ${HIRING_STAGE_LABELS[stage]}`}
                  className={`flex flex-col items-center px-2 py-1 rounded-lg transition-colors text-center min-w-[72px] ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : isDone
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                    isActive
                      ? "bg-white text-blue-600"
                      : isDone
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-500"
                  }`}>
                    {isDone && !isActive ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <span className="text-xs font-medium leading-tight whitespace-nowrap">
                    {HIRING_STAGE_LABELS[stage]}
                  </span>
                </button>
              </form>

              {!isLast && (
                <div className={`h-0.5 w-4 flex-shrink-0 mx-0.5 ${
                  idx < currentIdx ? "bg-blue-400" : "bg-gray-200"
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Current stage label */}
      <p className="text-xs text-gray-500 mb-3">
        Current stage:{" "}
        <span className="font-semibold text-gray-800">
          {HIRING_STAGE_LABELS[currentStage]}
        </span>
      </p>

      {state?.error && (
        <p className="text-xs text-red-600 mt-2">{state.error}</p>
      )}

      {/* Hired celebration */}
      {currentStage === "hired" && (
        <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
          Role filled! Consider running a new PROFIT session for your next hire.
        </div>
      )}
    </div>
  );
}
