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

const SESSIONS_PER_PAGE = 50;

/**
 * Returns client sessions across all users, with optional filters and pagination.
 * Returns { data, total, error } where total is the unfiltered count for the
 * current filter set (used to render pagination controls).
 */
export async function getAllSessions(filters?: {
  status?: string;
  tag?: string;
  userId?: string;
  page?: number;
}): Promise<{ data: AdminSession[] | null; total: number; error: string | null }> {
  try {
    const supabase = await createClient();
    const page = Math.max(1, filters?.page ?? 1);
    const from = (page - 1) * SESSIONS_PER_PAGE;
    const to = from + SESSIONS_PER_PAGE - 1;

    // If filtering by tag, we need to pre-resolve user IDs (tag filter is post-query)
    let tagUserIds: string[] | null = null;
    if (filters?.tag) {
      tagUserIds = await getUserIdsByTag(filters.tag);
      // If no users match the tag, return empty result immediately
      if (!tagUserIds || tagUserIds.length === 0) {
        return { data: [], total: 0, error: null };
      }
    }

    let query = supabase
      .from("hr_profit_sessions")
      .select(
        `id, user_id, status, current_step, session_data, report_generated,
         completed_at, created_at, updated_at,
         user:hr_users(id, email, full_name)`,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters?.userId) {
      query = query.eq("user_id", filters.userId);
    }

    if (tagUserIds) {
      query = query.in("user_id", tagUserIds);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      return { data: null, total: 0, error: "Failed to load sessions" };
    }

    return {
      data: (data ?? []) as AdminSession[],
      total: count ?? 0,
      error: null,
    };
  } catch {
    return { data: null, total: 0, error: "Failed to load sessions" };
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

/**
 * Returns a Map of userId → AdminTag[] for all users at once.
 * Used by the admin clients page to avoid N+1 tag fetches.
 */
export async function getAllUserTagsMap(): Promise<Map<string, AdminTag[]>> {
  try {
    const supabase = untyped(await createClient());
    const { data, error } = await supabase
      .from("hr_user_tags")
      .select("user_id, tag:hr_tags(id, name, description, created_at)");

    if (error || !data) return new Map();

    const map = new Map<string, AdminTag[]>();
    for (const row of data as unknown as Array<{ user_id: string; tag: AdminTag | AdminTag[] }>) {
      const tag = Array.isArray(row.tag) ? row.tag[0] : row.tag;
      if (!tag) continue;
      const existing = map.get(row.user_id) ?? [];
      existing.push(tag);
      map.set(row.user_id, existing);
    }
    return map;
  } catch {
    return new Map();
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

/**
 * Renames an existing tag.
 */
export async function renameTag(
  tagId: string,
  newName: string
): Promise<{ error: string | null }> {
  try {
    const supabase = untyped(await createClient());
    const { error } = await supabase
      .from("hr_tags")
      .update({ name: newName.trim() })
      .eq("id", tagId);

    if (error) return { error: "Failed to rename tag" };
    return { error: null };
  } catch {
    return { error: "Failed to rename tag" };
  }
}

/**
 * Deletes a tag and removes it from all users (ON DELETE CASCADE handles hr_user_tags).
 */
export async function deleteTag(tagId: string): Promise<{ error: string | null }> {
  try {
    const supabase = untyped(await createClient());
    const { error } = await supabase
      .from("hr_tags")
      .delete()
      .eq("id", tagId);

    if (error) return { error: "Failed to delete tag" };
    return { error: null };
  } catch {
    return { error: "Failed to delete tag" };
  }
}

/**
 * Returns the number of users assigned to each tag (for the tags management page).
 */
export async function getTagUsageCounts(): Promise<Map<string, number>> {
  try {
    const supabase = untyped(await createClient());
    const { data, error } = await supabase
      .from("hr_user_tags")
      .select("tag_id");

    if (error || !data) return new Map();

    const counts = new Map<string, number>();
    for (const row of data as Array<{ tag_id: string }>) {
      counts.set(row.tag_id, (counts.get(row.tag_id) ?? 0) + 1);
    }
    return counts;
  } catch {
    return new Map();
  }
}

// ---------------------------------------------------------------------------
// Email log
// ---------------------------------------------------------------------------

export interface EmailLogEntry {
  id: string;
  user_id: string;
  session_id: string | null;
  email_type: string;
  resend_message_id: string | null;
  status: string;
  metadata: Record<string, unknown>;
  sent_at: string | null;
  created_at: string;
}

/**
 * Returns all email log entries for a given session, newest first.
 * Admin-only — RLS enforces this.
 */
export async function getEmailLogForSession(
  sessionId: string
): Promise<{ data: EmailLogEntry[] | null; error: string | null }> {
  try {
    const supabase = untyped(await createClient());
    const { data, error } = await supabase
      .from("hr_email_log")
      .select("id, user_id, session_id, email_type, resend_message_id, status, metadata, sent_at, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (error) return { data: null, error: "Failed to load email log" };
    return { data: data as EmailLogEntry[], error: null };
  } catch {
    return { data: null, error: "Failed to load email log" };
  }
}

// ---------------------------------------------------------------------------
// System health / observability
// ---------------------------------------------------------------------------

export interface JobRun {
  id: string;
  job_name: string;
  status: "running" | "success" | "failure";
  output: string | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

/**
 * Returns the most recent N cron job runs, newest first.
 */
export async function getRecentJobRuns(
  limit = 20
): Promise<{ data: JobRun[] | null; error: string | null }> {
  try {
    const supabase = untyped(await createClient());
    const { data, error } = await supabase
      .from("hr_job_runs")
      .select("id, job_name, status, output, error_message, started_at, completed_at")
      .order("started_at", { ascending: false })
      .limit(limit);

    if (error) return { data: null, error: "Failed to load job runs" };
    return { data: data as JobRun[], error: null };
  } catch {
    return { data: null, error: "Failed to load job runs" };
  }
}

/**
 * Returns email log stats: total sent/failed by type in last 30 days.
 */
export async function getEmailLogStats(): Promise<{
  data: Array<{ email_type: string; sent: number; failed: number }> | null;
  error: string | null;
}> {
  try {
    const supabase = untyped(await createClient());
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("hr_email_log")
      .select("email_type, status")
      .gte("created_at", cutoff);

    if (error) return { data: null, error: "Failed to load email stats" };

    const statsMap = new Map<string, { sent: number; failed: number }>();
    for (const row of data as Array<{ email_type: string; status: string }>) {
      const existing = statsMap.get(row.email_type) ?? { sent: 0, failed: 0 };
      if (row.status === "sent") existing.sent++;
      else if (row.status === "failed") existing.failed++;
      statsMap.set(row.email_type, existing);
    }

    const result = Array.from(statsMap.entries())
      .map(([email_type, counts]) => ({ email_type, ...counts }))
      .sort((a, b) => b.sent + b.failed - (a.sent + a.failed));

    return { data: result, error: null };
  } catch {
    return { data: null, error: "Failed to load email stats" };
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
