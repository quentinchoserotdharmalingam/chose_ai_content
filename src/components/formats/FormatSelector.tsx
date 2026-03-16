"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { FORMAT_META, type FormatSlug } from "@/types";

interface Props {
  resourceId: string;
  enabledFormats: FormatSlug[];
}

export function FormatSelector({ resourceId, enabledFormats }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {enabledFormats.map((format) => {
        const meta = FORMAT_META[format];
        return (
          <Link key={format} href={`/consume/${resourceId}/${format}`}>
            <Card className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="flex items-center gap-4 p-5">
                <span className="text-3xl">{meta.icon}</span>
                <div>
                  <p className="font-medium">{meta.label}</p>
                  <p className="text-xs text-gray-500">{meta.description}</p>
                  <p className="mt-1 text-xs font-medium text-coral">{meta.duration}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
