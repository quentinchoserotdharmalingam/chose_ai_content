"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ASSIGNEE_ROLES, type EmailSettings } from "@/types";
import { Loader2 } from "lucide-react";

interface EmailConfigPanelProps {
  settings: EmailSettings;
  onChange: (settings: EmailSettings) => void;
  resourceId?: string;
}

export function EmailConfigPanel({ settings, onChange, resourceId }: EmailConfigPanelProps) {
  const [generating, setGenerating] = useState(false);

  const handleGenerateAI = async () => {
    if (!resourceId) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/resources/${resourceId}/generate-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientRole: settings.recipientRole || "manager",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onChange({
          ...settings,
          subject: data.subject || settings.subject,
          body: data.body || settings.body,
          aiGenerated: true,
        });
      }
    } catch {
      // Silently handle for POC
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>📧</span> Configuration de l&apos;email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Recipient */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Destinataire
          </label>
          <div className="space-y-2">
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                settings.recipientType === "role"
                  ? "border-coral/40 bg-coral-light"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="email-recipient"
                checked={settings.recipientType === "role"}
                onChange={() => onChange({ ...settings, recipientType: "role", recipientRole: settings.recipientRole || "manager", recipientUser: undefined })}
              />
              <div className="flex-1">
                <span className="text-sm font-medium">Par role</span>
                <p className="text-xs text-gray-500">Envoie a la personne associee a ce role pour l&apos;enrollee</p>
              </div>
            </label>

            {settings.recipientType === "role" && (
              <div className="ml-8 flex gap-2">
                {ASSIGNEE_ROLES.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => onChange({ ...settings, recipientRole: role.value })}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      settings.recipientRole === role.value
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
                settings.recipientType === "user"
                  ? "border-coral/40 bg-coral-light"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="email-recipient"
                checked={settings.recipientType === "user"}
                onChange={() => onChange({ ...settings, recipientType: "user", recipientRole: undefined })}
              />
              <div className="flex-1">
                <span className="text-sm font-medium">Utilisateur precis</span>
                <p className="text-xs text-gray-500">Envoie a un utilisateur specifique</p>
              </div>
            </label>

            {settings.recipientType === "user" && (
              <div className="ml-8">
                <Input
                  placeholder="Email du destinataire"
                  value={settings.recipientUser || ""}
                  onChange={(e) => onChange({ ...settings, recipientUser: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>

        {/* AI Generate button */}
        <div className="rounded-lg border border-dashed border-coral/40 bg-coral-light/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-coral-dark">Generation par IA</p>
              <p className="text-xs text-coral">
                Genere automatiquement un email base sur le contenu de la formation
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleGenerateAI}
              disabled={generating}
              className="bg-coral hover:bg-coral-dark"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Generation...
                </>
              ) : (
                "Generer avec l'IA"
              )}
            </Button>
          </div>
          {settings.aiGenerated && (
            <p className="mt-2 text-xs text-green-600">
              Contenu genere par IA — vous pouvez le modifier ci-dessous
            </p>
          )}
        </div>

        {/* Subject */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Objet de l&apos;email
          </label>
          <Input
            placeholder="Ex: Formation completee par {prenom} {nom}"
            value={settings.subject}
            onChange={(e) => onChange({ ...settings, subject: e.target.value })}
          />
          <p className="mt-1 text-xs text-gray-400">
            Variables disponibles : {"{prenom}"}, {"{nom}"}, {"{formation}"}, {"{date}"}
          </p>
        </div>

        {/* Body */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Corps de l&apos;email
          </label>
          <Textarea
            rows={6}
            placeholder="Bonjour,&#10;&#10;{prenom} {nom} a termine la formation &laquo; {formation} &raquo;..."
            value={settings.body}
            onChange={(e) => onChange({ ...settings, body: e.target.value })}
          />
          <p className="mt-1 text-xs text-gray-400">
            Variables : {"{prenom}"}, {"{nom}"}, {"{formation}"}, {"{date}"}, {"{score}"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
