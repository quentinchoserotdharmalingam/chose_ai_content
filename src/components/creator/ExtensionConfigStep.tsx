"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  EXTENSION_META,
  DEFAULT_EXTENSION_SETTINGS,
  type ExtensionSlug,
  type ExtensionConfig,
  type ExtensionSettingsMap,
} from "@/types";
import { RappelConfigPanel } from "@/components/creator/extension-configs/RappelConfigPanel";
import { ConnexionConfigPanel } from "@/components/creator/extension-configs/ConnexionConfigPanel";
import { EmailConfigPanel } from "@/components/creator/extension-configs/EmailConfigPanel";
import { QuestionnaireConfigPanel } from "@/components/creator/extension-configs/QuestionnaireConfigPanel";
import { DefiConfigPanel } from "@/components/creator/extension-configs/DefiConfigPanel";
import { AttestationConfigPanel } from "@/components/creator/extension-configs/AttestationConfigPanel";

interface ExtensionConfigStepProps {
  extensions: Record<ExtensionSlug, ExtensionConfig>;
  onExtensionsChange: (ext: Record<ExtensionSlug, ExtensionConfig>) => void;
  resourceId?: string;
  onNext: () => void;
  onBack: () => void;
}

const ALL_EXTENSIONS: ExtensionSlug[] = [
  "rappels",
  "connexion",
  "questionnaire",
  "email",
  "defi",
  "attestation",
];

export function ExtensionConfigStep({
  extensions,
  onExtensionsChange,
  resourceId,
  onNext,
  onBack,
}: ExtensionConfigStepProps) {
  const enabledExtensions = ALL_EXTENSIONS.filter((s) => extensions[s].enabled);
  const [activeTab, setActiveTab] = useState<ExtensionSlug>(enabledExtensions[0]);

  const updateSettings = <K extends ExtensionSlug>(slug: K, settings: ExtensionSettingsMap[K]) => {
    onExtensionsChange({
      ...extensions,
      [slug]: {
        ...extensions[slug],
        settings: settings as Record<string, unknown>,
      },
    });
  };

  const getSettings = <K extends ExtensionSlug>(slug: K): ExtensionSettingsMap[K] => {
    return (extensions[slug].settings || DEFAULT_EXTENSION_SETTINGS[slug]) as ExtensionSettingsMap[K];
  };

  const renderConfigPanel = (slug: ExtensionSlug) => {
    switch (slug) {
      case "rappels":
        return (
          <RappelConfigPanel
            settings={getSettings("rappels")}
            onChange={(s) => updateSettings("rappels", s)}
          />
        );
      case "connexion":
        return (
          <ConnexionConfigPanel
            settings={getSettings("connexion")}
            onChange={(s) => updateSettings("connexion", s)}
          />
        );
      case "email":
        return (
          <EmailConfigPanel
            settings={getSettings("email")}
            onChange={(s) => updateSettings("email", s)}
            resourceId={resourceId}
          />
        );
      case "questionnaire":
        return (
          <QuestionnaireConfigPanel
            settings={getSettings("questionnaire")}
            onChange={(s) => updateSettings("questionnaire", s)}
          />
        );
      case "defi":
        return (
          <DefiConfigPanel
            settings={getSettings("defi")}
            onChange={(s) => updateSettings("defi", s)}
          />
        );
      case "attestation":
        return (
          <AttestationConfigPanel
            settings={getSettings("attestation")}
            onChange={(s) => updateSettings("attestation", s)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold">Configuration des extensions</h2>
      <p className="mb-6 text-sm text-gray-500">
        Parametrez chaque extension activee. Vous pouvez personnaliser les
        destinataires, le contenu et les options specifiques.
      </p>

      {/* Tabs for enabled extensions */}
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {enabledExtensions.map((slug) => {
          const meta = EXTENSION_META[slug];
          return (
            <button
              key={slug}
              onClick={() => setActiveTab(slug)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === slug
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span>{meta.icon}</span>
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Active config panel */}
      <div className="mb-8">
        {activeTab && renderConfigPanel(activeTab)}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={onBack}>
          Retour
        </Button>
        <Button size="lg" onClick={onNext}>
          Continuer vers la publication
        </Button>
      </div>
    </div>
  );
}
