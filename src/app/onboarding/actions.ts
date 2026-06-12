"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const ProfileSchema = z.object({
  company_name: z.string().max(200).optional(),
  industry: z.string().max(100).optional(),
  team_size: z.coerce.number().int().min(1).max(100000).optional(),
  anonymous_mode: z.coerce.boolean().optional(),
});

export async function saveOnboardingProfile(
  _prevState: unknown,
  formData: FormData
): Promise<{ error: string | null }> {
  const parsed = ProfileSchema.safeParse({
    company_name: formData.get("company_name") || undefined,
    industry: formData.get("industry") || undefined,
    team_size: formData.get("team_size") || undefined,
    anonymous_mode: formData.get("anonymous_mode") === "true" ? true : false,
  });

  if (!parsed.success) {
    return { error: "Invalid profile data" };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("hr_users")
      .update(parsed.data)
      .eq("id", user.id);

    if (error) return { error: "Failed to save profile" };
    return { error: null };
  } catch {
    return { error: "Failed to save profile" };
  }
}
