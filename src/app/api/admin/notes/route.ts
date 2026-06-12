// POST /api/admin/notes
// Adds an internal admin note to a session.
// Auth: requires admin role (checked via hr_users.role).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { addNote } from "@/lib/services/admin";

const NoteSchema = z.object({
  session_id: z.string().uuid(),
  note_text: z.string().min(1).max(5000),
});

export async function POST(req: NextRequest) {
  // Verify admin role
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userRow } = await supabase
    .from("hr_users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userRow || userRow.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse + validate body
  let body: z.infer<typeof NoteSchema>;
  try {
    const raw = await req.json();
    body = NoteSchema.parse(raw);
  } catch (err) {
    const msg = err instanceof z.ZodError
      ? err.issues.map((i: { message: string }) => i.message).join("; ")
      : "Invalid request body";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { data, error } = await addNote(body.session_id, body.note_text);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, note: data });
}
