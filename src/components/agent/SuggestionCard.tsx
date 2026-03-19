"use client";

import { useState, useRef, useEffect } from "react";
import { Check, X, Edit3, Loader2, CheckCircle2, Mail, CalendarDays, ClipboardList, Bell, ChevronRight, ArrowLeft, Send } from "lucide-react";
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

const ACTION_TYPE_META: Record<string, { icon: typeof Mail; label: string; color: string; bg: string }> = {
  email: { icon: Mail, label: "Email", color: "text-blue-600", bg: "bg-blue-50" },
  meeting: { icon: CalendarDays, label: "Réunion", color: "text-purple-600", bg: "bg-purple-50" },
  task: { icon: ClipboardList, label: "Tâche", color: "text-green-600", bg: "bg-green-50" },
  notification: { icon: Bell, label: "Notification", color: "text-orange-600", bg: "bg-orange-50" },
};

function inferActionType(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("email") || l.includes("envoyer") || l.includes("notifier") || l.includes("rappel") || l.includes("relancer")) return "email";
  if (l.includes("planifier") || l.includes("meeting") || l.includes("point") || l.includes("check-in") || l.includes("entretien")) return "meeting";
  if (l.includes("vérifier") || l.includes("créer") || l.includes("préparer") || l.includes("proposer")) return "task";
  return "notification";
}

