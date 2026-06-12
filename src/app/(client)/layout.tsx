// src/app/(client)/layout.tsx
// Wraps all authenticated client-facing pages with the AskTanika floating widget.

import { AskTanika } from "@/components/client/AskTanika";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <AskTanika />
    </>
  );
}
