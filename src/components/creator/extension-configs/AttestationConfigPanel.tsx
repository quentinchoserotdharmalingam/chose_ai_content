"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AttestationSettings } from "@/types";

interface AttestationConfigPanelProps {
  settings: AttestationSettings;
  onChange: (settings: AttestationSettings) => void;
}

const TEMPLATE_TYPES: { value: AttestationSettings["templateType"]; label: string; description: string }[] = [
  { value: "completion", label: "Attestation de completion", description: "Delivree des que la formation est terminee" },
  { value: "success", label: "Attestation de reussite", description: "Delivree uniquement si le score minimal est atteint" },
  { value: "custom", label: "Modele personnalise", description: "Personnalisez le titre et les informations affichees" },
];

export function AttestationConfigPanel({ settings, onChange }: AttestationConfigPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>📄</span> Configuration de l&apos;attestation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Template type */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Type d&apos;attestation
          </label>
          <div className="space-y-2">
            {TEMPLATE_TYPES.map((type) => (
              <label
                key={type.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  settings.templateType === type.value
                    ? "border-coral/40 bg-coral-light"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="attestation-template"
                  checked={settings.templateType === type.value}
                  onChange={() => onChange({ ...settings, templateType: type.value })}
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

        {/* Custom title */}
        {settings.templateType === "custom" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Titre personnalise
            </label>
            <Input
              placeholder="Ex: Certificat de formation - {formation}"
              value={settings.customTitle || ""}
              onChange={(e) => onChange({ ...settings, customTitle: e.target.value })}
            />
          </div>
        )}

        {/* Options */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Informations incluses
          </label>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
              <input
                type="checkbox"
                checked={settings.includeDate}
                onChange={(e) => onChange({ ...settings, includeDate: e.target.checked })}
              />
              <div>
                <span className="text-sm font-medium">Date de completion</span>
                <p className="text-xs text-gray-500">Affiche la date a laquelle la formation a ete terminee</p>
              </div>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
              <input
                type="checkbox"
                checked={settings.includeScore}
                onChange={(e) => onChange({ ...settings, includeScore: e.target.checked })}
              />
              <div>
                <span className="text-sm font-medium">Score obtenu</span>
                <p className="text-xs text-gray-500">Affiche le score du questionnaire si applicable</p>
              </div>
            </label>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Apercu</p>
          <div className="mt-3 inline-block rounded-lg border-2 border-dashed border-gray-300 px-8 py-6">
            <p className="text-lg font-semibold text-gray-700">
              {settings.templateType === "custom" && settings.customTitle
                ? settings.customTitle
                : settings.templateType === "success"
                ? "Attestation de reussite"
                : "Attestation de completion"}
            </p>
            <p className="mt-1 text-sm text-gray-500">{"{prenom} {nom}"}</p>
            {settings.includeDate && (
              <p className="mt-1 text-xs text-gray-400">Complete le {"{date}"}</p>
            )}
            {settings.includeScore && (
              <p className="mt-1 text-xs text-gray-400">Score : {"{score}"}%</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