// ── Action Preview Modal ──
function ActionPreviewModal({
  action,
  employee,
  onClose,
  onValidate,
  onCustomize,
  loading,
}: {
  action: SuggestionActionStep;
  employee: SuggestionData["employee"];
  onClose: () => void;
  onValidate: () => void;
  onCustomize: () => void;
  loading: boolean;
}) {
  const type = action.type || inferActionType(action.label);
  const meta = ACTION_TYPE_META[type] || ACTION_TYPE_META.notification;
  const Icon = meta.icon;
  const preview = action.preview;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/30 transition-opacity" />
      <div
        className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-ht-border px-5 py-4 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <button onClick={onClose} className="flex items-center gap-1.5 text-[13px] text-ht-text-secondary hover:text-ht-text transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>
            <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.bg} ${meta.color}`}>
              <Icon className="h-3 w-3" />
              {meta.label}
            </div>
          </div>
          <h3 className="text-[15px] font-semibold text-ht-text mt-3">{action.label}</h3>
          {action.detail && (
            <p className="text-[12px] text-ht-text-secondary mt-1">{action.detail}</p>
          )}
        </div>

        {/* Preview content */}
        <div className="px-5 py-4 space-y-4">
          {/* Email preview */}
          {type === "email" && preview && (
            <div className="rounded-xl border border-ht-border overflow-hidden">
              <div className="bg-ht-fill-secondary px-4 py-3 space-y-2">
                {preview.to && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-ht-text-secondary w-8 shrink-0">À</span>
                    <span className="text-[12px] text-ht-text">{preview.to}</span>
                  </div>
                )}
                {preview.subject && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-ht-text-secondary w-8 shrink-0">Obj.</span>
                    <span className="text-[12px] font-medium text-ht-text">{preview.subject}</span>
                  </div>
                )}
              </div>
              {preview.body && (
                <div className="px-4 py-3">
                  <p className="text-[12px] text-ht-text leading-relaxed whitespace-pre-line">{preview.body}</p>
                </div>
              )}
            </div>
          )}

          {/* Meeting preview */}
          {type === "meeting" && preview && (
            <div className="rounded-xl border border-ht-border p-4 space-y-3">
              {preview.subject && (
                <div>
                  <p className="text-[11px] font-medium text-ht-text-secondary mb-0.5">Sujet</p>
                  <p className="text-[13px] font-medium text-ht-text">{preview.subject}</p>
                </div>
              )}
              <div className="flex gap-4">
                {preview.date && (
                  <div>
                    <p className="text-[11px] font-medium text-ht-text-secondary mb-0.5">Date</p>
                    <p className="text-[12px] text-ht-text">{preview.date}</p>
                  </div>
                )}
                {preview.duration && (
                  <div>
                    <p className="text-[11px] font-medium text-ht-text-secondary mb-0.5">Durée</p>
                    <p className="text-[12px] text-ht-text">{preview.duration}</p>
                  </div>
                )}
              </div>
              {preview.participants && preview.participants.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium text-ht-text-secondary mb-1">Participants</p>
                  <div className="flex flex-wrap gap-1.5">
                    {preview.participants.map((p, i) => (
                      <span key={i} className="inline-flex items-center rounded-full bg-ht-fill-secondary px-2.5 py-1 text-[11px] text-ht-text">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {preview.note && (
                <div>
                  <p className="text-[11px] font-medium text-ht-text-secondary mb-0.5">Note</p>
                  <p className="text-[12px] text-ht-text">{preview.note}</p>
                </div>
              )}
            </div>
          )}

          {/* Task / notification preview */}
          {(type === "task" || type === "notification") && preview && (
            <div className="rounded-xl border border-ht-border p-4 space-y-3">
              {preview.subject && (
                <div>
                  <p className="text-[11px] font-medium text-ht-text-secondary mb-0.5">Action</p>
                  <p className="text-[13px] font-medium text-ht-text">{preview.subject}</p>
                </div>
              )}
              {preview.body && (
                <div>
                  <p className="text-[11px] font-medium text-ht-text-secondary mb-0.5">Détail</p>
                  <p className="text-[12px] text-ht-text leading-relaxed">{preview.body}</p>
                </div>
              )}
              {preview.to && (
                <div>
                  <p className="text-[11px] font-medium text-ht-text-secondary mb-0.5">Assigné à</p>
                  <p className="text-[12px] text-ht-text">{preview.to}</p>
                </div>
              )}
            </div>
          )}

          {/* Fallback if no preview */}
          {!preview && (
            <div className="rounded-xl bg-ht-fill-secondary p-4">
              <p className="text-[12px] text-ht-text-secondary">
                {action.detail || `Cette action sera exécutée automatiquement${employee ? ` pour ${employee.firstName} ${employee.lastName}` : ""}.`}
              </p>
            </div>
          )}

          {/* Simulated badge */}
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
            <span className="text-[11px] text-amber-700">Cette action sera simulée (mode démo)</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-white border-t border-ht-border px-5 py-4 flex gap-2">
          <button
            onClick={onValidate}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-ht-primary px-4 py-3 text-[13px] font-medium text-white hover:bg-ht-primary-dark disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Exécuter cette action
          </button>
          <button
            onClick={onCustomize}
            className="flex items-center justify-center gap-2 rounded-xl border border-ht-border px-4 py-3 text-[13px] font-medium text-ht-text-secondary hover:text-ht-text hover:bg-ht-fill-secondary transition-all"
          >
            <Edit3 className="h-4 w-4" />
            Ajuster
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Card ──
export function SuggestionCard({ suggestion, onAccept, onIgnore, onCustomize }: SuggestionCardProps) {
  const [customizing, setCustomizing] = useState(false);
  const [customNote, setCustomNote] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [exiting, setExiting] = useState(false);
  const [exitAction, setExitAction] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<SuggestionActionStep | null>(null);
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

  return (
    <>
      <div
        className={`relative transition-all duration-350 ${
          exiting ? "suggestion-card-exit overflow-hidden" : ""
        }`}
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
            {/* Header: severity + category + agent */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
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
                {suggestion.agent.icon} {suggestion.agent.name}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-[14px] md:text-[15px] font-semibold text-ht-text leading-snug mb-2">
              {suggestion.title}
            </h3>

            {/* Summary */}
            <p className="text-[12px] md:text-[13px] text-ht-text-secondary leading-relaxed mb-4">
              {suggestion.summary}
            </p>

            {/* Actions as clickable cards */}
            <div className="space-y-2 mb-4">
              <p className="text-[11px] font-semibold text-ht-text-secondary uppercase tracking-wide">Actions proposées</p>
              {actionPlan.map((action) => {
                const type = action.type || inferActionType(action.label);
                const meta = ACTION_TYPE_META[type] || ACTION_TYPE_META.notification;
                const Icon = meta.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => setSelectedAction(action)}
                    className="w-full flex items-center gap-3 rounded-lg border border-ht-border bg-white px-3 py-2.5 text-left hover:border-ht-text-secondary hover:shadow-sm transition-all group"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}>
                      <Icon className={`h-4 w-4 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-ht-text">{action.label}</p>
                      {action.detail && (
                        <p className="text-[11px] text-ht-text-secondary truncate">{action.detail}</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-ht-text-secondary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                );
              })}
            </div>

            {/* Alternatives (collapsed, subtle) */}
            {alternatives.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] text-ht-text-secondary mb-1.5">
                  {alternatives.length} alternative{alternatives.length > 1 ? "s" : ""} disponible{alternatives.length > 1 ? "s" : ""}
                </p>
                <div className="space-y-1">
                  {alternatives.map((alt, i) => (
                    <div key={i} className="rounded-lg border border-dashed border-ht-border px-3 py-2">
                      <span className="text-[12px] text-ht-text">{alt.label}</span>
                      {alt.description && (
                        <span className="text-[11px] text-ht-text-secondary"> — {alt.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customize panel */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                customizing ? "max-h-[300px] opacity-100 mb-4" : "max-h-0 opacity-0"
              }`}
            >
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                <p className="text-[12px] font-medium text-ht-text mb-2">Personnaliser les actions</p>
                <textarea
                  ref={customizeRef}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Ex: Reporter l'envoi à lundi, changer le destinataire, modifier le message..."
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
                      Valider
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom actions */}
            {!exiting && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleAction("accept", onAccept)}
                  disabled={!!actionInProgress}
                  className="flex items-center gap-1.5 rounded-lg bg-ht-primary px-5 py-2.5 text-[12px] font-medium text-white hover:bg-ht-primary-dark disabled:opacity-50 transition-all active:scale-95"
                >
                  {actionInProgress === "accept" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Tout valider
                </button>
                <button
                  onClick={() => setCustomizing(!customizing)}
                  disabled={!!actionInProgress}
                  className="flex items-center gap-1.5 rounded-lg border border-blue-200 px-4 py-2.5 text-[12px] font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-all active:scale-95"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Ajuster
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

      {/* Action preview modal */}
      {selectedAction && (
        <ActionPreviewModal
          action={selectedAction}
          employee={suggestion.employee}
          onClose={() => setSelectedAction(null)}
          onValidate={() => {
            setSelectedAction(null);
            handleAction("accept", onAccept);
          }}
          onCustomize={() => {
            setSelectedAction(null);
            setCustomizing(true);
          }}
          loading={actionInProgress === "accept"}
        />
      )}
    </>
  );
}
