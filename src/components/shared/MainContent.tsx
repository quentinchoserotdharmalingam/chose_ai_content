"use client";

import { useSidebar } from "./SidebarContext";

export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <main className="min-h-screen bg-white transition-[margin-left] duration-200 ease-in-out lg:ml-[var(--sidebar-w)]"
      style={{ "--sidebar-w": collapsed ? "60px" : "200px" } as React.CSSProperties}
    >
      <div className="px-4 py-4 pt-16 sm:px-6 sm:py-6 lg:px-8 lg:pt-6">{children}</div>
    </main>
  );
}
