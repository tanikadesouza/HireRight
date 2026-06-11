// src/app/(client)/discovery/[sessionId]/page.tsx
// Server Component — loads session and messages, passes to DiscoveryChat client component.

import { redirect, notFound } from "next/navigation";
import { getUser } from "@/lib/services/auth";
import { getSession, getMessages } from "@/lib/services/profit-sessions";
import DiscoveryChat from "@/components/client/DiscoveryChat";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function DiscoverySessionPage({ params }: PageProps) {
  const { sessionId } = await params;

  const user = await getUser();
  if (!user) redirect("/login");

  const [{ data: session, error: sessionError }, { data: messages }] =
    await Promise.all([getSession(sessionId), getMessages(sessionId)]);

  if (sessionError || !session) {
    notFound();
  }

  // If session is completed, redirect to report
  if (session.status === "completed") {
    redirect(`/reports/${sessionId}`);
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <DiscoveryChat
        session={session}
        initialMessages={messages ?? []}
      />
    </main>
  );
}
