// PATCH /api/reports/[sessionId]/financial-model
// Saves the founder's financial model inputs for a session.
// Called by FinancialCalculator (client component) via debounced fetch.

import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/services/auth";
import { saveFinancialModel, type FinancialModel } from "@/lib/services/reports";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: FinancialModel;
  try {
    body = await req.json() as FinancialModel;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { error } = await saveFinancialModel(sessionId, body);
  if (error) return NextResponse.json({ error: "Failed to save" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
