"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startDiscoveryAction } from "@/app/(client)/discovery/actions";

export default function StartDiscoveryButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setIsPending(true);
    setError(null);

    try {
      const result = await startDiscoveryAction();

      if (result.error) {
        // 409 means there's already an active session — redirect to it
        if (result.error.status === 409) {
          router.push("/discovery");
          return;
        }
        setError(result.error.message || "Failed to start session. Please try again.");
        return;
      }

      router.push(`/discovery/${result.data.session_id}`);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
          {error}
        </p>
      )}
      <button
        onClick={handleStart}
        disabled={isPending}
        className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-base"
      >
        {isPending ? "Starting..." : "Start PROFIT Discovery"}
      </button>
    </div>
  );
}
