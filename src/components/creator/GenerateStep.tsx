"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { FORMAT_META, type FormatSlug } from "@/types";

interface GenerateStepProps {
  resourceId: string;
  formats: FormatSlug[];
  onGenerated: (content: Record<string, object>) => void;
}

export function GenerateStep({ resourceId, formats, onGenerated }: GenerateStepProps) {
  const [status, setStatus] = useState<Record<string, "pending" | "generating" | "done" | "error">>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generatableFormats = formats.filter((f) => f !== "chat");
    const initial: Record<string, "pending"> = {};
    generatableFormats.forEach((f) => (initial[f] = "pending"));
    setStatus(initial);

    async function generate() {
      try {
        // Mark all as generating
        const generating: Record<string, "generating"> = {};
        generatableFormats.forEach((f) => (generating[f] = "generating"));
        setStatus(generating);

        const res = await fetch(`/api/resources/${resourceId}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formats }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur génération");

        const final: Record<string, "done" | "error"> = {};
        generatableFormats.forEach((f) => {
          final[f] = data.results[f] ? "done" : "error";
        });
        setStatus(final);

        onGenerated(data.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur");
        const errStatus: Record<string, "error"> = {};
        generatableFormats.forEach((f) => (errStatus[f] = "error"));
        setStatus(errStatus);
      }
    }

    generate();
  }, [resourceId, formats, onGenerated]);

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold">Génération en cours</h2>
      <p className="mb-6 text-sm text-gray-500">
        L&apos;IA génère le contenu pour chaque format...
      </p>

      <div className="space-y-3">
        {formats.map((format) => {
          if (format === "chat") {
            return (
              <div key={format} className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-xl">{FORMAT_META[format].icon}</span>
                <span className="text-sm font-medium">{FORMAT_META[format].label}</span>
                <span className="ml-auto text-xs text-gray-400">Dynamique (pas de pré-génération)</span>
              </div>
            );
          }

          const s = status[format] || "pending";
          return (
            <div
              key={format}
              className={`flex items-center gap-3 rounded-lg border p-4 ${
                s === "done" ? "border-green-200 bg-green-50" : s === "error" ? "border-red-200 bg-red-50" : "border-gray-200"
              }`}
            >
              {s === "generating" && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
              {s === "done" && <Check className="h-5 w-5 text-green-600" />}
              {s === "error" && <AlertCircle className="h-5 w-5 text-red-600" />}
              {s === "pending" && <div className="h-5 w-5 rounded-full border-2 border-gray-300" />}
              <span className="text-xl">{FORMAT_META[format].icon}</span>
              <span className="text-sm font-medium">{FORMAT_META[format].label}</span>
              <span className="ml-auto text-xs text-gray-400">
                {s === "generating" ? "Génération..." : s === "done" ? "Terminé" : s === "error" ? "Erreur" : "En attente"}
              </span>
            </div>
          );
        })}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}
