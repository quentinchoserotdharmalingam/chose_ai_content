"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FORMAT_META, type AnalysisResult, type FormatSlug } from "@/types";

interface ObjectiveStepProps {
  analysis: AnalysisResult;
  objective: string;
  onObjectiveChange: (value: string) => void;
  selectedFormats: FormatSlug[];
  onFormatsChange: (formats: FormatSlug[]) => void;
  tone: string;
  onToneChange: (value: string) => void;
  language: string;
  onLanguageChange: (value: string) => void;
  onNext: () => void;
}

const ALL_FORMATS: FormatSlug[] = ["synthese", "flashcards", "chat", "module", "scenarios"];

const TONES = [
  { value: "professional", label: "Professionnel", description: "Formel et structuré" },
  { value: "casual", label: "Décontracté", description: "Accessible et convivial" },
  { value: "pedagogical", label: "Pédagogique", description: "Didactique et encourageant" },
  { value: "concise", label: "Concis", description: "Droit au but, factuel" },
];

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" },
];

export function ObjectiveStep({
  analysis,
  objective,
  onObjectiveChange,
  selectedFormats,
  onFormatsChange,
  tone,
  onToneChange,
  language,
  onLanguageChange,
  onNext,
}: ObjectiveStepProps) {
  const toggleFormat = (format: FormatSlug) => {
    if (selectedFormats.includes(format)) {
      if (selectedFormats.length > 1) {
        onFormatsChange(selectedFormats.filter((f) => f !== format));
      }
    } else {
      onFormatsChange([...selectedFormats, format]);
    }
  };

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold">Objectif pédagogique</h2>
      <p className="mb-6 text-sm text-gray-500">
        Définissez ce que l&apos;apprenant doit retenir de cette ressource
      </p>

      {/* Suggested objectives */}
      <div className="mb-4">
        <p className="mb-2 text-sm font-medium text-gray-700">Suggestions IA :</p>
        <div className="space-y-2">
          {analysis.suggestedObjectives.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onObjectiveChange(suggestion)}
              className={`block w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                objective === suggestion
                  ? "border-blue-500 bg-coral-light text-coral"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Ou écrivez votre propre objectif :
        </label>
        <Textarea
          value={objective}
          onChange={(e) => onObjectiveChange(e.target.value)}
          placeholder="À l'issue de cette ressource, l'apprenant sera capable de..."
          rows={3}
        />
      </div>

      {/* Tone & Language */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ton</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {TONES.map((t) => (
              <button
                key={t.value}
                onClick={() => onToneChange(t.value)}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  tone === t.value
                    ? "border-blue-500 bg-coral-light text-coral"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div>
                  <p className="font-medium">{t.label}</p>
                  <p className="text-xs text-gray-500">{t.description}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Langue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.value}
                onClick={() => onLanguageChange(l.value)}
                className={`flex w-full items-center rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors ${
                  language === l.value
                    ? "border-blue-500 bg-coral-light text-coral"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {l.label}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Format selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Formats de consommation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {ALL_FORMATS.map((format) => {
              const meta = FORMAT_META[format];
              const selected = selectedFormats.includes(format);
              return (
                <button
                  key={format}
                  onClick={() => toggleFormat(format)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    selected
                      ? "border-blue-500 bg-coral-light"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl">{meta.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{meta.label}</p>
                    <p className="text-xs text-gray-500">{meta.duration}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!objective.trim()}>
          Générer le contenu
        </Button>
      </div>
    </div>
  );
}
