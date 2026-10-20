"use client";

import { AuthGate } from "@/components/auth-gate";
import { Sidebar } from "@/components/sidebar";
import { useHubBootstrap } from "@/hooks/use-collection";

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useHubBootstrap();

  return (
    <AuthGate>
      <div className="app-shell">
        <Sidebar />
        <main className="app-main">{children}</main>
      </div>
    </AuthGate>
  );
}
