"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { RappelSettings } from "@/types";

interface RappelConfigPanelProps {
  settings: RappelSettings;
  onChange: (settings: RappelSettings) => void;
}

const CONTENT_TYPES: { value: RappelSettings["contentType"]; label: string; description: string }[] = [
  { value: "synthese", label: "Synthese complete", description: "Affiche la synthese generee comme ressource formation" },
  { value: "points-cles", label: "Points cles uniquement", description: "Affiche une section resumee avec les points cles a retenir" },
  { value: "custom", label: "Contenu personnalise", description: "Redigez le contenu du rappel vous-meme" },
];

export function RappelConfigPanel({ settings, onChange }: RappelConfigPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>⏰</span> Configuration des rappels espaces
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Contenu des rappels
          </label>
          <p className="mb-3 text-xs text-gray-500">
            Chaque rappel (J+1, J+7, J+30) creera une tache formation dans HeyTeam avec le contenu choisi.
          </p>
          <div className="space-y-2">
            {CONTENT_TYPES.map((type) => (
              <label
                key={type.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  settings.contentType === type.value
                    ? "border-blue-300 bg-blue-50/50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="rappel-content-type"
                  checked={settings.contentType === type.value}
                  onChange={() => onChange({ ...settings, contentType: type.value })}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium">{type.label}</span>
                  <p className="text-xs text-gray-500">{type.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {settings.contentType === "custom" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Contenu personnalise
            </label>
            <Textarea
              rows={4}
              placeholder="Redigez ici le contenu qui sera affiche dans chaque rappel..."
              value={settings.customContent || ""}
              onChange={(e) => onChange({ ...settings, customContent: e.target.value })}
            />
          </div>
        )}

        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-600">Apercu des actions generees :</p>
          <div className="mt-2 space-y-1">
            {["J+1", "J+7", "J+30"].map((day) => (
              <div key={day} className="flex items-center gap-2 text-xs text-gray-500">
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">{day}</span>
                <span>Ressource formation — {
                  settings.contentType === "synthese" ? "Synthese" :
                  settings.contentType === "points-cles" ? "Points cles" :
                  "Contenu personnalise"
                }</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
