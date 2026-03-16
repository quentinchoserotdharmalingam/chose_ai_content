"use client";

import { useState, useEffect, use } from "react";
import { Loader2 } from "lucide-react";
import { FormatSelector } from "@/components/formats/FormatSelector";
import type { FormatSlug } from "@/types";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  enabledFormats: string;
}

export default function ConsumePage({ params }: { params: Promise<{ resourceId: string }> }) {
  const { resourceId } = use(params);
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/resources/${resourceId}`)
      .then((res) => res.json())
      .then((data) => {
        setResource(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [resourceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-coral" />
      </div>
    );
  }

  if (!resource) {
    return <p className="py-8 text-center text-gray-500">Ressource introuvable</p>;
  }

  const enabledFormats: FormatSlug[] = JSON.parse(resource.enabledFormats || "[]");

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">{resource.title}</h1>
        {resource.description && (
          <p className="mt-2 text-gray-500">{resource.description}</p>
        )}
        <p className="mt-4 text-sm text-gray-400">Choisissez votre format d&apos;apprentissage</p>
      </div>

      <FormatSelector resourceId={resourceId} enabledFormats={enabledFormats} />
    </div>
  );
}
