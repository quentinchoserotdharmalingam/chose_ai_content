"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ASSIGNEE_ROLES, type DefiSettings } from "@/types";

interface DefiConfigPanelProps {
  settings: DefiSettings;
  onChange: (settings: DefiSettings) => void;
}

export function DefiConfigPanel({ settings, onChange }: DefiConfigPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>🏆</span> Configuration du defi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Title */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Titre du defi
          </label>
          <Input
            placeholder="Ex: Appliquer les concepts en situation reelle"
            value={settings.title}
            onChange={(e) => onChange({ ...settings, title: e.target.value })}
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Description / Instructions
          </label>
          <Textarea
            rows={4}
            placeholder="Decrivez le defi que l'enrollee devra relever..."
            value={settings.description}
            onChange={(e) => onChange({ ...settings, description: e.target.value })}
          />
        </div>

        {/* Duration */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Duree du defi
          </label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={90}
              className="w-20"
              value={settings.durationDays}
              onChange={(e) => onChange({ ...settings, durationDays: parseInt(e.target.value) || 7 })}
            />
            <span className="text-sm text-gray-500">jours</span>
          </div>
        </div>

        {/* Validator */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Validation du defi
          </label>
          <div className="space-y-2">
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                settings.validatorType === "auto"
                  ? "border-coral/40 bg-coral-light"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="defi-validator"
                checked={settings.validatorType === "auto"}
                onChange={() => onChange({ ...settings, validatorType: "auto", validatorRole: undefined, validatorUser: undefined })}
              />
              <div>
                <span className="text-sm font-medium">Auto-validation</span>
                <p className="text-xs text-gray-500">L&apos;enrollee valide lui-meme le defi</p>
              </div>
            </label>

            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                settings.validatorType === "role"
                  ? "border-coral/40 bg-coral-light"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="defi-validator"
                checked={settings.validatorType === "role"}
                onChange={() => onChange({ ...settings, validatorType: "role", validatorRole: "manager", validatorUser: undefined })}
              />
              <div className="flex-1">
                <span className="text-sm font-medium">Validation par un role</span>
                <p className="text-xs text-gray-500">Le defi est valide par la personne associee a ce role</p>
              </div>
            </label>

            {settings.validatorType === "role" && (
              <div className="ml-8 flex gap-2">
                {ASSIGNEE_ROLES.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => onChange({ ...settings, validatorRole: role.value })}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      settings.validatorRole === role.value
                        ? "border-coral/40 bg-coral-light font-medium text-coral"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            )}

            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                settings.validatorType === "user"
                  ? "border-coral/40 bg-coral-light"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="defi-validator"
                checked={settings.validatorType === "user"}
                onChange={() => onChange({ ...settings, validatorType: "user", validatorRole: undefined })}
              />
              <div className="flex-1">
                <span className="text-sm font-medium">Utilisateur precis</span>
                <p className="text-xs text-gray-500">Un utilisateur specifique valide le defi</p>
              </div>
            </label>

            {settings.validatorType === "user" && (
              <div className="ml-8">
                <Input
                  placeholder="Email ou nom du validateur"
                  value={settings.validatorUser || ""}
                  onChange={(e) => onChange({ ...settings, validatorUser: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
