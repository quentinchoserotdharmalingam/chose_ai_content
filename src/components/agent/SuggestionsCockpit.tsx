"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Clock, CheckCircle2, TrendingUp, AlertTriangle, Calendar, History } from "lucide-react";
import { SUGGESTION_SEVERITY_META, type SuggestionSeverity } from "@/types";
import { SuggestionCard } from "./SuggestionCard";
import { SuggestionCardSkeleton, StatsSidebarSkeleton } from "./SuggestionSkeleton";
import { useToast } from "./Toast";

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

// Animated number component
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    const duration = 600;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  return <>{display}{suffix}</>;
}

export function SuggestionsCockpit() {
  const [suggestions, setSuggestions] = useState<SuggestionData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<SuggestionSeverity | "all">("all");
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sugRes, statsRes] = await Promise.all([
        fetch("/api/agents/suggestions?status=pending"),
        fetch("/api/agents/suggestions/stats"),
      ]);
      if (!sugRes.ok || !statsRes.ok) throw new Error("Erreur réseau");
      setSuggestions(await sugRes.json());
      setStats(await statsRes.json());
    } catch {
      setError("Impossible de charger les suggestions. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Background stats refresh (no loading state)
  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch("/api/agents/suggestions/stats");
      if (res.ok) setStats(await res.json());
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (id: string, action: "accepted" | "customized" | "ignored", customData?: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/agents/suggestions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action,
          ...(customData ? { customizedAction: customData } : {}),
        }),
      });
      if (!res.ok) throw new Error();

      const labels = { accepted: "Suggestion validée", customized: "Suggestion personnalisée", ignored: "Suggestion ignorée" };
      toast(labels[action], action === "ignored" ? "info" : "success");

      // Optimistic removal: remove from local state immediately
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
      // Refresh stats in background
      refreshStats();
    } catch {
      toast("Erreur lors du traitement", "error");
    }
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

  const urgentCount = suggestions.filter(s => s.severity === "urgent").length;
  const attentionCount = suggestions.filter(s => s.severity === "attention").length;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main feed */}
      <div className="flex-1 min-w-0">
        {/* Filters */}
        <div className="flex items-center justify-between mb-5 gap-2">
          <div className="flex gap-1 overflow-x-auto pb-1 -mb-1">
            {severityFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterSeverity(f.key)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-[12px] font-medium transition-all ${
                  filterSeverity === f.key
                    ? "bg-ht-primary text-white"
                    : "bg-white border border-ht-border text-ht-text-secondary hover:text-ht-text"
                }`}
              >
                {f.label}
                {f.count > 0 && (
                  <span className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                    filterSeverity === f.key ? "bg-white/20 text-white" : "bg-ht-fill-secondary text-ht-text-secondary"
                  }`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 shrink-0 rounded-lg border border-ht-border px-3 py-2 text-[12px] font-medium text-ht-text-secondary hover:text-ht-text hover:bg-ht-fill-secondary transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Rafraîchir</span>
          </button>
        </div>

        {/* Mobile stats summary */}
        <div className="lg:hidden mb-5">
          {stats && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-ht-border bg-white p-3 text-center">
                <p className="text-[16px] font-semibold text-ht-text">
                  {Math.floor(stats.timeSavedMinutes / 60)}h{String(stats.timeSavedMinutes % 60).padStart(2, "0")}
                </p>
                <p className="text-[10px] text-ht-text-secondary">Temps économisé</p>
              </div>
              <div className="rounded-xl border border-ht-border bg-white p-3 text-center">
                <p className="text-[16px] font-semibold text-ht-text">
                  {stats.accepted + stats.customized}/{stats.resolved}
                </p>
                <p className="text-[10px] text-ht-text-secondary">Validées</p>
              </div>
              <div className="rounded-xl border border-ht-border bg-white p-3 text-center">
                <p className="text-[16px] font-semibold text-ht-text">{stats.acceptanceRate}%</p>
                <p className="text-[10px] text-ht-text-secondary">Acceptation</p>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 mb-5">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <p className="text-[13px] font-medium text-red-700">{error}</p>
              <button onClick={fetchData} className="text-[12px] text-red-500 underline mt-1">Réessayer</button>
            </div>
          </div>
        )}

        {/* Skeleton loading */}
        {loading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ animationDelay: `${i * 100}ms` }}>
                <SuggestionCardSkeleton />
              </div>
            ))}
          </div>
        )}

        {/* Feed with staggered fade-in */}
        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((suggestion, index) => (
              <div
                key={suggestion.id}
                className="suggestion-card-in"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <SuggestionCard
                  suggestion={suggestion}
                  onAccept={() => handleAction(suggestion.id, "accepted")}
                  onIgnore={() => handleAction(suggestion.id, "ignored")}
                  onCustomize={(customData) => handleAction(suggestion.id, "customized", customData)}
                />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-ht-border">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-400" />
            </div>
            <p className="text-[15px] font-semibold text-ht-text mb-1">Tout est en ordre !</p>
            <p className="text-[13px] text-ht-text-secondary mt-1 mb-4 max-w-sm">
              Aucune suggestion en attente. Vos agents continuent de surveiller votre activité RH.
            </p>
            <button className="flex items-center gap-2 rounded-lg border border-ht-border px-4 py-2 text-[12px] font-medium text-ht-text-secondary hover:text-ht-text hover:bg-ht-fill-secondary transition-all">
              <History className="h-3.5 w-3.5" />
              Voir l&apos;historique
            </button>
          </div>
        )}
      </div>

      {/* Stats sidebar — desktop only */}
      <div className="hidden lg:block w-[280px] shrink-0 border-l border-ht-border pl-6">
        {loading && !stats ? (
          <StatsSidebarSkeleton />
        ) : (
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
                      {stats ? (
                        <>
                          <AnimatedNumber value={Math.floor(stats.timeSavedMinutes / 60)} />h
                          {String(stats.timeSavedMinutes % 60).padStart(2, "0")}
                        </>
                      ) : "—"}
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
                      {stats ? (
                        <>
                          <AnimatedNumber value={stats.accepted + stats.customized} />/{stats.resolved}
                        </>
                      ) : "—"}
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
                      {stats ? <AnimatedNumber value={stats.acceptanceRate} suffix="%" /> : "—"}
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

            {/* Upcoming this week */}
            <div className="rounded-xl border border-ht-border bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-ht-text-secondary" />
                <h3 className="text-[14px] font-semibold text-ht-text">Cette semaine</h3>
              </div>
              <div className="space-y-2">
                {urgentCount > 0 && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-[12px] text-red-700 font-medium">{urgentCount} urgent{urgentCount > 1 ? "s" : ""} à traiter</span>
                  </div>
                )}
                {attentionCount > 0 && (
                  <div className="flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className="text-[12px] text-yellow-700 font-medium">{attentionCount} point{attentionCount > 1 ? "s" : ""} d&apos;attention</span>
                  </div>
                )}
                {urgentCount === 0 && attentionCount === 0 && (
                  <p className="text-[12px] text-ht-text-secondary">Rien de critique cette semaine</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
