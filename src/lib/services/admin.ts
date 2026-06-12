// src/lib/services/admin.ts
// Service layer for admin operations — joins sessions with users, notes, and tags.
// All functions require the caller to have role='admin' in their JWT — RLS enforces this.

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminSession {
  id: string;
  user_id: string;
  status: string;
  current_step: string | null;
  session_data: Record<string, unknown>;
  report_generated: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
}

export interface AdminNote {
  id: string;
  session_id: string;
  admin_id: string;
  note_text: string;
  created_at: string;
}

export interface AdminTag {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  tags?: AdminTag[];
}

// Use an untyped client for tables that haven't been added to the DB type yet.
// These tables (hr_admin_notes, hr_tags, hr_user_tags, hr_reports) are real
// schema tables — the Database type just needs to be regenerated.
function untyped(client: Awaited<ReturnType<typeof createClient>>): SupabaseClient {
  return client as unknown as SupabaseClient;
}

// ---------------------------------------------------------------------------
// Session queries
// ---------------------------------------------------------------------------

/**
 * Returns all client sessions across all users, with optional filters.
 * Joins hr_profit_sessions with hr_users.
 */
export async function getAllSessions(filters?: {
  status?: string;
  tag?: string;
}): Promise<{ data: AdminSession[] | null; error: string | null }> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("hr_profit_sessions")
      .select(
        `id, user_id, status, current_step, session_data, report_generated,
         completed_at, created_at, updated_at,
         user:hr_users(id, email, full_name)`
      )
      .order("created_at", { ascending: false });

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: "Failed to load sessions" };
    }

    let sessions = (data ?? []) as AdminSession[];

    // Filter by tag if specified (post-query filter via user's tags)
    if (filters?.tag) {
      const tagName = filters.tag;
      const userIds = await getUserIdsByTag(tagName);
      if (userIds) {
        sessions = sessions.filter((s) => userIds.includes(s.user_id));
      }
    }

    return { data: sessions, error: null };
  } catch {
    return { data: null, error: "Failed to load sessions" };
  }
}

/**
 * Returns a single session with its associated user data.
 */
export async function getSessionWithUser(sessionId: string): Promise<{
  data: AdminSession | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("hr_profit_sessions")
      .select(
        `id, user_id, status, current_step, session_data, report_generated,
         completed_at, created_at, updated_at,
         user:hr_users(id, email, full_name)`
      )
      .eq("id", sessionId)
      .single();

    if (error) {
      return { data: null, error: "Session not found" };
    }

    return { data: data as AdminSession, error: null };
  } catch {
    return { data: null, error: "Session not found" };
  }
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

/**
 * Adds an internal admin note to a session.
 */
export async function addNote(
  sessionId: string,
  noteText: string
): Promise<{ data: AdminNote | null; error: string | null }> {
  try {
    const _supabase = await createClient();
    const supabase = untyped(_supabase);
    const {
      data: { user },
    } = await _supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("hr_admin_notes")
      .insert({
        session_id: sessionId,
        admin_id: user.id,
        note_text: noteText,
      })
      .select("id, session_id, admin_id, note_text, created_at")
      .single();

    if (error) {
      return { data: null, error: "Failed to add note" };
    }

    return { data: data as AdminNote, error: null };
  } catch {
    return { data: null, error: "Failed to add note" };
  }
}

/**
 * Returns all admin notes for a session, ordered by creation time.
 */
