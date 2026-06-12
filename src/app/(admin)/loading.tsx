// src/app/(admin)/loading.tsx
// Shown while any Server Component in the (admin) route group is loading.

export default function Loading() {
  return (
    <main className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    </main>
  );
}
