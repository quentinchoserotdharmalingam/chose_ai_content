"use client";

import { useState, useEffect } from "react";
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
  MessageSquare,
  Bot,
  ChevronLeft,
  ChevronUp,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

const NAV_ITEMS = [
  { href: "/creator/agent", label: "Agent IA", icon: Bot },
  { href: "/creator", label: "Formation IA", icon: Sparkles },
  { href: "/creator/interview", label: "Interview IA", icon: MessageSquare },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/formations", label: "Formations", icon: GraduationCap },
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
  const [open, setOpen] = useState(false);
  const { collapsed, toggle } = useSidebar();

  // Close sidebar on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-ht-border shadow-sm lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5 text-ht-text" />
      </button>

      {/* Overlay on mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-ht-border bg-white transition-all duration-200 ease-in-out",
          collapsed ? "w-[60px]" : "w-[200px]",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Close button on mobile */}
        <button
          onClick={() => setOpen(false)}
          className="absolute right-2 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-ht-text-secondary hover:bg-ht-fill-secondary lg:hidden"
          aria-label="Fermer le menu"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Logo */}
        <div className="flex h-16 items-center justify-center px-4">
          <Link href="/creator" className="flex items-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ht-primary text-white shrink-0">
              <GraduationCap className="h-6 w-6" />
            </div>
          </Link>
        </div>

        {/* Back to menu */}
        {!collapsed && (
          <div className="border-b border-ht-border px-3 pb-3">
            <Link
              href="/creator"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-ht-text transition-all duration-200 ease-in-out hover:bg-ht-fill-secondary"
            >
              <ChevronLeft className="h-4 w-4" />
              Retour au menu
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/creator"
                  ? pathname === "/creator" || (pathname?.startsWith("/creator/") && !pathname?.startsWith("/creator/interview") && !pathname?.startsWith("/creator/agent"))
                  : item.href === "/creator/interview"
                  ? pathname === "/creator/interview" || pathname?.startsWith("/creator/interview/")
                  : item.href === "/creator/agent"
                  ? pathname === "/creator/agent" || pathname?.startsWith("/creator/agent/")
                  : pathname === item.href || pathname?.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg text-[13px] font-medium transition-all duration-200 ease-in-out",
                    collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
                    isActive
                      ? "bg-ht-primary text-white shadow-ht-1"
                      : "text-ht-text hover:bg-ht-fill-secondary"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-ht-text-secondary")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Collapse toggle — desktop only */}
        <div className="hidden lg:block border-t border-ht-border px-2 py-2">
          <button
            onClick={toggle}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-2 py-2 text-[12px] text-ht-text-secondary hover:text-ht-text hover:bg-ht-fill-secondary transition-all"
            title={collapsed ? "Étendre le menu" : "Réduire le menu"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!collapsed && <span>Réduire</span>}
          </button>
        </div>

        {/* User */}
        <div className="border-t border-ht-border px-2 py-3">
          <button className={cn(
            "flex w-full items-center rounded-lg text-[13px] text-ht-text transition-all duration-200 ease-in-out hover:bg-ht-fill-secondary",
            collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2"
          )}>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ht-fill-secondary text-xs font-medium text-ht-text shrink-0">
              N
            </div>
            {!collapsed && (
              <>
                <span className="flex-1 text-left font-medium truncate">Nathaniel</span>
                <ChevronUp className="h-4 w-4 text-ht-text-secondary" />
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
