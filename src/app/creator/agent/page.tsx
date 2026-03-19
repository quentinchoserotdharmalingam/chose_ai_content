"use client";

import { useState, useEffect, useCallback } from "react";
import { Bot, Plus, ChevronRight, Loader2, AlertTriangle, Inbox, History, Search } from "lucide-react";
import { AGENT_CATEGORY_META, type AgentCategory } from "@/types";
import { AgentDetail } from "@/components/agent/AgentDetail";
import { SuggestionsCockpit } from "@/components/agent/SuggestionsCockpit";
import { SuggestionsHistory } from "@/components/agent/SuggestionsHistory";
import { TemplateGallery } from "@/components/agent/TemplateGallery";
import { ToastProvider, useToast } from "@/components/agent/Toast";

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

type ViewType = "agents" | "suggestions" | "history";

function AgentPageContent() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState<ViewType>("agents");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const { toast } = useToast();

  const fetchAgents = useCallback(async (autoSeed = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error();
      const data = await res.json();

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

  // Sub-views
  if (showTemplateGallery) {
    return (
      <TemplateGallery
        onBack={() => setShowTemplateGallery(false)}
        onAgentCreated={() => {
          setShowTemplateGallery(false);
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

  const filtered = agents.filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPending = agents.reduce((sum, a) => sum + a.suggestions.filter(s => s.status === "pending").length, 0);

  // Group agents by category
  const grouped = filtered.reduce<Record<string, AgentData[]>>((acc, agent) => {
    const cat = agent.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(agent);
    return acc;
  }, {});

  return (
    <div>
      {/* Sub-navigation: Mes agents / Suggestions / Historique */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto">
        <button
          onClick={() => setActiveView("agents")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all whitespace-nowrap ${
            activeView === "agents"
              ? "bg-ht-primary text-white"
              : "text-ht-text-secondary hover:text-ht-text hover:bg-ht-fill-secondary"
          }`}
        >
          <Bot className="h-4 w-4" />
          Mes agents
          <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${
            activeView === "agents" ? "bg-white/20" : "bg-ht-fill-secondary"
          }`}>
            {agents.length}
          </span>
        </button>
        <button
          onClick={() => setActiveView("suggestions")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all whitespace-nowrap ${
            activeView === "suggestions"
              ? "bg-ht-primary text-white"
              : "text-ht-text-secondary hover:text-ht-text hover:bg-ht-fill-secondary"
          }`}
        >
          <Inbox className="h-4 w-4" />
          Suggestions
          {totalPending > 0 && (
            <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${
              activeView === "suggestions" ? "bg-white/20" : "bg-orange-100 text-orange-600"
            }`}>
              {totalPending}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveView("history")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all whitespace-nowrap ${
            activeView === "history"
              ? "bg-ht-primary text-white"
              : "text-ht-text-secondary hover:text-ht-text hover:bg-ht-fill-secondary"
          }`}
        >
          <History className="h-4 w-4" />
          Historique
        </button>
      </div>

      {/* ─── Suggestions view ─── */}
      {activeView === "suggestions" && <SuggestionsCockpit />}

      {/* ─── History view ─── */}
      {activeView === "history" && <SuggestionsHistory />}

      {/* ─── Mes agents view ─── */}
      {activeView === "agents" && (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-end gap-2 mb-5">
              <div className="relative flex-1 md:w-60">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ht-text-secondary" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-ht-border bg-white py-2 pl-9 pr-3 text-[13px] text-ht-text placeholder:text-ht-text-secondary focus:border-ht-primary focus:outline-none"
                />
              </div>
              <button
                onClick={() => setShowTemplateGallery(true)}
                className="flex items-center gap-2 shrink-0 rounded-lg bg-ht-primary px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-ht-primary-dark active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Ajouter un agent</span>
                <span className="sm:hidden">Ajouter</span>
              </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 mb-5">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="text-[13px] font-medium text-red-700">{error}</p>
                <button onClick={() => fetchAgents()} className="text-[12px] text-red-500 underline mt-1">Réessayer</button>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              {seeding ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-ht-primary" />
                  <p className="text-[14px] font-medium text-ht-text">Préparation de vos agents...</p>
                  <p className="text-[13px] text-ht-text-secondary">Chargement des données de démo</p>
                </>
              ) : (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-ht-text-secondary" />
                  <p className="text-[13px] text-ht-text-secondary">Chargement...</p>
                </>
              )}
            </div>
          )}

          {/* Agent grid grouped by category */}
          {!loading && !error && filtered.length > 0 && (
            <div className="space-y-6">
              {Object.entries(grouped).map(([category, categoryAgents]) => {
                const catMeta = AGENT_CATEGORY_META[category as AgentCategory];
                return (
                  <div key={category}>
                    <h2 className="text-[13px] font-semibold text-ht-text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
                      {catMeta?.label || "Autre"}
                      <span className="text-[12px] font-normal normal-case tracking-normal">({categoryAgents.length})</span>
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {categoryAgents.map((agent) => {
                        const pendingCount = agent.suggestions.filter(s => s.status === "pending").length;
                        return (
                          <div
                            key={agent.id}
                            className="group relative rounded-xl border border-ht-border bg-white p-4 transition-all duration-200 hover:border-ht-text-secondary hover:shadow-sm cursor-pointer"
                            onClick={() => setSelectedAgent(agent.id)}
                          >
                            <div className="flex items-center gap-3 min-w-0 mb-2">
                              <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                                style={{ backgroundColor: agent.color + "15" }}
                              >
                                {agent.icon}
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-[13px] font-semibold text-ht-text truncate">{agent.name}</h3>
                                <p className="text-[11px] text-ht-text-secondary truncate">{agent.description}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                    agent.triggerType === "event"
                                      ? "bg-blue-50 text-blue-600"
                                      : "bg-purple-50 text-purple-600"
                                  }`}
                                >
                                  {agent.triggerType === "event" ? "Événement" : "Planifié"}
                                </span>
                                {pendingCount > 0 && (
                                  <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-600">
                                    {pendingCount} suggestion{pendingCount > 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                              <ChevronRight className="h-4 w-4 text-ht-text-secondary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filtered.length === 0 && agents.length === 0 && !seeding && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Bot className="h-12 w-12 text-ht-primary/30 mb-4" />
              <p className="text-[16px] font-semibold text-ht-text mb-1">Aucun agent configuré</p>
              <p className="text-[13px] text-ht-text-secondary mb-4 max-w-md">
                Ajoutez des agents IA qui surveillent votre activité RH et vous suggèrent des actions.
              </p>
              <button
                onClick={() => setShowTemplateGallery(true)}
                className="flex items-center gap-2 rounded-lg bg-ht-primary px-5 py-2.5 text-[13px] font-medium text-white shadow-sm hover:bg-ht-primary-dark transition-all"
              >
                <Plus className="h-4 w-4" />
                Ajouter un agent
              </button>
            </div>
          )}

          {/* Search no results */}
          {!loading && !error && filtered.length === 0 && agents.length > 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-[14px] font-medium text-ht-text">Aucun agent trouvé</p>
              <p className="text-[13px] text-ht-text-secondary mt-1">Essayez un autre terme de recherche</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AgentPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen">
        {/* Header */}
        <div className="border-b border-ht-border bg-white px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6058] to-[#FF8A65] text-white shadow-sm">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-[18px] font-semibold text-ht-text">Agent IA</h1>
              <p className="text-[13px] text-ht-text-secondary">
                Vos agents surveillent l&apos;activité RH et vous suggèrent des actions
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 lg:p-8">
          <AgentPageContent />
        </div>
      </div>
    </ToastProvider>
  );
}
