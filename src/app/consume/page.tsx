"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FORMAT_META, type FormatSlug } from "@/types";

interface Resource {
  id: string;
  title: string | null;
  description: string | null;
  status: string;
  enabledFormats: string;
  contents: Array<{ format: string }>;
}

export default function ConsumePage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/resources")
      .then((res) => res.json())
      .then((data) => {
        // Only show published or generated resources to enrollees
        const available = data.filter(
          (r: Resource) => r.status === "published" || r.status === "generated"
        );
        setResources(available);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const parseFormats = (json: string): FormatSlug[] => {
    try {
      return JSON.parse(json) as FormatSlug[];
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mes formations</h1>
        <p className="mt-1 text-sm text-gray-500">
          Choisissez une ressource pour commencer votre apprentissage
        </p>
      </div>

      {resources.length === 0 ? (
        <div className="py-16 text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">Aucune formation disponible pour le moment</p>
          <Link href="/">
            <Button className="mt-4" variant="outline">
              Retour à l&apos;accueil
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {resources.map((resource) => {
            const formats = parseFormats(resource.enabledFormats);

            return (
              <Link key={resource.id} href={`/consume/${resource.id}`}>
                <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <h3 className="font-semibold">
                      {resource.title || "Sans titre"}
                    </h3>
                    {resource.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                        {resource.description}
                      </p>
                    )}
                    {formats.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {formats.map((f) => (
                          <span
                            key={f}
                            className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                          >
                            {FORMAT_META[f]?.icon} {FORMAT_META[f]?.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
