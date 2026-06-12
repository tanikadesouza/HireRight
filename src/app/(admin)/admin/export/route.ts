// GET /admin/export?type=users|sessions
// Streams a CSV export for admin use. Auth: admin role required (middleware).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAllSessions, getAllUsers } from "@/lib/services/admin";

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Wrap in quotes if value contains comma, newline, or quote
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSVRow(values: unknown[]): string {
  return values.map(escapeCSV).join(",");
}

export async function GET(req: NextRequest) {
  // Verify admin role
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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

  const type = req.nextUrl.searchParams.get("type") ?? "sessions";

  if (type === "users") {
    const { data: users } = await getAllUsers();
    const rows = [
      toCSVRow(["id", "email", "full_name", "company_name", "industry", "anonymous_mode", "role", "created_at"]),
      ...(users ?? []).map((u) =>
        toCSVRow([u.id, u.email, u.full_name, u.company_name, u.industry, u.anonymous_mode ? "yes" : "no", u.role, u.created_at])
      ),
    ];
    return new NextResponse(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="hireright-users-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  // Default: sessions
  const { data: sessions } = await getAllSessions();
  const rows = [
    toCSVRow([
      "session_id",
      "user_id",
      "user_email",
      "user_name",
      "status",
      "current_step",
      "report_generated",
      "created_at",
      "completed_at",
    ]),
    ...(sessions ?? []).map((s) =>
      toCSVRow([
        s.id,
        s.user_id,
        s.user?.email ?? "",
        s.user?.full_name ?? "",
        s.status,
        s.current_step ?? "",
        s.report_generated ? "yes" : "no",
        s.created_at,
        s.completed_at ?? "",
      ])
    ),
  ];

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="hireright-sessions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
