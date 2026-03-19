"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Filter, ChevronRight, Power, Loader2, AlertTriangle, Bot } from "lucide-react";
import { AGENT_CATEGORY_META, type AgentCategory } from "@/types";
import { AgentDetail } from "./AgentDetail";
import { AgentCreationChat } from "./AgentCreationChat";
import { useToast } from "./Toast";

interface AgentData {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  category: string;
  triggerType: string;
  triggerLabel: string;
  isTemplate: boolean;
  status: string;
  suggestions: Array<{ id: string; status: string; severity: string }>;
}

export function AgentLibrary() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<AgentCategory | "all">("all");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showCreationChat, setShowCreationChat] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const { toast } = useToast();

  const fetchAgents = useCallback(async (autoSeed = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error();
      const data = await res.json();

      // Auto-seed if DB is empty on first load
      if (data.length === 0 && autoSeed) {
        setSeeding(true);
        const seedRes = await fetch("/api/seed/agents", { method: "POST" });
        if (seedRes.ok) {
          const refetch = await fetch("/api/agents");
          if (refetch.ok) {
            setAgents(await refetch.json());
            setLoading(false);
            setSeeding(false);
            return;
          }
        }
        setSeeding(false);
      }

      setAgents(data);
    } catch {
      setError("Impossible de charger les agents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAgents(true); }, [fetchAgents]);

  const filtered = agents.filter((a) => {
    if (filterCategory !== "all" && a.category !== filterCategory) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categories = Object.entries(AGENT_CATEGORY_META) as [AgentCategory, { label: string; description: string }][];

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast(newStatus === "active" ? "Agent activé" : "Agent mis en pause", "success");
      fetchAgents();
    } catch {
      toast("Erreur lors de la mise à jour", "error");
    }
  };

  if (showCreationChat) {
    return (
      <AgentCreationChat
        onBack={() => setShowCreationChat(false)}
        onCreated={() => {
          setShowCreationChat(false);
          toast("Agent créé avec succès", "success");
          fetchAgents();
        }}
      />
    );
  }

  if (selectedAgent) {
    return (
      <AgentDetail
        agentId={selectedAgent}
        onBack={() => setSelectedAgent(null)}
        onUpdated={fetchAgents}
      />
    );
  }

  // Group agents by category
  const groupedAgents = filtered.reduce<Record<string, AgentData[]>>((acc, agent) => {
    const cat = agent.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(agent);
    return acc;
  }, {});

  const activeCount = agents.filter(a => a.status === "active").length;
  const totalPending = agents.reduce((sum, a) => sum + a.suggestions.filter(s => s.status === "pending").length, 0);

  return (
    <div>
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-[12px] font-medium text-green-700">{activeCount} actif{activeCount > 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-gray-400" />
          <span className="text-[12px] font-medium text-gray-600">{agents.length - activeCount} inactif{agents.length - activeCount > 1 ? "s" : ""}</span>
        </div>
        {totalPending > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-[12px] font-medium text-orange-700">{totalPending} suggestion{totalPending > 1 ? "s" : ""} en attente</span>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ht-text-secondary" />
          <input
            type="text"
            placeholder="Rechercher un agent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-ht-border bg-white py-2.5 pl-10 pr-4 text-[13px] text-ht-text placeholder:text-ht-text-secondary focus:border-ht-primary focus:outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <div className="flex gap-1 rounded-lg border border-ht-border p-0.5 shrink-0">
            <button
              onClick={() => setFilterCategory("all")}
              className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-all whitespace-nowrap ${filterCategory === "all" ? "bg-ht-primary text-white" : "text-ht-text-secondary hover:text-ht-text"}`}
            >
              Tous ({agents.length})
            </button>
            {categories.map(([key, meta]) => {
              const count = agents.filter(a => a.category === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setFilterCategory(key)}
                  className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-all whitespace-nowrap ${filterCategory === key ? "bg-ht-primary text-white" : "text-ht-text-secondary hover:text-ht-text"}`}
                >
                  {meta.label} ({count})
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setShowCreationChat(true)}
            className="flex items-center gap-2 shrink-0 rounded-lg bg-ht-primary px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-ht-primary-dark active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Créer un agent</span>
            <span className="sm:hidden">Créer</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 mb-5">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <p className="text-[13px] font-medium text-red-700">{error}</p>
            <button onClick={fetchAgents} className="text-[12px] text-red-500 underline mt-1">Réessayer</button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-ht-text-secondary" />
          <p className="text-[13px] text-ht-text-secondary">Chargement des agents...</p>
        </div>
      )}

      {/* Grid - grouped by category */}
      {!loading && !error && filterCategory === "all" && Object.keys(groupedAgents).length > 0 && (
        <div className="space-y-8">
          {Object.entries(groupedAgents).map(([category, categoryAgents]) => {
            const catMeta = AGENT_CATEGORY_META[category as AgentCategory];
            return (
              <div key={category}>
                <h2 className="text-[14px] font-semibold text-ht-text mb-3 flex items-center gap-2">
                  {catMeta?.label || "Autre"}
                  <span className="text-[12px] font-normal text-ht-text-secondary">({categoryAgents.length})</span>
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryAgents.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} onSelect={setSelectedAgent} onToggle={toggleStatus} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grid - flat (filtered) */}
      {!loading && !error && filterCategory !== "all" && filtered.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onSelect={setSelectedAgent} onToggle={toggleStatus} />
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {agents.length === 0 ? (
            seeding ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-ht-primary" />
                <p className="text-[14px] font-medium text-ht-text">Préparation de vos agents...</p>
                <p className="text-[13px] text-ht-text-secondary">Chargement des templates et données de démo</p>
              </div>
            ) : (
              <>
                <Bot className="h-12 w-12 text-ht-primary/30 mb-4" />
                <p className="text-[16px] font-semibold text-ht-text mb-1">Bienvenue dans Agent Studio</p>
                <p className="text-[13px] text-ht-text-secondary mb-4 max-w-md">
                  Configurez des agents IA qui surveillent votre activité RH et vous suggèrent des actions en temps réel.
                </p>
                <button
                  onClick={() => setShowCreationChat(true)}
                  className="flex items-center gap-2 rounded-lg bg-ht-primary px-5 py-2.5 text-[13px] font-medium text-white shadow-sm hover:bg-ht-primary-dark transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Créer un agent
                </button>
              </>
            )
          ) : (
            <>
              <Filter className="h-10 w-10 text-ht-text-secondary mb-3" />
              <p className="text-[14px] font-medium text-ht-text">Aucun agent trouvé</p>
              <p className="text-[13px] text-ht-text-secondary mt-1">
                Essayez de modifier vos filtres ou créez un nouvel agent
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Extracted card component
function AgentCard({ agent, onSelect, onToggle }: {
  agent: AgentData;
  onSelect: (id: string) => void;
  onToggle: (id: string, status: string) => void;
}) {
  const pendingCount = agent.suggestions.filter((s) => s.status === "pending").length;

  return (
    <div
      className="group relative rounded-xl border border-ht-border bg-white p-4 transition-all duration-200 hover:border-ht-text-secondary hover:shadow-sm cursor-pointer"
      onClick={() => onSelect(agent.id)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
            style={{ backgroundColor: agent.color + "15" }}
          >
            {agent.icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-[13px] font-semibold text-ht-text truncate">{agent.name}</h3>
            <span className="text-[11px] text-ht-text-secondary">
              {AGENT_CATEGORY_META[agent.category as AgentCategory]?.label || "Custom"}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(agent.id, agent.status);
          }}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all ${
            agent.status === "active"
              ? "bg-green-50 text-green-600 hover:bg-green-100"
              : "bg-gray-50 text-gray-400 hover:bg-gray-100"
          }`}
          title={agent.status === "active" ? "Actif — cliquer pour désactiver" : "Inactif — cliquer pour activer"}
        >
          <Power className="h-4 w-4" />
        </button>
      </div>

      <p className="text-[12px] text-ht-text-secondary leading-relaxed mb-3 line-clamp-2">
        {agent.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
              agent.triggerType === "event"
                ? "bg-blue-50 text-blue-600"
                : "bg-purple-50 text-purple-600"
            }`}
          >
            {agent.triggerType === "event" ? "Événement" : "Planifié"}
          </span>
          {pendingCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-600">
              {pendingCount} en attente
            </span>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-ht-text-secondary opacity-0 transition-opacity group-hover:opacity-100 shrink-0" />
      </div>
    </div>
  );
}
