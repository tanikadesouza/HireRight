"use client";

// src/components/admin/TagActions.tsx
// Inline rename + delete actions for a tag row in admin tag management.

import { useState, useTransition } from "react";
import { renameTagAction, deleteTagAction } from "@/app/(admin)/admin/tags/actions";
import type { AdminTag } from "@/lib/services/admin";

interface TagActionsProps {
  tag: AdminTag;
  userCount: number;
}

export function TagActions({ tag, userCount }: TagActionsProps) {
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(tag.name);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === tag.name) {
      setEditing(false);
      return;
    }
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("tag_id", tag.id);
      fd.append("new_name", newName.trim());
      const result = await renameTagAction(fd);
      if (result.error) {
        setError(result.error);
      } else {
        setEditing(false);
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("tag_id", tag.id);
      const result = await deleteTagAction(fd);
      if (result.error) {
        setError(result.error);
        setConfirmDelete(false);
      }
    });
  }

  return (
    <div className="px-5 py-3">
      {editing ? (
        <form onSubmit={handleRenameSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={50}
            autoFocus
            className="flex-1 border border-blue-400 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => { setEditing(false); setNewName(tag.name); setError(null); }}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 truncate max-w-[160px]">
              {tag.name}
            </span>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {userCount} {userCount === 1 ? "client" : "clients"}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => { setEditing(true); setConfirmDelete(false); setError(null); }}
              className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Rename
            </button>
            {confirmDelete ? (
              <>
                <span className="text-xs text-red-600 font-medium">Delete?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="px-2.5 py-1 text-xs bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isPending ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => { setConfirmDelete(true); setEditing(false); }}
                className="px-2.5 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}
      {error && (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
