"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, X, CheckCircle2, ChevronRight, ArrowLeft, Send, XCircle } from "lucide-react";
import { SUGGESTION_SEVERITY_META, SUGGESTION_CATEGORY_META, type SuggestionSeverity, type SuggestionActionStep } from "@/types";
import { inferActionType, ACTION_TYPE_META } from "@/lib/action-utils";

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


type ActionStatus = "pending" | "done" | "ignored";

// ── Action Preview Modal ──
function ActionPreviewModal({
  action,
  employee,
  onClose,
  onValidate,
  onIgnore,
}: {
  action: SuggestionActionStep;
  employee: SuggestionData["employee"];
  onClose: () => void;
  onValidate: () => void;
  onIgnore: () => void;
}) {
  const type = action.type || inferActionType(action.label);
  const meta = ACTION_TYPE_META[type] || ACTION_TYPE_META.notification;
  const Icon = meta.icon;
  const preview = action.preview;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40 transition-opacity" />
      <div
        className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
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

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">

          {/* ── EMAIL ── */}
          {type === "email" && preview && (
            <div>
              {/* Email header fields */}
              <div className="px-5 py-4 space-y-2.5 bg-gray-50/80 border-b border-ht-border">
                <div className="flex items-baseline gap-3">
                  <span className="text-[11px] font-semibold text-ht-text-secondary uppercase tracking-wide w-10 shrink-0 pt-0.5">De</span>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ht-primary text-white text-[10px] font-semibold shrink-0">RH</span>
                    <span className="text-[12px] text-ht-text">Équipe RH <span className="text-ht-text-secondary">&lt;rh@company.com&gt;</span></span>
                  </div>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-[11px] font-semibold text-ht-text-secondary uppercase tracking-wide w-10 shrink-0">À</span>
                  <span className="text-[12px] text-ht-text">{preview.to}</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-[11px] font-semibold text-ht-text-secondary uppercase tracking-wide w-10 shrink-0">Objet</span>
                  <span className="text-[13px] font-semibold text-ht-text">{preview.subject}</span>
                </div>
              </div>
              {/* Email body */}
              <div className="px-5 py-5">
                <div className="text-[13px] text-ht-text leading-[1.7] whitespace-pre-line">
                  {preview.body}
                </div>
              </div>
            </div>
          )}

          {/* ── MEETING ── */}
          {type === "meeting" && preview && (
            <div className="px-5 py-5 space-y-5">
              {/* Calendar-style header */}
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center justify-center rounded-xl border border-purple-200 bg-purple-50 w-14 h-14 shrink-0">
                  <CalendarDays className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-ht-text leading-snug">{preview.subject}</h3>
                  {action.detail && <p className="text-[12px] text-ht-text-secondary mt-0.5">{action.detail}</p>}
                </div>
              </div>

              {/* Date & Duration */}
              <div className="grid grid-cols-2 gap-3">
                {preview.date && (
                  <div className="rounded-xl bg-gray-50 px-4 py-3">
                    <p className="text-[10px] font-semibold text-ht-text-secondary uppercase tracking-wide mb-1">Date</p>
                    <p className="text-[13px] font-medium text-ht-text">{preview.date}</p>
                  </div>
                )}
                {preview.duration && (
                  <div className="rounded-xl bg-gray-50 px-4 py-3">
                    <p className="text-[10px] font-semibold text-ht-text-secondary uppercase tracking-wide mb-1">Durée</p>
                    <p className="text-[13px] font-medium text-ht-text">{preview.duration}</p>
                  </div>
                )}
              </div>

              {/* Participants */}
              {preview.participants && preview.participants.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-ht-text-secondary uppercase tracking-wide mb-2">Participants ({preview.participants.length})</p>
                  <div className="space-y-1.5">
                    {preview.participants.map((p, i) => (
                      <div key={i} className="flex items-center gap-2.5 rounded-lg bg-gray-50 px-3 py-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-[10px] font-semibold text-purple-700 shrink-0">
                          {p.split(" ").map(w => w[0]).join("").slice(0, 2)}
                        </span>
                        <span className="text-[12px] text-ht-text">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Note */}
              {preview.note && (
                <div className="rounded-xl border border-ht-border px-4 py-3">
                  <p className="text-[10px] font-semibold text-ht-text-secondary uppercase tracking-wide mb-1">Note</p>
                  <p className="text-[12px] text-ht-text leading-relaxed">{preview.note}</p>
                </div>
              )}
            </div>
          )}

          {/* ── TASK / NOTIFICATION ── */}
          {(type === "task" || type === "notification") && preview && (
            <div className="px-5 py-5 space-y-4">
              {/* Task header */}
              <div className="flex items-start gap-4">
                <div className={`flex flex-col items-center justify-center rounded-xl w-14 h-14 shrink-0 ${
                  type === "task" ? "border border-green-200 bg-green-50" : "border border-orange-200 bg-orange-50"
                }`}>
                  {type === "task"
                    ? <ClipboardList className="h-5 w-5 text-green-600" />
                    : <Bell className="h-5 w-5 text-orange-600" />
                  }
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-ht-text leading-snug">{preview.subject || action.label}</h3>
                  {preview.to && <p className="text-[12px] text-ht-text-secondary mt-0.5">Destinataire : {preview.to}</p>}
                </div>
              </div>

              {/* Body */}
              {preview.body && (
                <div className="rounded-xl bg-gray-50 px-4 py-4">
                  <p className="text-[10px] font-semibold text-ht-text-secondary uppercase tracking-wide mb-2">Détail</p>
                  <p className="text-[13px] text-ht-text leading-[1.7] whitespace-pre-line">{preview.body}</p>
                </div>
              )}
            </div>
          )}

          {/* Fallback if no preview */}
          {!preview && (
            <div className="px-5 py-5">
              <div className="flex items-start gap-4">
                <div className={`flex flex-col items-center justify-center rounded-xl w-14 h-14 shrink-0 ${meta.bg}`}>
                  <Icon className={`h-5 w-5 ${meta.color}`} />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-ht-text leading-snug">{action.label}</h3>
                  <p className="text-[12px] text-ht-text-secondary mt-1">
                    {action.detail || `Cette action sera exécutée${employee ? ` pour ${employee.firstName} ${employee.lastName}` : ""}.`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-ht-border px-5 py-4 flex gap-2 shrink-0 bg-white rounded-b-2xl">
          <button
            onClick={onValidate}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-ht-primary px-4 py-3 text-[13px] font-medium text-white hover:bg-ht-primary-dark transition-all active:scale-[0.98]"
          >
            <Send className="h-4 w-4" />
            {type === "email" ? "Envoyer l\u2019email" : type === "meeting" ? "Planifier la réunion" : type === "task" ? "Créer la tâche" : "Envoyer la notification"}
          </button>
          <button
            onClick={onIgnore}
            className="flex items-center justify-center gap-2 rounded-xl border border-ht-border px-4 py-3 text-[13px] font-medium text-ht-text-secondary hover:text-ht-text hover:bg-ht-fill-secondary transition-all"
          >
            <X className="h-4 w-4" />
            Ignorer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Card ──
export function SuggestionCard({ suggestion, onAccept, onIgnore }: SuggestionCardProps) {
  const [actionStatuses, setActionStatuses] = useState<Record<number, ActionStatus>>({});
  const [selectedAction, setSelectedAction] = useState<SuggestionActionStep | null>(null);
  const [exiting, setExiting] = useState(false);
  const [exitAction, setExitAction] = useState<string | null>(null);

  const severity = SUGGESTION_SEVERITY_META[suggestion.severity as SuggestionSeverity];
  const categoryMeta = SUGGESTION_CATEGORY_META[suggestion.category];
  const actionPlan = safeParseJSON<SuggestionActionStep[]>(suggestion.actionPlan || "[]", []);

  const doneCount = Object.values(actionStatuses).filter(s => s === "done").length;
  const ignoredCount = Object.values(actionStatuses).filter(s => s === "ignored").length;
  const resolvedCount = doneCount + ignoredCount;
  const allResolved = actionPlan.length > 0 && resolvedCount === actionPlan.length;

  // When all actions are resolved, trigger parent callback after a brief delay
  useEffect(() => {
    if (!allResolved || exiting) return;
    const timer = setTimeout(() => {
      setExitAction(doneCount > 0 ? "accept" : "ignore");
      setExiting(true);
      // Call parent after exit animation
      setTimeout(() => {
        if (doneCount > 0) {
          onAccept();
        } else {
          onIgnore();
        }
      }, 400);
    }, 600);
    return () => clearTimeout(timer);
  }, [allResolved, exiting, doneCount, onAccept, onIgnore]);

  const markAction = (actionId: number, status: ActionStatus) => {
    setActionStatuses(prev => ({ ...prev, [actionId]: status }));
  };

  const markAllDone = () => {
    const next: Record<number, ActionStatus> = {};
    actionPlan.forEach(a => {
      if (!actionStatuses[a.id] || actionStatuses[a.id] === "pending") {
        next[a.id] = "done";
      } else {
        next[a.id] = actionStatuses[a.id];
      }
    });
    setActionStatuses(next);
  };

  const markAllIgnored = () => {
    const next: Record<number, ActionStatus> = {};
    actionPlan.forEach(a => {
      if (!actionStatuses[a.id] || actionStatuses[a.id] === "pending") {
        next[a.id] = "ignored";
      } else {
        next[a.id] = actionStatuses[a.id];
      }
    });
    setActionStatuses(next);
  };

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
              {exitAction === "accept" ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-ht-text-secondary" />
              )}
              <span className="text-[13px] font-medium text-ht-text">
                {exitAction === "accept"
                  ? `${doneCount} action${doneCount > 1 ? "s" : ""} validée${doneCount > 1 ? "s" : ""}`
                  : "Ignorée"}
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

            {/* Actions with per-action tracking */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-ht-text-secondary uppercase tracking-wide">Actions proposées</p>
                {resolvedCount > 0 && (
                  <span className="text-[11px] text-ht-text-secondary">
                    {resolvedCount}/{actionPlan.length} traitée{resolvedCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {actionPlan.map((action) => {
                const type = action.type || inferActionType(action.label);
                const meta = ACTION_TYPE_META[type] || ACTION_TYPE_META.notification;
                const Icon = meta.icon;
                const status = actionStatuses[action.id] || "pending";

                if (status === "done") {
                  return (
                    <div
                      key={action.id}
                      className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50/50 px-3 py-2.5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-green-700">{action.label}</p>
                        <p className="text-[11px] text-green-600">Exécutée</p>
                      </div>
                    </div>
                  );
                }

                if (status === "ignored") {
                  return (
                    <div
                      key={action.id}
                      className="flex items-center gap-3 rounded-lg border border-ht-border bg-ht-fill-secondary/50 px-3 py-2.5 opacity-60"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                        <X className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-ht-text-secondary line-through">{action.label}</p>
                        <p className="text-[11px] text-ht-text-secondary">Ignorée</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={action.id}
                    className="flex items-center gap-3 rounded-lg border border-ht-border bg-white px-3 py-2.5 transition-all group"
                  >
                    <button
                      onClick={() => setSelectedAction(action)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
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
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => markAction(action.id, "done")}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-ht-text-secondary hover:bg-green-50 hover:text-green-600 transition-all"
                        title="Valider"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => markAction(action.id, "ignored")}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-ht-text-secondary hover:bg-red-50 hover:text-red-400 transition-all"
                        title="Ignorer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick actions: only show if some actions are still pending */}
            {!exiting && !allResolved && (
              <div className="flex items-center gap-2 pt-2 border-t border-ht-border">
                <button
                  onClick={markAllDone}
                  className="flex items-center gap-1.5 rounded-lg bg-ht-primary/10 px-3 py-2 text-[12px] font-medium text-ht-primary hover:bg-ht-primary hover:text-white transition-all active:scale-95"
                >
                  <Check className="h-3.5 w-3.5" />
                  Tout valider
                </button>
                <button
                  onClick={markAllIgnored}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium text-ht-text-secondary hover:text-ht-text hover:bg-ht-fill-secondary transition-all active:scale-95 ml-auto"
                >
                  <X className="h-3.5 w-3.5" />
                  Tout ignorer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action preview modal — portal to body to escape CSS transform containment */}
      {selectedAction && createPortal(
        <ActionPreviewModal
          action={selectedAction}
          employee={suggestion.employee}
          onClose={() => setSelectedAction(null)}
          onValidate={() => {
            markAction(selectedAction.id, "done");
            setSelectedAction(null);
          }}
          onIgnore={() => {
            markAction(selectedAction.id, "ignored");
            setSelectedAction(null);
          }}
        />,
        document.body
      )}
    </>
  );
}
