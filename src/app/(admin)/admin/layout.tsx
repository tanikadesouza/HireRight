// src/app/(admin)/admin/layout.tsx
// Admin section layout — wraps all admin pages with AdminNav.
// Middleware guards /admin/* routes (requires role='admin' in JWT).

import { AdminNav } from "@/components/admin/AdminNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminNav />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
