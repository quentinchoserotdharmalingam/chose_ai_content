"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  GraduationCap,
  ClipboardList,
  HelpCircle,
  Calendar,
  Monitor,
  Box,
  FolderOpen,
  Mail,
  Zap,
  Trophy,
  Sparkles,
  ChevronLeft,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/formations", label: "Formations", icon: GraduationCap },
  { href: "/creator", label: "Contenu IA", icon: Sparkles },
  { href: "/questionnaires", label: "Questionnaires", icon: ClipboardList },
  { href: "/quiz", label: "Quiz", icon: HelpCircle },
  { href: "/events", label: "Événements", icon: Calendar },
  { href: "/software", label: "Logiciels", icon: Monitor },
  { href: "/equipment", label: "Équipements", icon: Box },
  { href: "/admin-docs", label: "Pièces administratives", icon: FolderOpen },
  { href: "/emails", label: "Emails", icon: Mail },
  { href: "/actions", label: "Actions", icon: Zap },
  { href: "/challenges", label: "Défis", icon: Trophy },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[200px] flex-col border-r border-ht-border bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center px-4">
        <Link href="/creator" className="flex items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ht-primary text-white">
            <GraduationCap className="h-6 w-6" />
          </div>
        </Link>
      </div>

      {/* Back to menu */}
      <div className="border-b border-ht-border px-3 pb-3">
        <Link
          href="/creator"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-ht-text transition-all duration-200 ease-in-out hover:bg-ht-fill-secondary"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour au menu
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/creator"
                ? pathname === "/creator" || pathname?.startsWith("/creator/")
                : pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 ease-in-out",
                  isActive
                    ? "bg-ht-primary text-white shadow-ht-1"
                    : "text-ht-text hover:bg-ht-fill-secondary"
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-ht-text-secondary")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-ht-border px-3 py-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-ht-text transition-all duration-200 ease-in-out hover:bg-ht-fill-secondary">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ht-fill-secondary text-xs font-medium text-ht-text">
            N
          </div>
          <span className="flex-1 text-left font-medium">Nathaniel</span>
          <ChevronUp className="h-4 w-4 text-ht-text-secondary" />
        </button>
      </div>
    </aside>
  );
}
