// src/app/(admin)/admin/bulk-email/page.tsx
// Server Component — admin bulk email composer (US-009)

import Link from "next/link";
import { getTags } from "@/lib/services/admin";
import { BulkEmailClient } from "./BulkEmailClient";

export default async function BulkEmailPage() {
  const { data: tags } = await getTags();

  return (
    <div className="p-8 max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/dashboard" className="hover:text-gray-700">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Bulk Email</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Send Bulk Email</h1>
      <p className="text-sm text-gray-500 mb-8">
        Compose and send a personalized email to all clients with a specific tag. Max 100
        recipients per send.
      </p>

      {tags && tags.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-700">
          <p className="font-semibold mb-1">No tags created yet.</p>
          <p>
            Tag clients from the{" "}
            <Link href="/admin/sessions" className="underline">
              Sessions
            </Link>{" "}
            page, then return here to send targeted emails.
          </p>
        </div>
      ) : (
        <BulkEmailClient tags={tags ?? []} />
      )}
    </div>
  );
}
