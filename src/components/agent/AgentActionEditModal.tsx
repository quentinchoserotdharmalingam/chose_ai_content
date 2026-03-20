"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Save, X, Plus, Trash2 } from "lucide-react";
import { type AgentAction, type AgentActionPreview } from "@/types";
import { inferActionType, ACTION_TYPE_META } from "@/lib/action-utils";

interface AgentActionEditModalProps {
  action: AgentAction;
  onClose: () => void;
  onSave: (updated: AgentAction) => void;
  saving?: boolean;
}

const ACTION_TYPES = [
  { value: "email", label: "Email" },
  { value: "meeting", label: "Réunion" },
  { value: "task", label: "Tâche" },
  { value: "notification", label: "Notification" },
] as const;

const VARIABLE_SUGGESTIONS = [
  { var: "{{collaborateur.prenom}}", label: "Prénom" },
  { var: "{{collaborateur.nom}}", label: "Nom" },
  { var: "{{collaborateur.poste}}", label: "Poste" },
  { var: "{{collaborateur.departement}}", label: "Département" },
  { var: "{{collaborateur.manager}}", label: "Manager" },
  { var: "{{collaborateur.date_arrivee}}", label: "Date d'arrivée" },
  { var: "{{entreprise.nom}}", label: "Entreprise" },
];

