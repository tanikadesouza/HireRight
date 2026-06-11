"use server";
import { startDiscovery } from "@/lib/services/profit-sessions";

export async function startDiscoveryAction(sessionSource?: string) {
  return startDiscovery(sessionSource);
}
