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
  ChevronLeft,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/creator", label: "Formations", icon: GraduationCap },
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
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-100 px-4">
        <Link href="/creator" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
        </Link>
      </div>

      {/* Back to menu */}
      <div className="border-b border-gray-100 px-3 py-2">
        <Link
          href="/creator"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
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
                : pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-coral/10 text-coral"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-coral" : "text-gray-400")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-gray-100 px-3 py-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
            N
          </div>
          <span className="flex-1 text-left font-medium">Nathaniel</span>
          <ChevronUp className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </aside>
  );
}
