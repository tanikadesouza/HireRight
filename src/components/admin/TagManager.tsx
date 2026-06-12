"use client";

// Interactive tag manager for admin session detail page.
// Allows assigning/removing tags and creating new tags inline.

import { useActionState, useRef } from "react";
import { assignTagAction, removeTagAction, createAndAssignTagAction } from "@/app/(admin)/admin/sessions/[sessionId]/actions";
import type { AdminTag } from "@/lib/services/admin";

interface TagManagerProps {
  userId: string;
  sessionId: string;
  allTags: AdminTag[];
  userTags: AdminTag[];
}

export function TagManager({ userId, sessionId, allTags, userTags }: TagManagerProps) {
  const [assignState, assignAction, assignPending] = useActionState(assignTagAction, null);
  const [removeState, removeAction] = useActionState(removeTagAction, null);
  const [createState, createAction, createPending] = useActionState(createAndAssignTagAction, null);
  const newTagRef = useRef<HTMLInputElement>(null);

  const assignedIds = new Set(userTags.map((t) => t.id));
  const unassignedTags = allTags.filter((t) => !assignedIds.has(t.id));

  return (
    <div className="space-y-4">
      {/* Currently assigned tags */}
      <div>
        <p className="text-xs text-gray-400 mb-2">Assigned</p>
        {userTags.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No tags assigned yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {userTags.map((tag) => (
              <form key={tag.id} action={removeAction}>
                <input type="hidden" name="user_id" value={userId} />
                <input type="hidden" name="tag_id" value={tag.id} />
                <input type="hidden" name="session_id" value={sessionId} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 hover:bg-red-100 hover:text-red-700 transition-colors group"
                  title="Click to remove"
                >
                  {tag.name}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500">
                    ×
                  </span>
                </button>
              </form>
            ))}
          </div>
        )}
        {removeState?.error && (
          <p className="text-xs text-red-600 mt-1">{removeState.error}</p>
        )}
      </div>

      {/* Assign existing tag */}
      {unassignedTags.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Add existing tag</p>
          <form action={assignAction} className="flex gap-2">
            <input type="hidden" name="user_id" value={userId} />
            <input type="hidden" name="session_id" value={sessionId} />
            <select
              name="tag_id"
              required
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select tag…</option>
              {unassignedTags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={assignPending}
              className="px-3 py-1.5 bg-gray-900 hover:bg-gray-700 disabled:bg-gray-400 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Add
            </button>
          </form>
          {assignState?.error && (
            <p className="text-xs text-red-600 mt-1">{assignState.error}</p>
          )}
        </div>
      )}

      {/* Create new tag and assign */}
      <div>
        <p className="text-xs text-gray-400 mb-2">Create new tag</p>
        <form
          action={createAction}
          className="flex gap-2"
          onSubmit={() => {
            setTimeout(() => {
              if (newTagRef.current) newTagRef.current.value = "";
            }, 100);
          }}
        >
          <input type="hidden" name="user_id" value={userId} />
          <input type="hidden" name="session_id" value={sessionId} />
          <input
            ref={newTagRef}
            name="tag_name"
            type="text"
            placeholder="e.g. high-intent"
            maxLength={50}
            required
            className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={createPending}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            {createPending ? "..." : "Create & Add"}
          </button>
        </form>
        {createState?.error && (
          <p className="text-xs text-red-600 mt-1">{createState.error}</p>
        )}
      </div>
    </div>
  );
}
