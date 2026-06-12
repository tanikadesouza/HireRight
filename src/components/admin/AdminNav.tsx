// src/components/admin/AdminNav.tsx
// Navigation sidebar for the admin section.

import Link from "next/link";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/bulk-email", label: "Bulk Email" },
  { href: "/admin/office-hours", label: "Office Hours" },
];

export function AdminNav() {
  return (
    <nav className="w-56 flex-shrink-0 bg-gray-900 min-h-screen p-4">
      <div className="mb-6">
        <span className="text-white font-bold text-lg">HireRight</span>
        <span className="ml-2 text-xs text-gray-400 font-medium uppercase tracking-wider">
          Admin
        </span>
      </div>
      <ul className="space-y-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
