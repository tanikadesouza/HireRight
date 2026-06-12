// src/app/(client)/loading.tsx
// Shown while any Server Component in the (client) route group is loading.

export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    </main>
  );
}
