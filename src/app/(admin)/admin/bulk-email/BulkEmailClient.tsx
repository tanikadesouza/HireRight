"use client";

import { useActionState, useEffect, useState } from "react";
import type { AdminTag } from "@/lib/services/admin";
import { sendBulkEmailAction, previewRecipientsAction } from "./actions";
import type { BulkEmailFormState } from "./actions";

interface BulkEmailClientProps {
  tags: AdminTag[];
}

const initialState: BulkEmailFormState = { status: "idle", message: "" };

export function BulkEmailClient({ tags }: BulkEmailClientProps) {
  const [state, formAction, isPending] = useActionState(sendBulkEmailAction, initialState);
  const [selectedTag, setSelectedTag] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (!selectedTag) {
      setPreviewCount(null);
      return;
    }
    setPreviewLoading(true);
    previewRecipientsAction(selectedTag).then(({ count }) => {
      setPreviewCount(count);
      setPreviewLoading(false);
    });
  }, [selectedTag]);

  return (
    <form action={formAction} className="space-y-5">
      {/* Tag selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Send to clients tagged with
        </label>
        <select
          name="tagName"
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">— Select a tag —</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.name}>
              {tag.name}
              {tag.description ? ` — ${tag.description}` : ""}
            </option>
          ))}
        </select>

        {/* Recipient preview */}
        {selectedTag && (
          <p className="mt-1.5 text-xs text-gray-500">
            {previewLoading ? (
              "Counting recipients…"
            ) : previewCount === 0 ? (
              <span className="text-amber-600">No clients found with this tag.</span>
            ) : previewCount !== null ? (
              <span className="text-green-700 font-medium">
                This will send to {previewCount} client{previewCount !== 1 ? "s" : ""}.
              </span>
            ) : null}
          </p>
        )}
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Subject line
        </label>
        <input
          type="text"
          name="subject"
          placeholder="e.g. Resources for Admin Assistant Hires"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          maxLength={200}
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Email body
        </label>
        <p className="text-xs text-gray-400 mb-1.5">
          Use <code className="bg-gray-100 px-1 rounded">{"{{name}}"}</code> to personalize with the
          client&apos;s name.
        </p>
        <textarea
          name="body"
          rows={10}
          placeholder={`Hi {{name}},\n\nI wanted to share some resources specifically for founders hiring an Admin Assistant...\n\nBest,\nTanika`}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          required
        />
      </div>

      {/* Status */}
      {state.status === "success" && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
          {state.message}
        </div>
      )}
      {state.status === "error" && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {state.message}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending || previewCount === 0 || !selectedTag}
          className="px-6 py-2.5 bg-gray-900 hover:bg-gray-700 text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Sending…" : "Send Bulk Email"}
        </button>
        {previewCount !== null && previewCount > 0 && !isPending && state.status !== "success" && (
          <p className="text-xs text-gray-400">
            Will send to {previewCount} recipient{previewCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </form>
  );
}
