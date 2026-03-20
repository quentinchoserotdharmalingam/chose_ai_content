"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Sparkles, Trash2, Settings, ChevronDown, Copy, AlertTriangle, Zap, ChevronRight, Pencil, Save, X, Plus } from "lucide-react";
import { AGENT_CATEGORY_META, type AgentCategory, type AgentAction } from "@/types";
import { useToast } from "./Toast";
import { AgentActionEditModal } from "./AgentActionEditModal";
import { inferActionType, ACTION_TYPE_META } from "@/lib/action-utils";

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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    trigger: true,
    info: true,
    actions: true,
  });
  const [selectedAction, setSelectedAction] = useState<AgentAction | null>(null);
  const [savingAction, setSavingAction] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTriggerLabel, setEditTriggerLabel] = useState("");
  const [editInfoDescription, setEditInfoDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
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

  const addAction = async () => {
    if (!agent) return;
    const currentActions: AgentAction[] = safeParseJSON(agent.actions || "[]", []);
    const newId = currentActions.length > 0 ? Math.max(...currentActions.map(a => a.id)) + 1 : 1;
    const newAction: AgentAction = {
      id: newId,
      label: "Nouvelle action",
      enabled: true,
      type: "email",
      detail: "",
      preview: { to: "", subject: "", body: "" },
    };
    const newActions = [...currentActions, newAction];
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actions: newActions }),
      });
      if (!res.ok) throw new Error();
      const agentRes = await fetch(`/api/agents/${agentId}`);
      if (!agentRes.ok) throw new Error();
      setAgent(await agentRes.json());
      setSelectedAction(newAction);
      onUpdated();
    } catch {
      toast("Erreur lors de l'ajout", "error");
    }
  };

  const deleteAction = async (actionId: number) => {
    if (!agent) return;
    const currentActions: AgentAction[] = safeParseJSON(agent.actions || "[]", []);
    const newActions = currentActions.filter(a => a.id !== actionId);
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actions: newActions }),
      });
      if (!res.ok) throw new Error();
      const agentRes = await fetch(`/api/agents/${agentId}`);
      if (!agentRes.ok) throw new Error();
      setAgent(await agentRes.json());
      toast("Action supprimée", "success");
      onUpdated();
    } catch {
      toast("Erreur lors de la suppression", "error");
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

  const startEditing = () => {
    if (!agent) return;
    setEditName(agent.name);
    setEditDescription(agent.description || "");
    setEditTriggerLabel(agent.triggerLabel);
    setEditInfoDescription(agent.infoDescription || "");
    setExpandedSections({ trigger: true, info: true, actions: true });
    setEditing(true);
  };

  const cancelEditing = () => setEditing(false);

  const saveChanges = async () => {
    if (!agent) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          triggerLabel: editTriggerLabel,
          infoDescription: editInfoDescription,
        }),
      });
      if (!res.ok) throw new Error();
      const agentRes = await fetch(`/api/agents/${agentId}`);
      if (!agentRes.ok) throw new Error();
      setAgent(await agentRes.json());
      setEditing(false);
      toast("Agent mis à jour", "success");
      onUpdated();
    } catch {
      toast("Erreur lors de la sauvegarde", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleActionSave = async (updated: AgentAction) => {
    if (!agent) return;
    setSavingAction(true);
    try {
      const currentActions: AgentAction[] = safeParseJSON(agent.actions || "[]", []);
      const newActions = currentActions.map(a => a.id === updated.id ? updated : a);
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actions: newActions }),
      });
      if (!res.ok) throw new Error();
      const agentRes = await fetch(`/api/agents/${agentId}`);
      if (!agentRes.ok) throw new Error();
      setAgent(await agentRes.json());
      setSelectedAction(null);
      toast("Action mise à jour", "success");
      onUpdated();
    } catch {
      toast("Erreur lors de la sauvegarde", "error");
    } finally {
      setSavingAction(false);
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

  return (
    <>
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
            <div className="min-w-0">
              <h2 className="text-[18px] font-semibold text-ht-text truncate">{agent.name}</h2>
              <span className="text-[12px] text-ht-text-secondary mt-1">
                {AGENT_CATEGORY_META[agent.category as AgentCategory]?.label}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {editing ? (
              <>
                <button
                  onClick={saveChanges}
                  disabled={savingEdit}
                  className="flex h-9 items-center gap-2 rounded-lg bg-green-600 px-3 text-[12px] font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-all"
                >
                  <Save className="h-3.5 w-3.5" />
                  {savingEdit ? "Enregistrement..." : "Enregistrer"}
                </button>
                <button
                  onClick={cancelEditing}
                  className="flex h-9 items-center gap-2 rounded-lg border border-ht-border px-3 text-[12px] font-medium text-ht-text-secondary hover:text-ht-text hover:bg-ht-fill-secondary transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                  Annuler
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={startEditing}
                  className="flex h-9 items-center gap-2 rounded-lg border border-ht-border px-3 text-[12px] font-medium text-ht-text-secondary hover:text-ht-text hover:bg-ht-fill-secondary transition-all"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Modifier
                </button>
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
              </>
            )}
          </div>
        </div>
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-ht-text-secondary uppercase tracking-wide mb-1 block">Nom</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border border-ht-border px-3 py-2 text-[15px] font-semibold text-ht-text focus:outline-none focus:ring-2 focus:ring-ht-primary/20 focus:border-ht-primary transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-ht-text-secondary uppercase tracking-wide mb-1 block">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-ht-border px-3 py-2 text-[13px] text-ht-text focus:outline-none focus:ring-2 focus:ring-ht-primary/20 focus:border-ht-primary transition-all resize-none"
              />
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-ht-text-secondary leading-relaxed">{agent.description}</p>
        )}
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
              {editing ? (
                <input
                  type="text"
                  value={editTriggerLabel}
                  onChange={(e) => setEditTriggerLabel(e.target.value)}
                  className="w-full rounded-lg border border-ht-border px-3 py-2 text-[13px] text-ht-text focus:outline-none focus:ring-2 focus:ring-ht-primary/20 focus:border-ht-primary transition-all"
                />
              ) : (
                <p className="text-[13px] text-ht-text">{agent.triggerLabel}</p>
              )}
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
              {editing ? (
                <textarea
                  value={editInfoDescription}
                  onChange={(e) => setEditInfoDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-ht-border px-3 py-2 text-[13px] text-ht-text focus:outline-none focus:ring-2 focus:ring-ht-primary/20 focus:border-ht-primary transition-all resize-none"
                />
              ) : (
                <p className="text-[13px] text-ht-text">{agent.infoDescription || "Non configuré"}</p>
              )}
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
              <h3 className="text-[14px] font-semibold text-ht-text">Actions suggérées</h3>
              <span className="text-[11px] text-ht-text-secondary">({actions.length})</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-ht-text-secondary transition-transform duration-200 ${expandedSections.actions ? "rotate-180" : ""}`} />
          </button>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSections.actions ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="px-5 pb-4 border-t border-ht-border pt-3 space-y-2">
              {actions.map((action) => {
                const actionType = action.type || inferActionType(action.label);
                const actionMeta = ACTION_TYPE_META[actionType] || ACTION_TYPE_META.notification;
                const ActionIcon = actionMeta.icon;
                return (
                <div
                  key={action.id}
                  className="flex items-center gap-2 group"
                >
                  <button
                    onClick={() => setSelectedAction(action)}
                    className="flex items-center gap-3 rounded-lg border border-ht-border bg-white px-4 py-3 flex-1 text-left hover:shadow-sm hover:border-ht-text-secondary/30 transition-all cursor-pointer min-w-0"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${actionMeta.bg}`}>
                      <ActionIcon className={`h-4 w-4 ${actionMeta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-ht-text font-medium truncate">{action.label}</p>
                      {action.detail && <p className="text-[11px] text-ht-text-secondary truncate">{action.detail}</p>}
                    </div>
                    <div className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 ${actionMeta.bg} ${actionMeta.color}`}>
                      <ActionIcon className="h-3 w-3" />
                      {actionMeta.label}
                    </div>
                    <ChevronRight className="h-4 w-4 text-ht-text-secondary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteAction(action.id); }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ht-text-secondary/40 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    title="Supprimer cette action"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                );
              })}
              {/* Add action button */}
              <button
                onClick={addAction}
                className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-ht-border px-4 py-3 w-full text-[13px] text-ht-text-secondary hover:text-ht-primary hover:border-ht-primary hover:bg-ht-primary/5 transition-all"
              >
                <Plus className="h-4 w-4" />
                Ajouter une action
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Action edit modal */}
      {selectedAction && (
        <AgentActionEditModal
          action={selectedAction}
          onClose={() => setSelectedAction(null)}
          onSave={handleActionSave}
          saving={savingAction}
          agentName={agent.name}
          agentDescription={agent.description || undefined}
        />
      )}
    </>
  );
}
