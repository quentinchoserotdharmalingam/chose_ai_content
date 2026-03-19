"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Filter, ChevronRight, Power, Loader2 } from "lucide-react";
import { AGENT_CATEGORY_META, type AgentCategory } from "@/types";
import { AgentDetail } from "./AgentDetail";
import { AgentCreationChat } from "./AgentCreationChat";

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
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<AgentCategory | "all">("all");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showCreationChat, setShowCreationChat] = useState(false);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/agents");
    const data = await res.json();
    setAgents(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const filtered = agents.filter((a) => {
    if (filterCategory !== "all" && a.category !== filterCategory) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categories = Object.entries(AGENT_CATEGORY_META) as [AgentCategory, { label: string; description: string }][];

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    await fetch(`/api/agents/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchAgents();
  };

  if (showCreationChat) {
    return (
      <AgentCreationChat
        onBack={() => setShowCreationChat(false)}
        onCreated={() => {
          setShowCreationChat(false);
          fetchAgents();
        }}
      />
    );
  }

  if (selectedAgent) {
    const agent = agents.find((a) => a.id === selectedAgent);
    if (agent) {
      return (
        <AgentDetail
          agentId={agent.id}
          onBack={() => setSelectedAgent(null)}
          onUpdated={fetchAgents}
        />
      );
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ht-text-secondary" />
          <input
            type="text"
            placeholder="Rechercher un agent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-ht-border bg-white py-2 pl-10 pr-4 text-[13px] text-ht-text placeholder:text-ht-text-secondary focus:border-ht-primary focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 rounded-lg border border-ht-border p-0.5">
            <button
              onClick={() => setFilterCategory("all")}
              className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-all ${filterCategory === "all" ? "bg-ht-primary text-white" : "text-ht-text-secondary hover:text-ht-text"}`}
            >
              Tous
            </button>
            {categories.map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setFilterCategory(key)}
                className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-all ${filterCategory === key ? "bg-ht-primary text-white" : "text-ht-text-secondary hover:text-ht-text"}`}
              >
                {meta.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCreationChat(true)}
            className="flex items-center gap-2 rounded-lg bg-ht-primary px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-ht-primary-dark"
          >
            <Plus className="h-4 w-4" />
            Créer un agent
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-ht-text-secondary" />
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent) => {
            const pendingCount = agent.suggestions.filter((s) => s.status === "pending").length;
            return (
              <div
                key={agent.id}
                className="group relative rounded-xl border border-ht-border bg-white p-5 transition-all duration-200 hover:border-ht-text-secondary hover:shadow-sm cursor-pointer"
                onClick={() => setSelectedAgent(agent.id)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                      style={{ backgroundColor: agent.color + "15" }}
                    >
                      {agent.icon}
                    </div>
                    <div>
                      <h3 className="text-[14px] font-semibold text-ht-text">{agent.name}</h3>
                      <span className="text-[11px] text-ht-text-secondary">
                        {AGENT_CATEGORY_META[agent.category as AgentCategory]?.label || "Custom"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStatus(agent.id, agent.status);
                    }}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                      agent.status === "active"
                        ? "bg-green-50 text-green-600 hover:bg-green-100"
                        : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                    }`}
                    title={agent.status === "active" ? "Actif — cliquer pour désactiver" : "Inactif — cliquer pour activer"}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                </div>

                {/* Description */}
                <p className="text-[12px] text-ht-text-secondary leading-relaxed mb-3 line-clamp-2">
                  {agent.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
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
                  <ChevronRight className="h-4 w-4 text-ht-text-secondary opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Filter className="h-10 w-10 text-ht-text-secondary mb-3" />
          <p className="text-[14px] font-medium text-ht-text">Aucun agent trouvé</p>
          <p className="text-[13px] text-ht-text-secondary mt-1">
            Essayez de modifier vos filtres ou créez un nouvel agent
          </p>
        </div>
      )}
    </div>
  );
}
