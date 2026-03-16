"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { QuestionnaireSettings } from "@/types";

interface QuestionnaireConfigPanelProps {
  settings: QuestionnaireSettings;
  onChange: (settings: QuestionnaireSettings) => void;
}

const DIFFICULTIES: { value: QuestionnaireSettings["difficulty"]; label: string; description: string }[] = [
  { value: "easy", label: "Facile", description: "Questions de comprehension basique" },
  { value: "mixed", label: "Mixte", description: "Melange de questions faciles et avancees" },
  { value: "hard", label: "Avance", description: "Questions d'analyse et d'application" },
];

export function QuestionnaireConfigPanel({ settings, onChange }: QuestionnaireConfigPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>📝</span> Configuration du questionnaire
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Question count */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nombre de questions
          </label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={20}
              className="w-20"
              value={settings.questionCount}
              onChange={(e) => onChange({ ...settings, questionCount: parseInt(e.target.value) || 5 })}
            />
            <span className="text-sm text-gray-500">questions</span>
          </div>
        </div>

        {/* Pass threshold */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Seuil de reussite
          </label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              max={100}
              step={10}
              className="w-20"
              value={settings.passThreshold}
              onChange={(e) => onChange({ ...settings, passThreshold: parseInt(e.target.value) || 80 })}
            />
            <span className="text-sm text-gray-500">% de bonnes reponses requis</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-green-500 transition-all"
              style={{ width: `${settings.passThreshold}%` }}
            />
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Niveau de difficulte
          </label>
          <div className="space-y-2">
            {DIFFICULTIES.map((d) => (
              <label
                key={d.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  settings.difficulty === d.value
                    ? "border-coral/40 bg-coral-light"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="questionnaire-difficulty"
                  checked={settings.difficulty === d.value}
                  onChange={() => onChange({ ...settings, difficulty: d.value })}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium">{d.label}</span>
                  <p className="text-xs text-gray-500">{d.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
