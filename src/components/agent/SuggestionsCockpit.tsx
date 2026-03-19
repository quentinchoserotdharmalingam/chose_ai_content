"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { SUGGESTION_SEVERITY_META, type SuggestionSeverity } from "@/types";
import { SuggestionCard } from "./SuggestionCard";

interface SuggestionData {
  id: string;
  agentId: string;
  severity: string;
  category: string;
  title: string;
  summary: string;
  context: string;
  actionPlan: string;
  alternatives: string;
  status: string;
  customizedAction: string | null;
  createdAt: string;
  agent: { id: string; name: string; icon: string; color: string; category: string };
  employee: { id: string; firstName: string; lastName: string; position: string; department: string } | null;
  actionLogs: Array<{ id: string; actionType: string; actionDetails: string }>;
}

interface Stats {
  total: number;
  pending: number;
  accepted: number;
  customized: number;
  ignored: number;
  resolved: number;
  acceptanceRate: number;
  timeSavedMinutes: number;
  actionsExecuted: number;
}

export function SuggestionsCockpit() {
  const [suggestions, setSuggestions] = useState<SuggestionData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<SuggestionSeverity | "all">("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [sugRes, statsRes] = await Promise.all([
      fetch("/api/agents/suggestions?status=pending"),
      fetch("/api/agents/suggestions/stats"),
    ]);
    setSuggestions(await sugRes.json());
    setStats(await statsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (id: string, action: "accepted" | "customized" | "ignored", customData?: Record<string, unknown>) => {
    await fetch(`/api/agents/suggestions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: action,
        ...(customData ? { customizedAction: customData } : {}),
      }),
    });
    fetchData();
  };

  const filtered = suggestions.filter((s) => {
    if (filterSeverity !== "all" && s.severity !== filterSeverity) return false;
    return true;
  });

  const severityFilters = [
    { key: "all" as const, label: "Toutes", count: suggestions.length },
    ...Object.entries(SUGGESTION_SEVERITY_META).map(([key, meta]) => ({
      key: key as SuggestionSeverity,
      label: meta.label,
      count: suggestions.filter((s) => s.severity === key).length,
    })),
  ];

  return (
    <div className="flex gap-6">
      {/* Main feed */}
      <div className="flex-1 min-w-0">
        {/* Filters */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1 overflow-x-auto">
            {severityFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterSeverity(f.key)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
                  filterSeverity === f.key
                    ? "bg-ht-primary text-white"
                    : "bg-white border border-ht-border text-ht-text-secondary hover:text-ht-text"
                }`}
              >
                {f.label}
                {f.count > 0 && (
                  <span className={`text-[10px] ${filterSeverity === f.key ? "text-white/80" : "text-ht-text-secondary"}`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-ht-border px-3 py-1.5 text-[12px] font-medium text-ht-text-secondary hover:text-ht-text hover:bg-ht-fill-secondary transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Rafraîchir
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-ht-text-secondary" />
          </div>
        )}

        {/* Feed */}
        {!loading && (
          <div className="space-y-4">
            {filtered.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={() => handleAction(suggestion.id, "accepted")}
                onIgnore={() => handleAction(suggestion.id, "ignored")}
                onCustomize={(customData) => handleAction(suggestion.id, "customized", customData)}
              />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-ht-border">
            <CheckCircle2 className="h-10 w-10 text-green-400 mb-3" />
            <p className="text-[14px] font-medium text-ht-text">Tout est en ordre !</p>
            <p className="text-[13px] text-ht-text-secondary mt-1">
              Aucune suggestion en attente. Vos agents continuent de surveiller.
            </p>
          </div>
        )}
      </div>

      {/* Stats sidebar */}
      <div className="hidden lg:block w-[280px] shrink-0">
        <div className="sticky top-4 space-y-4">
          {/* Impact card */}
          <div className="rounded-xl border border-ht-border bg-white p-5">
            <h3 className="text-[14px] font-semibold text-ht-text mb-4">Votre impact</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                  <Clock className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-[18px] font-semibold text-ht-text">
                    {stats ? `${Math.floor(stats.timeSavedMinutes / 60)}h${stats.timeSavedMinutes % 60}` : "—"}
                  </p>
                  <p className="text-[11px] text-ht-text-secondary">Temps économisé</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[18px] font-semibold text-ht-text">
                    {stats ? `${stats.accepted + stats.customized}/${stats.resolved}` : "—"}
                  </p>
                  <p className="text-[11px] text-ht-text-secondary">Actions validées</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-[18px] font-semibold text-ht-text">
                    {stats ? `${stats.acceptanceRate}%` : "—"}
                  </p>
                  <p className="text-[11px] text-ht-text-secondary">Taux d&apos;acceptation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pending summary */}
          <div className="rounded-xl border border-ht-border bg-white p-5">
            <h3 className="text-[14px] font-semibold text-ht-text mb-3">En attente</h3>
            <div className="space-y-2">
              {Object.entries(SUGGESTION_SEVERITY_META).map(([key, meta]) => {
                const count = suggestions.filter((s) => s.severity === key).length;
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
                      <span className="text-[12px] text-ht-text-secondary">{meta.label}</span>
                    </div>
                    <span className="text-[13px] font-semibold text-ht-text">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
