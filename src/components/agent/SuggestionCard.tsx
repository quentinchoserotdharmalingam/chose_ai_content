"use client";

import { useState } from "react";
import { Check, X, Edit3, ChevronDown, ChevronUp, User } from "lucide-react";
import { SUGGESTION_SEVERITY_META, SUGGESTION_CATEGORY_META, type SuggestionSeverity, type SuggestionActionStep, type SuggestionAlternative } from "@/types";

interface SuggestionData {
  id: string;
  severity: string;
  category: string;
  title: string;
  summary: string;
  context: string;
  actionPlan: string;
  alternatives: string;
  agent: { id: string; name: string; icon: string; color: string };
  employee: { id: string; firstName: string; lastName: string; position: string; department: string } | null;
}

interface SuggestionCardProps {
  suggestion: SuggestionData;
  onAccept: () => void;
  onIgnore: () => void;
  onCustomize: (customData: Record<string, unknown>) => void;
}

export function SuggestionCard({ suggestion, onAccept, onIgnore, onCustomize }: SuggestionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [customNote, setCustomNote] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const severity = SUGGESTION_SEVERITY_META[suggestion.severity as SuggestionSeverity];
  const categoryMeta = SUGGESTION_CATEGORY_META[suggestion.category];
  const actionPlan: SuggestionActionStep[] = JSON.parse(suggestion.actionPlan || "[]");
  const alternatives: SuggestionAlternative[] = JSON.parse(suggestion.alternatives || "[]");

  const handleAccept = async () => {
    setActionInProgress("accept");
    await onAccept();
    setActionInProgress(null);
  };

  const handleIgnore = async () => {
    setActionInProgress("ignore");
    await onIgnore();
    setActionInProgress(null);
  };

  const handleCustomize = async () => {
    setActionInProgress("customize");
    await onCustomize({ note: customNote, modifiedAt: new Date().toISOString() });
    setActionInProgress(null);
    setCustomizing(false);
  };

  return (
    <div className="rounded-xl border border-ht-border bg-white overflow-hidden transition-all duration-200 hover:shadow-sm">
      {/* Severity bar */}
      <div className="h-1" style={{ backgroundColor: severity?.color }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Agent icon */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
            style={{ backgroundColor: suggestion.agent.color + "15" }}
          >
            {suggestion.agent.icon}
          </div>

          <div className="flex-1 min-w-0">
            {/* Tags */}
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ backgroundColor: severity?.bgColor, color: severity?.color }}
              >
                {severity?.label}
              </span>
              {categoryMeta && (
                <span className="text-[11px] text-ht-text-secondary">
                  {categoryMeta.icon} {categoryMeta.label}
                </span>
              )}
              <span className="text-[11px] text-ht-text-secondary ml-auto">
                {suggestion.agent.name}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-[14px] font-semibold text-ht-text leading-snug">{suggestion.title}</h3>
          </div>
        </div>

        {/* Employee + Summary */}
        {suggestion.employee && (
          <div className="flex items-center gap-2 mb-2 ml-[52px]">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-ht-fill-secondary text-[10px] font-medium text-ht-text">
              <User className="h-3 w-3" />
            </div>
            <span className="text-[12px] text-ht-text font-medium">
              {suggestion.employee.firstName} {suggestion.employee.lastName}
            </span>
            <span className="text-[11px] text-ht-text-secondary">
              {suggestion.employee.position} · {suggestion.employee.department}
            </span>
          </div>
        )}

        <p className="text-[13px] text-ht-text-secondary leading-relaxed ml-[52px] mb-4">
          {suggestion.summary}
        </p>

        {/* Action plan preview */}
        <div className="ml-[52px] mb-4">
          <div className="space-y-1.5">
            {actionPlan.map((action) => (
              <div key={action.id} className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ht-primary/10 text-[10px] font-semibold text-ht-primary">
                  {action.id}
                </span>
                <span className="text-[12px] text-ht-text">{action.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expand / Collapse */}
        {(alternatives.length > 0 || actionPlan.some(a => a.detail)) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 ml-[52px] text-[12px] text-ht-primary hover:text-ht-primary-dark transition-colors mb-3"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Moins de détails" : "Plus de détails"}
          </button>
        )}

        {expanded && (
          <div className="ml-[52px] mb-4 space-y-3">
            {/* Action details */}
            {actionPlan.some(a => a.detail) && (
              <div className="rounded-lg bg-ht-fill-secondary p-3 space-y-2">
                {actionPlan.filter(a => a.detail).map((action) => (
                  <div key={action.id}>
                    <span className="text-[11px] font-medium text-ht-text">{action.label}</span>
                    <p className="text-[11px] text-ht-text-secondary">{action.detail}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Alternatives */}
            {alternatives.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-ht-text-secondary mb-1">Alternatives :</p>
                {alternatives.map((alt, i) => (
                  <div key={i} className="rounded-lg border border-dashed border-ht-border px-3 py-2 mb-1">
                    <span className="text-[12px] text-ht-text">{alt.label}</span>
                    {alt.description && (
                      <p className="text-[11px] text-ht-text-secondary">{alt.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Customize panel */}
        {customizing && (
          <div className="ml-[52px] mb-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
            <p className="text-[12px] font-medium text-ht-text mb-2">Personnaliser cette action</p>
            <textarea
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Ajoutez une note ou modifiez l'action..."
              rows={3}
              className="w-full rounded-lg border border-ht-border bg-white px-3 py-2 text-[12px] text-ht-text placeholder:text-ht-text-secondary focus:border-ht-primary focus:outline-none resize-none"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCustomize}
                disabled={actionInProgress === "customize"}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                <Check className="h-3 w-3" />
                Valider avec modifications
              </button>
              <button
                onClick={() => { setCustomizing(false); setCustomNote(""); }}
                className="rounded-lg border border-ht-border px-3 py-1.5 text-[12px] text-ht-text-secondary hover:text-ht-text transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 ml-[52px]">
          <button
            onClick={handleAccept}
            disabled={!!actionInProgress}
            className="flex items-center gap-1.5 rounded-lg bg-green-500 px-4 py-2 text-[12px] font-medium text-white hover:bg-green-600 disabled:opacity-50 transition-all"
          >
            <Check className="h-3.5 w-3.5" />
            Valider
          </button>
          <button
            onClick={() => setCustomizing(!customizing)}
            disabled={!!actionInProgress}
            className="flex items-center gap-1.5 rounded-lg border border-blue-200 px-4 py-2 text-[12px] font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-all"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Personnaliser
          </button>
          <button
            onClick={handleIgnore}
            disabled={!!actionInProgress}
            className="flex items-center gap-1.5 rounded-lg border border-ht-border px-4 py-2 text-[12px] font-medium text-ht-text-secondary hover:text-ht-text hover:bg-ht-fill-secondary disabled:opacity-50 transition-all"
          >
            <X className="h-3.5 w-3.5" />
            Ignorer
          </button>
        </div>
      </div>
    </div>
  );
}
