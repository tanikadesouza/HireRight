import { cookies } from "next/headers";

export async function serverApiCall<T = unknown>(
  functionName: string,
  payload: Record<string, unknown> = {}
): Promise<{ data: T | null; error: string | null }> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const cookieHeader = allCookies
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  try {
    const res = await fetch(
      `${supabaseUrl}/functions/v1/${functionName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
          Cookie: cookieHeader,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        data: null,
        error: (body as { error?: string }).error ?? `HTTP ${res.status}`,
      };
    }

    const json = (await res.json()) as { data: T };
    return { data: json.data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Request failed",
    };
  }
}
