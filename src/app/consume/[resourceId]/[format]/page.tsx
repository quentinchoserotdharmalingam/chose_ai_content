"use client";

import { useState, useEffect, use } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormatNav } from "@/components/formats/FormatNav";
import { SyntheseRenderer } from "@/components/formats/SyntheseRenderer";
import { FlashcardsRenderer } from "@/components/formats/FlashcardsRenderer";
import { ChatRenderer } from "@/components/formats/ChatRenderer";
import { ModuleRenderer } from "@/components/formats/ModuleRenderer";
import { ScenariosRenderer } from "@/components/formats/ScenariosRenderer";
import type { FormatSlug } from "@/types";

interface ResourceData {
  id: string;
  title: string;
  enabledFormats: string;
  contents: Array<{ format: string; content: string }>;
}

export default function FormatPage({
  params,
}: {
  params: Promise<{ resourceId: string; format: string }>;
}) {
  const { resourceId, format } = use(params);
  const [resource, setResource] = useState<ResourceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetch(`/api/resources/${resourceId}`)
      .then((res) => res.json())
      .then((data) => {
        setResource(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [resourceId]);

  const handleComplete = async () => {
    await fetch(`/api/resources/${resourceId}/complete`, { method: "POST" });
    setCompleted(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!resource) {
    return <p className="py-8 text-center text-gray-500">Ressource introuvable</p>;
  }

  const enabledFormats: FormatSlug[] = JSON.parse(resource.enabledFormats || "[]");

  if (completed) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h2 className="text-2xl font-bold">Terminé !</h2>
        <p className="text-gray-500">Vous avez complété cette ressource.</p>
        <Button variant="outline" onClick={() => setCompleted(false)}>
          Continuer à explorer
        </Button>
      </div>
    );
  }

  const renderFormat = () => {
    if (format === "chat") {
      return <ChatRenderer resourceId={resourceId} />;
    }

    const formatContent = resource.contents.find((c) => c.format === format);
    if (!formatContent) {
      return <p className="text-gray-500">Contenu non disponible pour ce format</p>;
    }

    const parsedContent = JSON.parse(formatContent.content);

    switch (format) {
      case "synthese":
        return <SyntheseRenderer content={parsedContent} />;
      case "flashcards":
        return <FlashcardsRenderer content={parsedContent} />;
      case "module":
        return <ModuleRenderer content={parsedContent} />;
      case "scenarios":
        return <ScenariosRenderer content={parsedContent} />;
      default:
        return <p className="text-gray-500">Format inconnu</p>;
    }
  };

  return (
    <div className="pb-24">
      {renderFormat()}

      {/* Complete button */}
      <div className="mt-8 text-center">
        <Button onClick={handleComplete} size="lg" className="bg-green-600 hover:bg-green-700">
          J&apos;ai terminé
        </Button>
      </div>

      {/* Bottom nav */}
      {enabledFormats.length > 1 && (
        <FormatNav resourceId={resourceId} enabledFormats={enabledFormats} />
      )}
    </div>
  );
}
