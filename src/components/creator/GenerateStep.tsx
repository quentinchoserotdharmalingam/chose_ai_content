"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  const hasStarted = useRef(false);
  const onGeneratedRef = useRef(onGenerated);
  onGeneratedRef.current = onGenerated;

  const generate = useCallback(async () => {
    const generatableFormats = formats.filter((f) => f !== "chat");

    // Initialize all as pending
    const initial: Record<string, "pending"> = {};
    generatableFormats.forEach((f) => (initial[f] = "pending"));
    setStatus(initial);

    const results: Record<string, object> = {};
    let hasError = false;

    // Mark all as generating
    const generating: Record<string, "generating"> = {};
    generatableFormats.forEach((f) => (generating[f] = "generating"));
    setStatus(generating);

    // Generate all formats in parallel
    const promises = generatableFormats.map(async (format) => {
      try {
        const res = await fetch(`/api/resources/${resourceId}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ format }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur génération");

        results[format] = data.content;
        setStatus((prev) => ({ ...prev, [format]: "done" }));
      } catch (err) {
        console.error(`Error generating ${format}:`, err);
        setStatus((prev) => ({ ...prev, [format]: "error" }));
        hasError = true;
      }
    });

    await Promise.all(promises);

    // Finalize: update resource with enabled formats
    const enabledFormats = [
      ...Object.keys(results),
      ...(formats.includes("chat") ? ["chat"] : []),
    ];

    if (enabledFormats.length > 0) {
      try {
        await fetch(`/api/resources/${resourceId}/finalize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabledFormats }),
        });
      } catch {
        // Non-critical: status update failed
      }

      onGeneratedRef.current(results);
    } else if (hasError) {
      setError("Erreur lors de la génération des contenus");
    }
  }, [resourceId, formats]);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    generate();
  }, [generate]);

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
              {s === "generating" && <Loader2 className="h-5 w-5 animate-spin text-coral" />}
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
