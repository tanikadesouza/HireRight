// src/app/(admin)/admin/tags/page.tsx
// Admin tags management — create, rename, and delete tags (US-008 edge case).

import Link from "next/link";
import { getTags, getTagUsageCounts } from "@/lib/services/admin";
import { TagActions } from "@/components/admin/TagActions";
import { createTagAction } from "./actions";
import type { AdminTag } from "@/lib/services/admin";

async function handleCreate(fd: FormData) {
  "use server";
  await createTagAction(fd);
}

export default async function AdminTagsPage() {
  const [{ data: tags }, usageMap] = await Promise.all([
    getTags(),
    getTagUsageCounts(),
  ]);

  const allTags: AdminTag[] = tags ?? [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tag Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {allTags.length} tag{allTags.length !== 1 ? "s" : ""} · Rename or delete tags; changes apply across all clients
          </p>
        </div>
        <Link
          href="/admin/clients"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Clients
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Existing tags */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Existing Tags</h2>
            </div>

            {allTags.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-400">
                No tags yet. Create your first tag →
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {allTags.map((tag) => {
                  const count = usageMap.get(tag.id) ?? 0;
                  return (
                    <TagActions key={tag.id} tag={tag} userCount={count} />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Create new tag */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Create New Tag</h2>
          <form action={handleCreate} className="space-y-3">
            <div>
              <label
                htmlFor="tag-name"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                Tag name
              </label>
              <input
                id="tag-name"
                name="name"
                type="text"
                required
                maxLength={50}
                placeholder="e.g. Admin Assistant, Operations, VIP"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              Create Tag
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              How tags work
            </h3>
            <ul className="space-y-1.5 text-xs text-gray-500">
              <li>• Tags are assigned to clients (users), not sessions</li>
              <li>• Use them to segment clients for bulk email campaigns</li>
              <li>• Renaming a tag updates it everywhere instantly</li>
              <li>• Deleting a tag removes it from all clients</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
