"use server";

import { continueDiscovery } from "@/lib/services/profit-sessions";

export async function sendMessageAction(sessionId: string, message: string) {
  return continueDiscovery(sessionId, message);
}
