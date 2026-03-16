"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, RotateCcw } from "lucide-react";
import type { RappelSettings, RappelContent } from "@/types";

interface RappelConfigPanelProps {
  settings: RappelSettings;
  onChange: (settings: RappelSettings) => void;
  resourceId?: string;
}

const REMINDER_DAYS = [1, 7, 30] as const;

const REMINDER_META: Record<number, { label: string; badge: string; description: string; color: string }> = {
  1: {
    label: "Rappel J+1",
    badge: "J+1",
    description: "Rappel à chaud — les points essentiels à retenir",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  7: {
    label: "Rappel J+7",
    badge: "J+7",
    description: "Consolidation — reformulation et rappel actif",
    color: "bg-coral-light text-coral border-coral/30",
  },
  30: {
    label: "Rappel J+30",
    badge: "J+30",
    description: "Ancrage — synthèse durable et mise en pratique",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
};

export function RappelConfigPanel({ settings, onChange, resourceId }: RappelConfigPanelProps) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState<1 | 7 | 30>(1);

  const handleGenerateAI = async () => {
    if (!resourceId) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/resources/${resourceId}/generate-rappels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Erreur lors de la génération");
      const data = await res.json();
      onChange({
        ...settings,
        reminders: {
          1: data["1"] || settings.reminders[1],
          7: data["7"] || settings.reminders[7],
          30: data["30"] || settings.reminders[30],
        },
        aiGenerated: true,
      });
    } catch {
      setError("Erreur lors de la génération des rappels. Réessayez.");
    } finally {
      setGenerating(false);
    }
  };

  const updateReminder = (day: 1 | 7 | 30, field: keyof RappelContent, value: string) => {
    onChange({
      ...settings,
      reminders: {
        ...settings.reminders,
        [day]: { ...settings.reminders[day], [field]: value },
      },
    });
  };

  const hasContent = REMINDER_DAYS.some(
    (d) => settings.reminders[d].title || settings.reminders[d].body
  );

  const activeMeta = REMINDER_META[activeDay];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>⏰</span> Configuration des rappels espacés
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* AI Generate button */}
        <div className="rounded-lg border border-dashed border-coral/40 bg-coral-light/50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-coral-dark">Génération par IA</p>
              <p className="text-xs text-coral">
                Génère automatiquement le contenu des 3 rappels à partir de la formation
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleGenerateAI}
              disabled={generating}
              className="flex-shrink-0 bg-coral hover:bg-coral-dark"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : hasContent ? (
                <>
                  <RotateCcw className="mr-1.5 h-4 w-4" />
                  Regénérer
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Générer avec l&apos;IA
                </>
              )}
            </Button>
          </div>
          {settings.aiGenerated && (
            <p className="mt-2 text-xs text-green-600">
              Contenu généré par IA — vous pouvez le modifier ci-dessous
            </p>
          )}
          {error && (
            <p className="mt-2 text-xs text-red-600">{error}</p>
          )}
        </div>

        {/* Reminder tabs */}
        <div className="flex gap-2">
          {REMINDER_DAYS.map((day) => {
            const meta = REMINDER_META[day];
            const reminder = settings.reminders[day];
            const filled = !!(reminder.title && reminder.body);
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  activeDay === day
                    ? "border-coral/40 bg-coral-light text-coral"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  filled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                }`}>
                  {filled ? "✓" : "·"}
                </span>
                {meta.badge}
              </button>
            );
          })}
        </div>

        {/* Active reminder editor */}
        <div className={`rounded-lg border p-4 ${activeMeta.color}`}>
          <div className="mb-3">
            <span className="text-sm font-semibold">{activeMeta.label}</span>
            <p className="text-xs opacity-80">{activeMeta.description}</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Titre du rappel
              </label>
              <Input
                placeholder="Ex: Les 5 points essentiels à retenir"
                value={settings.reminders[activeDay].title}
                onChange={(e) => updateReminder(activeDay, "title", e.target.value)}
                className="bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Contenu du rappel
              </label>
              <Textarea
                rows={5}
                placeholder="Le contenu qui sera affiché dans le rappel pour l'apprenant..."
                value={settings.reminders[activeDay].body}
                onChange={(e) => updateReminder(activeDay, "body", e.target.value)}
                className="bg-white"
              />
              <p className="mt-1 text-xs text-gray-400">
                Utilisez des tirets (-) pour les listes et des retours à la ligne pour séparer les paragraphes
              </p>
            </div>
          </div>
        </div>

        {/* Preview of all 3 reminders */}
        {hasContent && (
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="mb-2 text-xs font-medium text-gray-600">Aperçu des 3 rappels :</p>
            <div className="space-y-2">
              {REMINDER_DAYS.map((day) => {
                const meta = REMINDER_META[day];
                const reminder = settings.reminders[day];
                return (
                  <div
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`cursor-pointer rounded-lg border bg-white p-3 transition-colors hover:border-coral/30 ${
                      activeDay === day ? "border-coral/40 ring-1 ring-coral/30" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>
                        {meta.badge}
                      </span>
                      <span className="text-sm font-medium text-gray-800">
                        {reminder.title || <span className="italic text-gray-400">Titre non défini</span>}
                      </span>
                    </div>
                    {reminder.body && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                        {reminder.body}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
