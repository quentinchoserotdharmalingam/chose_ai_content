"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Save, X } from "lucide-react";
import { type AgentAction } from "@/types";
import { inferActionType, ACTION_TYPE_META } from "@/lib/action-utils";

interface AgentActionEditModalProps {
  action: AgentAction;
  onClose: () => void;
  onSave: (updated: AgentAction) => void;
  saving?: boolean;
}

export function AgentActionEditModal({ action, onClose, onSave, saving }: AgentActionEditModalProps) {
  const [label, setLabel] = useState(action.label);
  const [enabled, setEnabled] = useState(action.enabled);

  const type = inferActionType(label);
  const meta = ACTION_TYPE_META[type] || ACTION_TYPE_META.notification;
  const Icon = meta.icon;

  const hasChanges = label !== action.label || enabled !== action.enabled;

  const handleSave = () => {
    if (!label.trim()) return;
    onSave({ id: action.id, label: label.trim(), enabled });
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

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
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">
          {/* Action icon + type */}
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}>
              <Icon className={`h-6 w-6 ${meta.color}`} />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-ht-text">Configurer l&apos;action</h3>
              <p className="text-[12px] text-ht-text-secondary mt-0.5">Modifiez le libellé et l&apos;état de cette action</p>
            </div>
          </div>

          {/* Label field */}
          <div>
            <label className="text-[11px] font-semibold text-ht-text-secondary uppercase tracking-wide mb-2 block">
              Libellé de l&apos;action
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-xl border border-ht-border px-4 py-3 text-[13px] text-ht-text bg-white focus:outline-none focus:ring-2 focus:ring-ht-primary/20 focus:border-ht-primary transition-all"
              placeholder="Ex: Envoyer un email de rappel"
            />
          </div>

          {/* Enable/Disable toggle */}
          <div>
            <label className="text-[11px] font-semibold text-ht-text-secondary uppercase tracking-wide mb-2 block">
              État
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setEnabled(true)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-medium transition-all ${
                  enabled
                    ? "bg-green-50 border-2 border-green-400 text-green-700"
                    : "bg-white border border-ht-border text-ht-text-secondary hover:bg-ht-fill-secondary"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${enabled ? "bg-green-500" : "bg-gray-300"}`} />
                Activé
              </button>
              <button
                onClick={() => setEnabled(false)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-medium transition-all ${
                  !enabled
                    ? "bg-gray-100 border-2 border-gray-400 text-gray-700"
                    : "bg-white border border-ht-border text-ht-text-secondary hover:bg-ht-fill-secondary"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${!enabled ? "bg-gray-500" : "bg-gray-300"}`} />
                Désactivé
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-ht-border px-5 py-4 flex gap-2 shrink-0 bg-white rounded-b-2xl">
          <button
            onClick={handleSave}
            disabled={!hasChanges || !label.trim() || saving}
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
