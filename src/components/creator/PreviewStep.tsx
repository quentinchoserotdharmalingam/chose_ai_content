"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FORMAT_META, type FormatSlug } from "@/types";
import { SyntheseRenderer } from "@/components/formats/SyntheseRenderer";
import { FlashcardsRenderer } from "@/components/formats/FlashcardsRenderer";
import { ModuleRenderer } from "@/components/formats/ModuleRenderer";
import { ScenariosRenderer } from "@/components/formats/ScenariosRenderer";

interface PreviewStepProps {
  resourceId: string;
  content: Record<string, object>;
  formats: FormatSlug[];
}

export function PreviewStep({ resourceId, content, formats }: PreviewStepProps) {
  const previewableFormats = formats.filter((f) => f !== "chat" && content[f]);
  const [activeFormat, setActiveFormat] = useState<FormatSlug>(previewableFormats[0] || "synthese");

  const renderContent = () => {
    const data = content[activeFormat];
    if (!data) return <p className="text-gray-500">Pas de contenu pour ce format</p>;

    switch (activeFormat) {
      case "synthese":
        return <SyntheseRenderer content={data} />;
      case "flashcards":
        return <FlashcardsRenderer content={data} />;
      case "module":
        return <ModuleRenderer content={data} />;
      case "scenarios":
        return <ScenariosRenderer content={data} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold">Preview</h2>
      <p className="mb-6 text-sm text-gray-500">
        Prévisualisez le contenu généré par format
      </p>

      {/* Format tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {previewableFormats.map((format) => (
          <button
            key={format}
            onClick={() => setActiveFormat(format)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeFormat === format
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>{FORMAT_META[format].icon}</span>
            {FORMAT_META[format].label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mb-8">{renderContent()}</div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href={`/consume/${resourceId}`}>
          <Button size="lg">Voir comme enrollee</Button>
        </Link>
        <Link href="/creator">
          <Button variant="outline" size="lg">
            Retour au dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
