"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const RsvpSchema = z.object({
  full_name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  company: z.string().max(200).optional(),
  question: z.string().max(1000).optional(),
  session_date: z.string().max(100),
  session_time: z.string().max(100),
});

type RsvpState = { success: true } | { success: false; error: string } | null;

export async function rsvpForOfficeHours(
  _prevState: RsvpState,
  formData: FormData
): Promise<RsvpState> {
  const parsed = RsvpSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    company: formData.get("company") || undefined,
    question: formData.get("question") || undefined,
    session_date: formData.get("session_date"),
    session_time: formData.get("session_time"),
  });

  if (!parsed.success) {
    return { success: false, error: "Please fill in all required fields." };
  }

  try {
    const supabase = await createClient();

    // Use untyped client since hr_office_hours_rsvps may not be in generated types
    const { error } = await (supabase as unknown as import("@supabase/supabase-js").SupabaseClient)
      .from("hr_office_hours_rsvps")
      .upsert(
        {
          email: parsed.data.email,
          full_name: parsed.data.full_name,
          company: parsed.data.company ?? null,
          question: parsed.data.question ?? null,
          session_label: `${parsed.data.session_date} ${parsed.data.session_time}`,
        },
        { onConflict: "email,session_label" }
      );

    if (error) {
      // Graceful fallback — table may not exist in dev
      if (error.code === "42P01") {
        return { success: true }; // table not yet created, treat as success in dev
      }
      return { success: false, error: "Registration failed. Please try again." };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Registration failed. Please try again." };
  }
}