export function AgentActionEditModal({ action, onClose, onSave, saving }: AgentActionEditModalProps) {
  const [label, setLabel] = useState(action.label);
  const [type, setType] = useState<string>(action.type || inferActionType(action.label));
  const [detail, setDetail] = useState(action.detail || "");
  const [preview, setPreview] = useState<AgentActionPreview>(action.preview || {});

  const meta = ACTION_TYPE_META[type] || ACTION_TYPE_META.notification;
  const Icon = meta.icon;

  const handleSave = () => {
    if (!label.trim()) return;
    onSave({
      id: action.id,
      label: label.trim(),
      enabled: true,
      type: type as AgentAction["type"],
      detail: detail || undefined,
      preview: Object.keys(preview).length > 0 ? preview : undefined,
    });
  };

  const updatePreview = (field: keyof AgentActionPreview, value: string | string[]) => {
    setPreview((prev: AgentActionPreview) => ({ ...prev, [field]: value }));
  };

  const insertVariable = (field: "to" | "subject" | "body" | "note", variable: string) => {
    const current = (preview[field] as string) || "";
    updatePreview(field, current + variable);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const inputClass = "w-full rounded-lg border border-ht-border px-3 py-2.5 text-[13px] text-ht-text bg-white focus:outline-none focus:ring-2 focus:ring-ht-primary/20 focus:border-ht-primary transition-all";
  const labelClass = "text-[11px] font-semibold text-ht-text-secondary uppercase tracking-wide mb-1.5 block";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40 transition-opacity" />
      <div
        className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-ht-border shrink-0">
          <button onClick={onClose} className="flex items-center gap-1.5 text-[13px] text-ht-text-secondary hover:text-ht-text transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.bg} ${meta.color}`}>
            <Icon className="h-3 w-3" />
            {meta.label}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Label */}
          <div>
            <label className={labelClass}>Libellé de l&apos;action</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={inputClass}
              placeholder="Ex: Envoyer un email de rappel"
            />
          </div>

          {/* Type selector */}
          <div>
            <label className={labelClass}>Type d&apos;action</label>
            <div className="grid grid-cols-4 gap-1.5">
              {ACTION_TYPES.map((t) => {
                const tMeta = ACTION_TYPE_META[t.value];
                const TIcon = tMeta.icon;
                return (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-[11px] font-medium transition-all ${
                      type === t.value
                        ? `${tMeta.bg} ${tMeta.color} ring-2 ring-current/20`
                        : "bg-ht-fill-secondary text-ht-text-secondary hover:bg-ht-fill-secondary/80"
                    }`}
                  >
                    <TIcon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail */}
          <div>
            <label className={labelClass}>Description courte</label>
            <input
              type="text"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              className={inputClass}
              placeholder="Ex: Informer le manager du suivi nécessaire"
            />
          </div>

          {/* ── EMAIL FIELDS ── */}
          {type === "email" && (
            <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/30 p-4">
              <p className="text-[12px] font-semibold text-blue-700">Configuration email</p>
              <div>
                <label className={labelClass}>Destinataire</label>
                <input
                  type="text"
                  value={preview.to || ""}
                  onChange={(e) => updatePreview("to", e.target.value)}
                  className={inputClass}
                  placeholder="Ex: {{collaborateur.manager}} ou rh@entreprise.com"
                />
              </div>
              <div>
                <label className={labelClass}>Objet</label>
                <input
                  type="text"
                  value={preview.subject || ""}
                  onChange={(e) => updatePreview("subject", e.target.value)}
                  className={inputClass}
                  placeholder="Ex: Suivi onboarding de {{collaborateur.prenom}}"
                />
              </div>
              <div>
                <label className={labelClass}>Corps de l&apos;email</label>
                <textarea
                  value={preview.body || ""}
                  onChange={(e) => updatePreview("body", e.target.value)}
                  rows={6}
                  className={`${inputClass} resize-none`}
                  placeholder={"Bonjour {{collaborateur.manager}},\n\nJe vous écris au sujet de..."}
                />
                <div className="mt-2">
                  <p className="text-[10px] font-semibold text-ht-text-secondary uppercase tracking-wide mb-1">Variables disponibles</p>
                  <div className="flex flex-wrap gap-1">
                    {VARIABLE_SUGGESTIONS.map((v) => (
                      <button
                        key={v.var}
                        onClick={() => insertVariable("body", v.var)}
                        className="rounded-md bg-white border border-ht-border px-2 py-1 text-[10px] text-ht-text-secondary hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MEETING FIELDS ── */}
          {type === "meeting" && (
            <div className="space-y-3 rounded-xl border border-purple-200 bg-purple-50/30 p-4">
              <p className="text-[12px] font-semibold text-purple-700">Configuration réunion</p>
              <div>
                <label className={labelClass}>Sujet</label>
                <input
                  type="text"
                  value={preview.subject || ""}
                  onChange={(e) => updatePreview("subject", e.target.value)}
                  className={inputClass}
                  placeholder="Ex: Point d'intégration - {{collaborateur.prenom}}"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Date</label>
                  <input
                    type="text"
                    value={preview.date || ""}
                    onChange={(e) => updatePreview("date", e.target.value)}
                    className={inputClass}
                    placeholder="Ex: J+7 après arrivée"
                  />
                </div>
                <div>
                  <label className={labelClass}>Durée</label>
                  <input
                    type="text"
                    value={preview.duration || ""}
                    onChange={(e) => updatePreview("duration", e.target.value)}
                    className={inputClass}
                    placeholder="Ex: 30 min"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Participants</label>
                <div className="space-y-1.5">
                  {(preview.participants || []).map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={p}
                        onChange={(e) => {
                          const updated = [...(preview.participants || [])];
                          updated[i] = e.target.value;
                          updatePreview("participants", updated);
                        }}
                        className={`${inputClass} flex-1`}
                        placeholder="Nom du participant"
                      />
                      <button
                        onClick={() => {
                          const updated = (preview.participants || []).filter((_, j) => j !== i);
                          updatePreview("participants", updated);
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-all shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => updatePreview("participants", [...(preview.participants || []), ""])}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] text-purple-600 hover:bg-purple-50 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter un participant
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>Note</label>
                <textarea
                  value={preview.note || ""}
                  onChange={(e) => updatePreview("note", e.target.value)}
                  rows={3}
                  className={`${inputClass} resize-none`}
                  placeholder="Points à aborder lors de la réunion..."
                />
              </div>
            </div>
          )}

          {/* ── TASK / NOTIFICATION FIELDS ── */}
          {(type === "task" || type === "notification") && (
            <div className={`space-y-3 rounded-xl border p-4 ${
              type === "task" ? "border-green-200 bg-green-50/30" : "border-orange-200 bg-orange-50/30"
            }`}>
              <p className={`text-[12px] font-semibold ${type === "task" ? "text-green-700" : "text-orange-700"}`}>
                Configuration {type === "task" ? "tâche" : "notification"}
              </p>
              <div>
                <label className={labelClass}>Destinataire</label>
                <input
                  type="text"
                  value={preview.to || ""}
                  onChange={(e) => updatePreview("to", e.target.value)}
                  className={inputClass}
                  placeholder="Ex: {{collaborateur.manager}} ou rh@entreprise.com"
                />
              </div>
              <div>
                <label className={labelClass}>Sujet</label>
                <input
                  type="text"
                  value={preview.subject || ""}
                  onChange={(e) => updatePreview("subject", e.target.value)}
                  className={inputClass}
                  placeholder="Ex: Rappel - Documents manquants"
                />
              </div>
              <div>
                <label className={labelClass}>Contenu</label>
                <textarea
                  value={preview.body || ""}
                  onChange={(e) => updatePreview("body", e.target.value)}
                  rows={4}
                  className={`${inputClass} resize-none`}
                  placeholder="Détail de la tâche ou notification..."
                />
                <div className="mt-2">
                  <p className="text-[10px] font-semibold text-ht-text-secondary uppercase tracking-wide mb-1">Variables disponibles</p>
                  <div className="flex flex-wrap gap-1">
                    {VARIABLE_SUGGESTIONS.map((v) => (
                      <button
                        key={v.var}
                        onClick={() => insertVariable("body", v.var)}
                        className="rounded-md bg-white border border-ht-border px-2 py-1 text-[10px] text-ht-text-secondary hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-ht-border px-5 py-3 flex gap-2 shrink-0 bg-white rounded-b-2xl">
          <button
            onClick={handleSave}
            disabled={!label.trim() || saving}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-ht-primary px-4 py-3 text-[13px] font-medium text-white hover:bg-ht-primary-dark transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-xl border border-ht-border px-4 py-3 text-[13px] font-medium text-ht-text-secondary hover:text-ht-text hover:bg-ht-fill-secondary transition-all"
          >
            <X className="h-4 w-4" />
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
