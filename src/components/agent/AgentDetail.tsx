"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Sparkles, Trash2, Settings, ChevronDown, Copy, AlertTriangle, Zap, Mail, CalendarDays, ClipboardList, Bell, ChevronRight, X } from "lucide-react";
import { AGENT_CATEGORY_META, type AgentCategory, type AgentAction } from "@/types";

const ACTION_TYPE_META: Record<string, { icon: typeof Mail; label: string; color: string; bg: string }> = {
  email: { icon: Mail, label: "Email", color: "text-blue-600", bg: "bg-blue-50" },
  meeting: { icon: CalendarDays, label: "Réunion", color: "text-purple-600", bg: "bg-purple-50" },
  task: { icon: ClipboardList, label: "Tâche", color: "text-green-600", bg: "bg-green-50" },
  notification: { icon: Bell, label: "Notification", color: "text-orange-600", bg: "bg-orange-50" },
};

function inferActionType(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("email") || l.includes("envoyer") || l.includes("notifier") || l.includes("rappel") || l.includes("relancer") || l.includes("alerter")) return "email";
  if (l.includes("planifier") || l.includes("meeting") || l.includes("point") || l.includes("créneau") || l.includes("entretien") || l.includes("suggérer un entretien")) return "meeting";
  if (l.includes("vérifier") || l.includes("générer") || l.includes("analyser") || l.includes("afficher") || l.includes("créer")) return "task";
  return "notification";
}
import { useToast } from "./Toast";

function safeParseJSON<T>(json: string, fallback: T): T {
  try { return JSON.parse(json) as T; } catch { return fallback; }
}

interface AgentFullData {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  category: string;
  triggerType: string;
  triggerLabel: string;
  triggerConfig: string;
  infoDescription: string | null;
  actions: string;
  isTemplate: boolean;
  status: string;
  suggestions: Array<{
    id: string;
    status: string;
    severity: string;
    title: string;
    createdAt: string;
    employee: { firstName: string; lastName: string } | null;
  }>;
}

interface AgentDetailProps {
  agentId: string;
  onBack: () => void;
  onUpdated: () => void;
}

