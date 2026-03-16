"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  EXTENSION_META,
  type ExtensionSlug,
  type ExtensionConfig,
  type GeneratedAction,
} from "@/types";
import { ActionsPreview } from "@/components/creator/ActionsPreview";

const ALL_EXTENSIONS: ExtensionSlug[] = [
  "rappels",
  "connexion",
  "questionnaire",
  "email",
  "defi",
  "attestation",
];

interface ExtensionsStepProps {
  extensions: Record<ExtensionSlug, ExtensionConfig>;
  onExtensionsChange: (ext: Record<ExtensionSlug, ExtensionConfig>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ExtensionsStep({
  extensions,
  onExtensionsChange,
  onNext,
  onBack,
}: ExtensionsStepProps) {
  const [showPreview, setShowPreview] = useState(false);

  const toggle = (slug: ExtensionSlug) => {
    const current = extensions[slug];
    const meta = EXTENSION_META[slug];
    onExtensionsChange({
      ...extensions,
      [slug]: {
        ...current,
        enabled: !current.enabled,
        delayDays: !current.enabled ? meta.defaultDelayDays : current.delayDays,
      },
    });
  };

  const setDelay = (slug: ExtensionSlug, days: number) => {
    onExtensionsChange({
      ...extensions,
      [slug]: { ...extensions[slug], delayDays: days },
    });
  };

  const enabledCount = ALL_EXTENSIONS.filter((s) => extensions[s].enabled).length;

  // Build the list of actions that would be generated
  const generatedActions: GeneratedAction[] = [];
  for (const slug of ALL_EXTENSIONS) {
    const config = extensions[slug];
    if (!config.enabled) continue;
    const meta = EXTENSION_META[slug];

    if (meta.multiAction) {
      meta.multiAction.delaysDays.forEach((d, i) => {
        generatedActions.push({
          extensionSlug: slug,
          label: meta.multiAction!.labels[i],
          heyteamObject: meta.heyteamObject,
          triggerLabel: `J+${d} après complétion`,
          delayDays: d,
        });
      });
    } else {
      const delay = config.delayDays ?? meta.defaultDelayDays;
      generatedActions.push({
        extensionSlug: slug,
        label: meta.label,
        heyteamObject: meta.heyteamObject,
        triggerLabel:
          delay === 0 || delay === null
            ? "Dès complétion"
            : `J+${delay} après complétion`,
        delayDays: delay ?? 0,
      });
    }
  }

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold">Extensions</h2>
      <p className="mb-6 text-sm text-gray-500">
        Activez les actions automatiques qui seront déclenchées dans HeyTeam
        après complétion par l&apos;enrollee. Toutes sont désactivées par
        défaut.
      </p>

      {/* Extension cards */}
      <div className="mb-6 space-y-3">
        {ALL_EXTENSIONS.map((slug) => {
          const meta = EXTENSION_META[slug];
          const config = extensions[slug];

          return (
            <Card
              key={slug}
              className={`transition-colors ${
                config.enabled
                  ? "border-blue-300 bg-blue-50/50"
                  : "border-gray-200"
              }`}
            >
              <CardContent className="flex items-start gap-4 py-4">
                {/* Toggle */}
                <button
                  onClick={() => toggle(slug)}
                  className={`mt-1 flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
                    config.enabled ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      config.enabled ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.icon}</span>
                    <span className="font-medium">{meta.label}</span>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      {meta.heyteamObject}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {meta.description}
                  </p>

                  {/* Delay config */}
                  {config.enabled && meta.delayConfigurable && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-gray-500">Délai :</span>
                      <span className="text-xs text-gray-500">J+</span>
                      <Input
                        type="number"
                        min={0}
                        className="h-7 w-16 text-xs"
                        value={config.delayDays ?? meta.defaultDelayDays ?? 0}
                        onChange={(e) =>
                          setDelay(slug, parseInt(e.target.value) || 0)
                        }
                      />
                      <span className="text-xs text-gray-500">
                        après complétion
                      </span>
                    </div>
                  )}

                  {/* Fixed delays info for rappels */}
                  {config.enabled && meta.multiAction && (
                    <div className="mt-2 flex gap-2">
                      {meta.multiAction.delaysDays.map((d, i) => (
                        <span
                          key={d}
                          className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                        >
                          {meta.multiAction!.labels[i]}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Fixed trigger info */}
                  {config.enabled &&
                    !meta.delayConfigurable &&
                    !meta.multiAction && (
                      <p className="mt-2 text-xs text-gray-400">
                        Déclenché dès complétion
                      </p>
                    )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Preview toggle */}
      {enabledCount > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            {showPreview ? "Masquer" : "Voir"} la timeline des{" "}
            {generatedActions.length} action(s) qui seront créées
          </button>

          {showPreview && (
            <div className="mt-4">
              <ActionsPreview actions={generatedActions} />
            </div>
          )}
        </div>
      )}

      {enabledCount === 0 && (
        <p className="mb-6 text-sm text-gray-400">
          Aucune extension activée — vous pourrez en ajouter plus tard.
        </p>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={onBack}>
          Retour
        </Button>
        <Button size="lg" onClick={onNext}>
          {enabledCount > 0
            ? `Continuer avec ${enabledCount} extension(s)`
            : "Continuer sans extension"}
        </Button>
      </div>
    </div>
  );
}

/** Create default config with all extensions disabled */
export function createDefaultExtensions(): Record<
  ExtensionSlug,
  ExtensionConfig
> {
  const config = {} as Record<ExtensionSlug, ExtensionConfig>;
  for (const slug of ALL_EXTENSIONS) {
    config[slug] = {
      enabled: false,
      delayDays: EXTENSION_META[slug].defaultDelayDays,
    };
  }
  return config;
}
