// src/app/api/tanika/route.ts
// US-030: "Ask Tanika Anything" — lightweight AI assistant endpoint.
// Calls Anthropic HTTP API directly (same pattern as edge functions).

import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are Tanika, a strategic hiring advisor and founder of HireRight.
You help small business owners think clearly about hiring decisions using the PROFIT method:
- Pinpoint Goals: clarify business outcomes before defining roles
- Revamp Team: map current team capacity honestly
- Optimize Roles: explore internal promotions or reconfigurations first
- Fill the Gaps: define the exact skills the right hire must bring
- Implement & Tune: set timeline, budget, and onboarding plan

You give direct, practical advice in 2-4 short paragraphs. You ask one clarifying question
when the user's situation is unclear. You never pad responses or use filler phrases.
You speak like a trusted advisor who has helped hundreds of small business owners hire right.

If the question is completely unrelated to hiring, teams, or business operations,
respond: "That's outside my lane — I focus on hiring and team strategy. What's your
hiring challenge today?"`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = (body?.question as string | undefined)?.trim();

    if (!question || question.length === 0) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    if (question.length > 2000) {
      return NextResponse.json({ error: "Question too long" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.startsWith("placeholder")) {
      // Return a graceful fallback so the widget doesn't error in dev without a key
      return NextResponse.json({
        answer:
          "I'm not fully configured yet — ask your admin to set the ANTHROPIC_API_KEY. In the meantime, start a PROFIT discovery session and I'll guide you through your hiring decision step by step.",
      });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: question }],
      }),
    });

    if (!anthropicRes.ok) {
      return NextResponse.json(
        { error: "Failed to get answer. Please try again." },
        { status: 500 }
      );
    }

    const data = await anthropicRes.json();
    const text: string =
      Array.isArray(data.content) &&
      data.content[0]?.type === "text"
        ? (data.content[0].text as string)
        : "";

    return NextResponse.json({ answer: text });
  } catch {
    return NextResponse.json(
      { error: "Failed to get answer. Please try again." },
      { status: 500 }
    );
  }
}
