"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Power, Loader2, Sparkles, Trash2, Settings } from "lucide-react";
import { AGENT_CATEGORY_META, type AgentCategory, type AgentAction } from "@/types";

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
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch(`/api/agents/${agentId}`)
      .then((r) => r.json())
      .then((data) => {
        setAgent(data);
        setLoading(false);
      });
  }, [agentId]);

  const toggleStatus = async () => {
    if (!agent) return;
    const newStatus = agent.status === "active" ? "paused" : "active";
    await fetch(`/api/agents/${agentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setAgent((prev) => prev ? { ...prev, status: newStatus } : prev);
    onUpdated();
  };

  const generateSuggestions = async () => {
    setGenerating(true);
    await fetch(`/api/agents/${agentId}/generate`, { method: "POST" });
    const res = await fetch(`/api/agents/${agentId}`);
    setAgent(await res.json());
    setGenerating(false);
    onUpdated();
  };

  const deleteAgent = async () => {
    if (!confirm("Supprimer cet agent ?")) return;
    await fetch(`/api/agents/${agentId}`, { method: "DELETE" });
    onUpdated();
    onBack();
  };

  if (loading || !agent) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-ht-text-secondary" />
      </div>
    );
  }

  const actions: AgentAction[] = JSON.parse(agent.actions || "[]");
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
      <div className="rounded-xl border border-ht-border bg-white p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
              style={{ backgroundColor: agent.color + "15" }}
            >
              {agent.icon}
            </div>
            <div>
              <h2 className="text-[18px] font-semibold text-ht-text">{agent.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[12px] text-ht-text-secondary">
                  {AGENT_CATEGORY_META[agent.category as AgentCategory]?.label}
                </span>
                <span className="text-ht-text-secondary">·</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  agent.status === "active" ? "bg-green-50 text-green-600" : agent.status === "paused" ? "bg-yellow-50 text-yellow-600" : "bg-gray-50 text-gray-500"
                }`}>
                  {agent.status === "active" ? "Actif" : agent.status === "paused" ? "En pause" : "Brouillon"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!agent.isTemplate && (
              <button
                onClick={deleteAgent}
                className="flex h-9 items-center gap-2 rounded-lg border border-red-200 px-3 text-[12px] font-medium text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </button>
            )}
            <button
              onClick={toggleStatus}
              className={`flex h-9 items-center gap-2 rounded-lg px-4 text-[12px] font-medium transition-all ${
                agent.status === "active"
                  ? "border border-ht-border text-ht-text hover:bg-ht-fill-secondary"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              <Power className="h-3.5 w-3.5" />
              {agent.status === "active" ? "Mettre en pause" : "Activer"}
            </button>
          </div>
        </div>
        <p className="text-[13px] text-ht-text-secondary leading-relaxed">{agent.description}</p>
      </div>

      {/* Config sections */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {/* Trigger */}
        <div className="rounded-xl border border-ht-border bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="h-4 w-4 text-ht-text-secondary" />
            <h3 className="text-[14px] font-semibold text-ht-text">Déclencheur</h3>
          </div>
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium mb-2 ${
            agent.triggerType === "event" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
          }`}>
            {agent.triggerType === "event" ? "Événement" : "Planifié"}
          </span>
          <p className="text-[13px] text-ht-text">{agent.triggerLabel}</p>
        </div>

        {/* Info remontée */}
        <div className="rounded-xl border border-ht-border bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-ht-text-secondary" />
            <h3 className="text-[14px] font-semibold text-ht-text">Information remontée</h3>
          </div>
          <p className="text-[13px] text-ht-text">{agent.infoDescription || "Non configuré"}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-xl border border-ht-border bg-white p-5 mb-6">
        <h3 className="text-[14px] font-semibold text-ht-text mb-3">Actions suggérées</h3>
        <div className="space-y-2">
          {actions.map((action) => (
            <div
              key={action.id}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                action.enabled ? "border-green-200 bg-green-50/50" : "border-ht-border bg-ht-fill-secondary opacity-60"
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-ht-text shadow-sm">
                {action.id}
              </span>
              <span className="text-[13px] text-ht-text">{action.label}</span>
              <span className={`ml-auto text-[11px] font-medium ${action.enabled ? "text-green-600" : "text-gray-400"}`}>
                {action.enabled ? "Activé" : "Désactivé"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <div className="rounded-xl border border-dashed border-ht-primary/30 bg-[#FFF5F5] p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-ht-text">Générer des suggestions</h3>
            <p className="text-[12px] text-ht-text-secondary mt-1">
              L&apos;IA analyse les données de vos collaborateurs et génère des suggestions d&apos;actions
            </p>
          </div>
          <button
            onClick={generateSuggestions}
            disabled={generating}
            className="flex items-center gap-2 rounded-lg bg-ht-primary px-5 py-2.5 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-ht-primary-dark disabled:opacity-50"
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
            Suggestions récentes ({pendingSuggestions.length} en attente, {resolvedSuggestions.length} traitées)
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {agent.suggestions.slice(0, 10).map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border border-ht-border px-4 py-2.5">
                <span className={`inline-flex h-2 w-2 rounded-full ${
                  s.severity === "urgent" ? "bg-red-500" : s.severity === "attention" ? "bg-yellow-500" : s.severity === "opportunity" ? "bg-blue-500" : "bg-purple-500"
                }`} />
                <span className="text-[12px] text-ht-text flex-1 truncate">{s.title}</span>
                <span className={`text-[11px] font-medium ${
                  s.status === "pending" ? "text-orange-500" : s.status === "accepted" ? "text-green-500" : s.status === "customized" ? "text-blue-500" : "text-gray-400"
                }`}>
                  {s.status === "pending" ? "En attente" : s.status === "accepted" ? "Validée" : s.status === "customized" ? "Personnalisée" : "Ignorée"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
