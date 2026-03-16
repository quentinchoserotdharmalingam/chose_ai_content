"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const isCreator = pathname?.startsWith("/creator");
  const isConsume = pathname?.startsWith("/consume");

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-blue-600">
          <Brain className="h-5 w-5" />
          <span className="hidden sm:inline">Ressource IA</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/creator"
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              isCreator ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:text-gray-900"
            )}
          >
            Créateur
          </Link>
          <Link
            href="/consume"
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              isConsume ? "bg-purple-50 text-purple-600" : "text-gray-600 hover:text-gray-900"
            )}
          >
            Enrollee
          </Link>
          <Link
            href="/creator/new"
            className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
