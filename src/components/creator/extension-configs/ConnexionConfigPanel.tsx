"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ASSIGNEE_ROLES, type ConnexionSettings, type AssigneeRole } from "@/types";

interface ConnexionConfigPanelProps {
  settings: ConnexionSettings;
  onChange: (settings: ConnexionSettings) => void;
}

const EVENT_TYPES: { value: ConnexionSettings["eventType"]; label: string; icon: string }[] = [
  { value: "reunion", label: "Reunion", icon: "📅" },
  { value: "cafe_virtuel", label: "Cafe virtuel", icon: "☕" },
  { value: "atelier", label: "Atelier pratique", icon: "🛠️" },
  { value: "shadowing", label: "Shadowing / Observation", icon: "👀" },
];

const DURATION_OPTIONS = [15, 30, 45, 60, 90];

export function ConnexionConfigPanel({ settings, onChange }: ConnexionConfigPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>🤝</span> Configuration de l&apos;evenement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Event type */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Type d&apos;evenement
          </label>
          <div className="grid grid-cols-2 gap-2">
            {EVENT_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => onChange({ ...settings, eventType: type.value })}
                className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors ${
                  settings.eventType === type.value
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <span>{type.icon}</span>
                <span className="font-medium">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Titre de l&apos;evenement (optionnel)
          </label>
          <Input
            placeholder="Ex: Point de suivi formation"
            value={settings.title || ""}
            onChange={(e) => onChange({ ...settings, title: e.target.value })}
          />
        </div>

        {/* Duration */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Duree
          </label>
          <div className="flex gap-2">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => onChange({ ...settings, durationMinutes: d })}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  settings.durationMinutes === d
                    ? "border-blue-300 bg-blue-50 font-medium text-blue-700"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        {/* Assignee */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Participant associe
          </label>
          <div className="space-y-2">
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                settings.assigneeType === "none"
                  ? "border-blue-300 bg-blue-50/50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="connexion-assignee"
                checked={settings.assigneeType === "none"}
                onChange={() => onChange({ ...settings, assigneeType: "none", assigneeRole: undefined, assigneeUser: undefined })}
              />
              <div>
                <span className="text-sm font-medium">Aucun</span>
                <p className="text-xs text-gray-500">L&apos;enrollee organise l&apos;evenement seul</p>
              </div>
            </label>

            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                settings.assigneeType === "role"
                  ? "border-blue-300 bg-blue-50/50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="connexion-assignee"
                checked={settings.assigneeType === "role"}
                onChange={() => onChange({ ...settings, assigneeType: "role", assigneeRole: "manager", assigneeUser: undefined })}
              />
              <div className="flex-1">
                <span className="text-sm font-medium">Par role</span>
                <p className="text-xs text-gray-500">Invite automatiquement la personne associee a ce role</p>
              </div>
            </label>

            {settings.assigneeType === "role" && (
              <div className="ml-8 flex gap-2">
                {ASSIGNEE_ROLES.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => onChange({ ...settings, assigneeRole: role.value })}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      settings.assigneeRole === role.value
                        ? "border-blue-300 bg-blue-100 font-medium text-blue-700"
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
                settings.assigneeType === "user"
                  ? "border-blue-300 bg-blue-50/50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="connexion-assignee"
                checked={settings.assigneeType === "user"}
                onChange={() => onChange({ ...settings, assigneeType: "user", assigneeRole: undefined })}
              />
              <div className="flex-1">
                <span className="text-sm font-medium">Utilisateur precis</span>
                <p className="text-xs text-gray-500">Invite un utilisateur specifique</p>
              </div>
            </label>

            {settings.assigneeType === "user" && (
              <div className="ml-8">
                <Input
                  placeholder="Email ou nom de l'utilisateur"
                  value={settings.assigneeUser || ""}
                  onChange={(e) => onChange({ ...settings, assigneeUser: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Description (optionnel)
          </label>
          <Textarea
            rows={3}
            placeholder="Decrivez le but de cet evenement..."
            value={settings.description || ""}
            onChange={(e) => onChange({ ...settings, description: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