export function AgentDetail({ agentId, onBack, onUpdated }: AgentDetailProps) {
  const [agent, setAgent] = useState<AgentFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedAction, setSelectedAction] = useState<AgentAction | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    trigger: true,
    info: true,
    actions: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/agents/${agentId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => setAgent(data))
      .catch(() => setError("Impossible de charger l'agent."))
      .finally(() => setLoading(false));
  }, [agentId]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const generateSuggestions = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/generate`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const count = data.suggestions?.length || 0;
      toast(`${count} suggestion${count > 1 ? "s" : ""} générée${count > 1 ? "s" : ""}`, "success");
      const agentRes = await fetch(`/api/agents/${agentId}`);
      setAgent(await agentRes.json());
      onUpdated();
    } catch {
      toast("Erreur lors de la génération", "error");
    } finally {
      setGenerating(false);
    }
  };

  const duplicateAgent = async () => {
    if (!agent) return;
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${agent.name} (copie)`,
          description: agent.description,
          icon: agent.icon,
          color: agent.color,
          category: agent.category,
          triggerType: agent.triggerType,
          triggerLabel: agent.triggerLabel,
          triggerConfig: safeParseJSON(agent.triggerConfig, {}),
          infoDescription: agent.infoDescription,
          actions: safeParseJSON(agent.actions, []),
          status: "draft",
        }),
      });
      if (!res.ok) throw new Error();
      toast("Agent dupliqué", "success");
      onUpdated();
      onBack();
    } catch {
      toast("Erreur lors de la duplication", "error");
    }
  };

  const deleteAgent = async () => {
    if (!confirm("Supprimer cet agent ?")) return;
    try {
      await fetch(`/api/agents/${agentId}`, { method: "DELETE" });
      toast("Agent supprimé", "success");
      onUpdated();
      onBack();
    } catch {
      toast("Erreur lors de la suppression", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-ht-text-secondary" />
        <p className="text-[13px] text-ht-text-secondary">Chargement...</p>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-8 w-8 text-red-400 mb-3" />
        <p className="text-[14px] font-medium text-ht-text">{error || "Agent introuvable"}</p>
        <button onClick={onBack} className="mt-3 text-[13px] text-ht-primary hover:underline">Retour</button>
      </div>
    );
  }

  const actions: AgentAction[] = safeParseJSON(agent.actions || "[]", []);
  const pendingSuggestions = agent.suggestions.filter((s) => s.status === "pending");
  const resolvedSuggestions = agent.suggestions.filter((s) => s.status !== "pending");

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[13px] text-ht-text-secondary hover:text-ht-text mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la bibliothèque
      </button>

      {/* Header */}
      <div className="rounded-xl border border-ht-border bg-white p-5 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
              style={{ backgroundColor: agent.color + "15" }}
            >
              {agent.icon}
            </div>
            <div>
              <h2 className="text-[18px] font-semibold text-ht-text">{agent.name}</h2>
              <span className="text-[12px] text-ht-text-secondary mt-1">
                {AGENT_CATEGORY_META[agent.category as AgentCategory]?.label}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={duplicateAgent}
              className="flex h-9 items-center gap-2 rounded-lg border border-ht-border px-3 text-[12px] font-medium text-ht-text-secondary hover:text-ht-text hover:bg-ht-fill-secondary transition-all"
            >
              <Copy className="h-3.5 w-3.5" />
              Dupliquer
            </button>
            <button
              onClick={deleteAgent}
              className="flex h-9 items-center gap-2 rounded-lg border border-red-200 px-3 text-[12px] font-medium text-red-500 hover:bg-red-50 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer
            </button>
          </div>
        </div>
        <p className="text-[13px] text-ht-text-secondary leading-relaxed">{agent.description}</p>
      </div>

      {/* Collapsible config sections */}
      <div className="space-y-3 mb-6">
        {/* Trigger */}
        <div className="rounded-xl border border-ht-border bg-white overflow-hidden">
          <button
            onClick={() => toggleSection("trigger")}
            className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-ht-fill-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-ht-text-secondary" />
              <h3 className="text-[14px] font-semibold text-ht-text">Déclencheur</h3>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                agent.triggerType === "event" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
              }`}>
                {agent.triggerType === "event" ? "Événement" : "Planifié"}
              </span>
            </div>
            <ChevronDown className={`h-4 w-4 text-ht-text-secondary transition-transform duration-200 ${expandedSections.trigger ? "rotate-180" : ""}`} />
          </button>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSections.trigger ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="px-5 pb-4 border-t border-ht-border pt-3">
              <p className="text-[13px] text-ht-text">{agent.triggerLabel}</p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-xl border border-ht-border bg-white overflow-hidden">
          <button
            onClick={() => toggleSection("info")}
            className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-ht-fill-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-ht-text-secondary" />
              <h3 className="text-[14px] font-semibold text-ht-text">Information remontée</h3>
            </div>
            <ChevronDown className={`h-4 w-4 text-ht-text-secondary transition-transform duration-200 ${expandedSections.info ? "rotate-180" : ""}`} />
          </button>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSections.info ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="px-5 pb-4 border-t border-ht-border pt-3">
              <p className="text-[13px] text-ht-text">{agent.infoDescription || "Non configuré"}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="rounded-xl border border-ht-border bg-white overflow-hidden">
          <button
            onClick={() => toggleSection("actions")}
            className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-ht-fill-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-ht-text-secondary" />
              <h3 className="text-[14px] font-semibold text-ht-text">Actions configurées</h3>
              <span className="text-[11px] text-ht-text-secondary">({actions.length})</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-ht-text-secondary transition-transform duration-200 ${expandedSections.actions ? "rotate-180" : ""}`} />
          </button>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSections.actions ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="px-5 pb-4 border-t border-ht-border pt-3 space-y-2">
              {actions.map((action) => {
                const actionType = action.type || inferActionType(action.label);
                const meta = ACTION_TYPE_META[actionType] || ACTION_TYPE_META.notification;
                const TypeIcon = meta.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => setSelectedAction(action)}
                    className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all group ${
                      action.enabled
                        ? "border-ht-border bg-white hover:border-ht-text-secondary hover:shadow-sm"
                        : "border-ht-border bg-ht-fill-secondary opacity-60"
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}>
                      <TypeIcon className={`h-4 w-4 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-ht-text">{action.label}</p>
                      {action.description && (
                        <p className="text-[11px] text-ht-text-secondary truncate mt-0.5">{action.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] font-medium ${action.enabled ? "text-green-600" : "text-gray-400"}`}>
                        {action.enabled ? "Activé" : "Désactivé"}
                      </span>
                      <ChevronRight className="h-4 w-4 text-ht-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Generate button */}
      <div className="rounded-xl border border-dashed border-ht-primary/30 bg-[#FFF5F5] p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-[14px] font-semibold text-ht-text">Générer des suggestions</h3>
            <p className="text-[12px] text-ht-text-secondary mt-1">
              L&apos;IA analyse les données de vos collaborateurs et génère des suggestions d&apos;actions
            </p>
          </div>
          <button
            onClick={generateSuggestions}
            disabled={generating}
            className="flex items-center justify-center gap-2 rounded-lg bg-ht-primary px-5 py-2.5 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-ht-primary-dark disabled:opacity-50 active:scale-95 shrink-0"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? "Génération..." : "Générer"}
          </button>
        </div>
      </div>

      {/* Recent suggestions */}
      {agent.suggestions.length > 0 && (
        <div className="rounded-xl border border-ht-border bg-white p-5">
          <h3 className="text-[14px] font-semibold text-ht-text mb-3">
            Suggestions ({pendingSuggestions.length} en attente, {resolvedSuggestions.length} traitées)
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {agent.suggestions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border border-ht-border px-4 py-2.5 hover:bg-ht-fill-secondary/50 transition-colors">
                <span className={`inline-flex h-2 w-2 shrink-0 rounded-full ${
                  s.severity === "urgent" ? "bg-red-500" : s.severity === "attention" ? "bg-yellow-500" : s.severity === "opportunity" ? "bg-blue-500" : "bg-purple-500"
                }`} />
                <span className="text-[12px] text-ht-text flex-1 truncate">{s.title}</span>
                {s.employee && (
                  <span className="text-[11px] text-ht-text-secondary hidden md:inline truncate max-w-[120px]">
                    {s.employee.firstName} {s.employee.lastName}
                  </span>
                )}
                <span className={`text-[11px] font-medium shrink-0 ${
                  s.status === "pending" ? "text-orange-500" : s.status === "accepted" ? "text-green-500" : s.status === "customized" ? "text-blue-500" : "text-gray-400"
                }`}>
                  {s.status === "pending" ? "En attente" : s.status === "accepted" ? "Validée" : s.status === "customized" ? "Personnalisée" : "Ignorée"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action detail modal */}
      {selectedAction && (() => {
        const actionType = selectedAction.type || inferActionType(selectedAction.label);
        const meta = ACTION_TYPE_META[actionType] || ACTION_TYPE_META.notification;
        const TypeIcon = meta.icon;
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSelectedAction(null)}>
            <div className="fixed inset-0 bg-black/40 transition-opacity" />
            <div
              className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-ht-border shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${meta.bg}`}>
                    <TypeIcon className={`h-4.5 w-4.5 ${meta.color}`} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-ht-text">{selectedAction.label}</h3>
                    <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium mt-0.5 ${meta.bg} ${meta.color}`}>
                      <TypeIcon className="h-3 w-3" />
                      {meta.label}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedAction(null)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-ht-fill-secondary transition-colors">
                  <X className="h-4 w-4 text-ht-text-secondary" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium ${
                    selectedAction.enabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${selectedAction.enabled ? "bg-green-500" : "bg-gray-400"}`} />
                    {selectedAction.enabled ? "Activée" : "Désactivée"}
                  </span>
                </div>

                {/* Description */}
                {selectedAction.description ? (
                  <div>
                    <p className="text-[11px] font-semibold text-ht-text-secondary uppercase tracking-wide mb-2">Ce que fait cette action</p>
                    <div className="rounded-xl bg-gray-50 px-4 py-4">
                      <p className="text-[13px] text-ht-text leading-[1.7]">{selectedAction.description}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-gray-50 px-4 py-4">
                    <p className="text-[13px] text-ht-text-secondary">Aucune description détaillée disponible pour cette action.</p>
                  </div>
                )}

                {/* How it works */}
                <div>
                  <p className="text-[11px] font-semibold text-ht-text-secondary uppercase tracking-wide mb-2">Fonctionnement</p>
                  <div className="rounded-xl border border-ht-border px-4 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-ht-text-secondary w-16 shrink-0">Type</span>
                      <span className="text-[12px] text-ht-text">{meta.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-ht-text-secondary w-16 shrink-0">Mode</span>
                      <span className="text-[12px] text-ht-text">Automatique à chaque déclenchement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-ht-text-secondary w-16 shrink-0">Statut</span>
                      <span className="text-[12px] text-ht-text">{selectedAction.enabled ? "Active — sera exécutée" : "Désactivée — ignorée"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-ht-border px-5 py-4 shrink-0 bg-white rounded-b-2xl">
                <button
                  onClick={() => setSelectedAction(null)}
                  className="w-full rounded-xl bg-ht-fill-secondary px-4 py-3 text-[13px] font-medium text-ht-text hover:bg-gray-200 transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
