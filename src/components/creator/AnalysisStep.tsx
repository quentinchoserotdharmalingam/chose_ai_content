"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AnalysisResult } from "@/types";

interface AnalysisStepProps {
  resourceId: string;
  onAnalyzed: (analysis: AnalysisResult) => void;
}

export function AnalysisStep({ resourceId, onAnalyzed }: AnalysisStepProps) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function analyze() {
      try {
        const res = await fetch(`/api/resources/${resourceId}/analyze`, { method: "POST" });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Erreur analyse");

        setAnalysis(data.analysis);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de l'analyse");
      } finally {
        setLoading(false);
      }
    }

    analyze();
  }, [resourceId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Loader2 className="h-10 w-10 animate-spin text-coral" />
        <p className="text-sm text-gray-500">Analyse du document en cours...</p>
        <p className="text-xs text-gray-400">Extraction du texte + analyse IA</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold">Analyse du document</h2>
      <p className="mb-6 text-sm text-gray-500">
        Voici ce que l&apos;IA a identifié dans votre document
      </p>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-coral" />
              Résumé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{analysis.summary}</p>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sujets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysis.topics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full bg-coral-light px-3 py-1 text-xs font-medium text-coral"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Complexité</CardTitle>
            </CardHeader>
            <CardContent>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  analysis.complexity === "beginner"
                    ? "bg-green-50 text-green-700"
                    : analysis.complexity === "intermediate"
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {analysis.complexity === "beginner"
                  ? "Débutant"
                  : analysis.complexity === "intermediate"
                  ? "Intermédiaire"
                  : "Avancé"}
              </span>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thèmes clés</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {analysis.keyThemes.map((theme) => (
                <li key={theme} className="text-sm text-gray-700">
                  • {theme}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => onAnalyzed(analysis)}>Continuer</Button>
      </div>
    </div>
  );
}
