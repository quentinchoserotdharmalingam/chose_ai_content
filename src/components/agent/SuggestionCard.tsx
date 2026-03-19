"use client";

import { useState, useRef, useEffect } from "react";
import { Check, X, Edit3, ChevronDown, Loader2, CheckCircle2 } from "lucide-react";
import { SUGGESTION_SEVERITY_META, SUGGESTION_CATEGORY_META, type SuggestionSeverity, type SuggestionActionStep, type SuggestionAlternative } from "@/types";

function safeParseJSON<T>(json: string, fallback: T): T {
  try { return JSON.parse(json) as T; } catch { return fallback; }
}

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
  onAccept: () => Promise<void> | void;
  onIgnore: () => Promise<void> | void;
  onCustomize: (customData: Record<string, unknown>) => Promise<void> | void;
}

export function SuggestionCard({ suggestion, onAccept, onIgnore, onCustomize }: SuggestionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [customNote, setCustomNote] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [exiting, setExiting] = useState(false);
  const [exitAction, setExitAction] = useState<string | null>(null);
  const customizeRef = useRef<HTMLTextAreaElement>(null);

  const severity = SUGGESTION_SEVERITY_META[suggestion.severity as SuggestionSeverity];
  const categoryMeta = SUGGESTION_CATEGORY_META[suggestion.category];
  const actionPlan = safeParseJSON<SuggestionActionStep[]>(suggestion.actionPlan || "[]", []);
  const alternatives = safeParseJSON<SuggestionAlternative[]>(suggestion.alternatives || "[]", []);

  useEffect(() => {
    if (customizing) {
      setTimeout(() => customizeRef.current?.focus(), 100);
    }
  }, [customizing]);

  const handleAction = async (type: string, fn: () => Promise<void> | void) => {
    setActionInProgress(type);
    try {
      await fn();
      // Trigger exit animation
      setExitAction(type);
      setExiting(true);
    } catch {
      setActionInProgress(null);
    }
  };

  const handleCustomize = () => handleAction("customize", async () => {
    await onCustomize({ note: customNote, modifiedAt: new Date().toISOString() });
    setCustomizing(false);
    setCustomNote("");
  });

  const hasDetails = alternatives.length > 0 || actionPlan.some(a => a.detail);

  // Employee initials
  const initials = suggestion.employee
    ? `${suggestion.employee.firstName[0]}${suggestion.employee.lastName[0]}`
    : "";

  return (
    <div
      className={`relative transition-all duration-350 ${
        exiting ? "suggestion-card-exit overflow-hidden" : ""
      }`}
      onAnimationEnd={() => {
        if (exiting) {
          // Animation done — parent will remove via optimistic update
        }
      }}
    >
      {/* Exit overlay */}
      {exiting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 rounded-xl">
          <div className="flex items-center gap-2">
            {exitAction === "accept" || exitAction === "customize" ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <X className="h-6 w-6 text-ht-text-secondary" />
            )}
            <span className="text-[13px] font-medium text-ht-text">
              {exitAction === "accept" ? "Validée" : exitAction === "customize" ? "Personnalisée" : "Ignorée"}
            </span>
          </div>
        </div>
      )}

      <div
        className="rounded-xl border border-ht-border bg-white overflow-hidden transition-all duration-200 hover:shadow-sm border-l-[3px]"
        style={{ borderLeftColor: severity?.color }}
      >
        <div className="p-4 md:p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
              style={{ backgroundColor: suggestion.agent.color + "15" }}
            >
              {suggestion.agent.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
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
                <span className="text-[11px] text-ht-text-secondary ml-auto hidden sm:inline">
                  {suggestion.agent.name}
                </span>
              </div>
              <h3 className="text-[13px] md:text-[14px] font-semibold text-ht-text leading-snug">{suggestion.title}</h3>
            </div>
          </div>

          {/* Employee — enhanced */}
          {suggestion.employee && (
            <div className="flex items-center gap-3 mb-3 ml-0 md:ml-[52px] rounded-lg bg-ht-fill-secondary px-3 py-2">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                style={{ backgroundColor: severity?.color }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-ht-text leading-tight">
                  {suggestion.employee.firstName} {suggestion.employee.lastName}
                </p>
                <p className="text-[11px] text-ht-text-secondary leading-tight truncate">
                  {suggestion.employee.position} · {suggestion.employee.department}
                </p>
              </div>
            </div>
          )}

          <p className="text-[12px] md:text-[13px] text-ht-text-secondary leading-relaxed ml-0 md:ml-[52px] mb-4">
            {suggestion.summary}
          </p>

          {/* Separator */}
          <div className="border-t border-ht-border mb-3 ml-0 md:ml-[52px]" />

          {/* Action plan */}
          <div className="ml-0 md:ml-[52px] mb-4">
            <p className="text-[11px] font-semibold text-ht-text-secondary uppercase tracking-wide mb-2">Plan d&apos;action</p>
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
          {hasDetails && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 ml-0 md:ml-[52px] text-[12px] text-ht-primary hover:text-ht-primary-dark transition-colors mb-3"
            >
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
              {expanded ? "Moins de détails" : "Plus de détails"}
            </button>
          )}

          {/* Animated details panel */}
          <div
            className={`ml-0 md:ml-[52px] overflow-hidden transition-all duration-300 ease-in-out ${
              expanded ? "max-h-[500px] opacity-100 mb-4" : "max-h-0 opacity-0"
            }`}
          >
            <div className="space-y-3">
              {actionPlan.some(a => a.detail) && (
                <div>
                  <p className="text-[11px] font-semibold text-ht-text-secondary uppercase tracking-wide mb-2">Détails</p>
                  <div className="rounded-lg bg-ht-fill-secondary p-3 space-y-2">
                    {actionPlan.filter(a => a.detail).map((action) => (
                      <div key={action.id}>
                        <span className="text-[11px] font-medium text-ht-text">{action.label}</span>
                        <p className="text-[11px] text-ht-text-secondary">{action.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {alternatives.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-ht-text-secondary uppercase tracking-wide mb-2">Alternatives</p>
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
          </div>

          {/* Customize panel */}
          <div
            className={`ml-0 md:ml-[52px] overflow-hidden transition-all duration-300 ease-in-out ${
              customizing ? "max-h-[300px] opacity-100 mb-4" : "max-h-0 opacity-0"
            }`}
          >
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
              <p className="text-[12px] font-medium text-ht-text mb-2">Personnaliser cette action</p>
              <textarea
                ref={customizeRef}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Ex: Reporter l'envoi à lundi prochain, changer le destinataire..."
                rows={3}
                maxLength={500}
                className="w-full rounded-lg border border-ht-border bg-white px-3 py-2 text-[12px] text-ht-text placeholder:text-ht-text-secondary focus:border-ht-primary focus:outline-none resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-ht-text-secondary">{customNote.length}/500</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setCustomizing(false); setCustomNote(""); }}
                    className="rounded-lg border border-ht-border px-3 py-1.5 text-[12px] text-ht-text-secondary hover:text-ht-text transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCustomize}
                    disabled={actionInProgress === "customize" || !customNote.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-all"
                  >
                    {actionInProgress === "customize" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Valider avec modifications
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {!exiting && (
            <div className="flex flex-wrap items-center gap-2 ml-0 md:ml-[52px]">
              <button
                onClick={() => handleAction("accept", onAccept)}
                disabled={!!actionInProgress}
                className="flex items-center gap-1.5 rounded-lg bg-ht-primary px-5 py-2.5 text-[12px] font-medium text-white hover:bg-ht-primary-dark disabled:opacity-50 transition-all active:scale-95"
              >
                {actionInProgress === "accept" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Valider
              </button>
              <button
                onClick={() => setCustomizing(!customizing)}
                disabled={!!actionInProgress}
                className="flex items-center gap-1.5 rounded-lg border border-blue-200 px-4 py-2.5 text-[12px] font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-all active:scale-95"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Personnaliser</span>
                <span className="sm:hidden">Perso.</span>
              </button>
              <button
                onClick={() => handleAction("ignore", onIgnore)}
                disabled={!!actionInProgress}
                className="flex items-center gap-1.5 rounded-lg border border-ht-border px-4 py-2.5 text-[12px] font-medium text-ht-text-secondary hover:text-ht-text hover:bg-ht-fill-secondary disabled:opacity-50 transition-all active:scale-95 ml-auto"
              >
                {actionInProgress === "ignore" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                Ignorer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
