"use client";

import { useRef, useState, useTransition } from "react";

interface NoteFormProps {
  sessionId: string;
  onNoteAdded?: (note: { id: string; note_text: string; created_at: string }) => void;
}

async function submitNote(
  sessionId: string,
  noteText: string
): Promise<{ error: string | null }> {
  // Server action via fetch to keep the admin service isolated from the component
  const res = await fetch("/api/admin/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, note_text: noteText }),
  });

  if (!res.ok) {
    return { error: "Failed to add note" };
  }

  return { error: null };
}

export function NoteForm({ sessionId, onNoteAdded }: NoteFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const noteText = textareaRef.current?.value.trim();
    if (!noteText) return;

    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await submitNote(sessionId, noteText);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      if (textareaRef.current) textareaRef.current.value = "";
      if (onNoteAdded) {
        onNoteAdded({
          id: crypto.randomUUID(),
          note_text: noteText,
          created_at: new Date().toISOString(),
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        ref={textareaRef}
        name="note_text"
        rows={3}
        placeholder="Add an internal note..."
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        required
        disabled={isPending}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {success && <p className="text-xs text-green-600">Note added.</p>}
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Add Note"}
      </button>
    </form>
  );
}