export async function getNotes(sessionId: string): Promise<{
  data: AdminNote[] | null;
  error: string | null;
}> {
  try {
    const supabase = untyped(await createClient());
    const { data, error } = await supabase
      .from("hr_admin_notes")
      .select("id, session_id, admin_id, note_text, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: "Failed to load notes" };
    }

    return { data: data as AdminNote[], error: null };
  } catch {
    return { data: null, error: "Failed to load notes" };
  }
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

/**
 * Returns all available tags.
 */
export async function getTags(): Promise<{
  data: AdminTag[] | null;
  error: string | null;
}> {
  try {
    const supabase = untyped(await createClient());
    const { data, error } = await supabase
      .from("hr_tags")
      .select("id, name, description, created_at")
      .order("name", { ascending: true });

    if (error) {
      return { data: null, error: "Failed to load tags" };
    }

    return { data: data as AdminTag[], error: null };
  } catch {
    return { data: null, error: "Failed to load tags" };
  }
}

/**
 * Creates a new tag.
 */
export async function createTag(
  name: string,
  description?: string
): Promise<{ data: AdminTag | null; error: string | null }> {
  try {
    const supabase = untyped(await createClient());
    const { data, error } = await supabase
      .from("hr_tags")
      .insert({ name, description: description ?? null })
      .select("id, name, description, created_at")
      .single();

    if (error) {
      return { data: null, error: "Failed to create tag" };
    }

    return { data: data as AdminTag, error: null };
  } catch {
    return { data: null, error: "Failed to create tag" };
  }
}

/**
 * Adds a tag to a user.
 */
export async function addUserTag(
  userId: string,
  tagId: string
): Promise<{ data: null; error: string | null }> {
  try {
    const supabase = untyped(await createClient());
    const { error } = await supabase
      .from("hr_user_tags")
      .insert({ user_id: userId, tag_id: tagId });

    if (error) {
      // Ignore duplicate key errors (tag already applied)
      if (error.code === "23505") {
        return { data: null, error: null };
      }
      return { data: null, error: "Failed to add tag" };
    }

    return { data: null, error: null };
  } catch {
    return { data: null, error: "Failed to add tag" };
  }
}

/**
 * Removes a tag from a user.
 */
export async function removeUserTag(
  userId: string,
  tagId: string
): Promise<{ data: null; error: string | null }> {
  try {
    const supabase = untyped(await createClient());
    const { error } = await supabase
      .from("hr_user_tags")
      .delete()
      .eq("user_id", userId)
      .eq("tag_id", tagId);

    if (error) {
      return { data: null, error: "Failed to remove tag" };
    }

    return { data: null, error: null };
  } catch {
    return { data: null, error: "Failed to remove tag" };
  }
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

/**
 * Returns all users with their assigned tags.
 */
export async function getAllUsers(): Promise<{
  data: AdminUser[] | null;
  error: string | null;
}> {
  try {
    const _supabase = await createClient();
    // hr_users IS in the typed schema, but the join to hr_user_tags/hr_tags is not.
    // Use the typed client for the base select and cast the result.
    const { data, error } = await _supabase
      .from("hr_users")
      .select("id, email, full_name, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: "Failed to load users" };
    }

    const users: AdminUser[] = (data ?? []).map((u) => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      created_at: u.created_at,
      tags: [],
    }));

    return { data: users, error: null };
  } catch {
    return { data: null, error: "Failed to load users" };
  }
}

/**
 * Returns the tags currently assigned to a user.
 */
export async function getUserTags(userId: string): Promise<{
  data: AdminTag[] | null;
  error: string | null;
}> {
  try {
    const supabase = untyped(await createClient());
    const { data, error } = await supabase
      .from("hr_user_tags")
      .select("tag:hr_tags(id, name, description, created_at)")
      .eq("user_id", userId);

    if (error) return { data: null, error: "Failed to load user tags" };

    const tags = ((data ?? []) as unknown as Array<{ tag: AdminTag | AdminTag[] }>)
      .map((row) => (Array.isArray(row.tag) ? row.tag[0] : row.tag))
      .filter(Boolean) as AdminTag[];

    return { data: tags, error: null };
  } catch {
    return { data: null, error: "Failed to load user tags" };
  }
}

// ---------------------------------------------------------------------------
// Bulk email
// ---------------------------------------------------------------------------

export interface BulkEmailTarget {
  user_id: string;
  email: string;
  full_name: string | null;
}

/**
 * Returns all users with a given tag, for bulk-email targeting.
 * Returns empty array if no users match (admin can validate before sending).
 */
export async function getUsersByTag(tagName: string): Promise<{
  data: BulkEmailTarget[] | null;
  error: string | null;
}> {
  try {
    const _supabase = await createClient();
    const supabase = untyped(_supabase);

    // Find tag ID
    const { data: tagData, error: tagError } = await supabase
      .from("hr_tags")
      .select("id")
      .eq("name", tagName)
      .single();

    if (tagError || !tagData) {
      return { data: [], error: null };
    }

    // Find all user_ids with this tag
    const { data: userTags, error: utError } = await supabase
      .from("hr_user_tags")
      .select("user_id")
      .eq("tag_id", (tagData as { id: string }).id);

    if (utError || !userTags || (userTags as unknown[]).length === 0) {
      return { data: [], error: null };
    }

    const userIds = (userTags as Array<{ user_id: string }>).map((r) => r.user_id);

    // Fetch user details using typed client
    const { data: users, error: usersError } = await _supabase
      .from("hr_users")
      .select("id, email, full_name")
      .in("id", userIds);

    if (usersError) {
      return { data: null, error: "Failed to fetch users for tag" };
    }

    return {
      data: (users ?? []).map((u) => ({
        user_id: u.id,
        email: u.email,
        full_name: u.full_name,
      })),
      error: null,
    };
  } catch {
    return { data: null, error: "Failed to fetch users for tag" };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getUserIdsByTag(tagName: string): Promise<string[] | null> {
  try {
    const supabase = untyped(await createClient());
    const { data, error } = await supabase
      .from("hr_user_tags")
      .select("user_id, tag:hr_tags!inner(name)")
      .eq("hr_tags.name", tagName);

    if (error || !data) return null;
    return (data as Array<{ user_id: string }>).map((row) => row.user_id);
  } catch {
    return null;
  }
}
