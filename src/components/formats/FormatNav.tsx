"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FORMAT_META, type FormatSlug } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  resourceId: string;
  enabledFormats: FormatSlug[];
}

export function FormatNav({ resourceId, enabledFormats }: Props) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-around px-2 py-2">
        {enabledFormats.map((format) => {
          const meta = FORMAT_META[format];
          const isActive = pathname?.endsWith(`/${format}`);
          return (
            <Link
              key={format}
              href={`/consume/${resourceId}/${format}`}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs transition-colors",
                isActive ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <span className="text-lg">{meta.icon}</span>
              <span className="font-medium">{meta.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
