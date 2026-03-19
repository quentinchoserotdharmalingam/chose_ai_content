"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { Loader2, Filter, Calendar, User, ChevronDown, ExternalLink, AlertTriangle } from "lucide-react";
import { SUGGESTION_STATUS_META, SUGGESTION_SEVERITY_META, type SuggestionStatus, type SuggestionSeverity } from "@/types";

function safeParseJSON<T>(json: string, fallback: T): T {
  try { return JSON.parse(json) as T; } catch { return fallback; }
}

interface HistorySuggestion {
  id: string;
  severity: string;
  category: string;
  title: string;
  summary: string;
  status: string;
  customizedAction: string | null;
  resolvedAt: string | null;
  createdAt: string;
  agent: { id: string; name: string; icon: string; color: string; category: string };
  employee: { id: string; firstName: string; lastName: string; position: string; department: string } | null;
  actionLogs: Array<{ id: string; actionType: string; actionDetails: string; createdAt: string }>;
}

export function SuggestionsHistory() {
  const [suggestions, setSuggestions] = useState<HistorySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<SuggestionStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/suggestions?status=accepted,customized,ignored");
      if (!res.ok) throw new Error();
      setSuggestions(await res.json());
    } catch {
      setError("Impossible de charger l'historique.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = suggestions.filter((s) => {
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    return true;
  });

  const statusFilters: { key: SuggestionStatus | "all"; label: string; count: number }[] = [
    { key: "all", label: "Toutes", count: suggestions.length },
    { key: "accepted", label: "Validées", count: suggestions.filter((s) => s.status === "accepted").length },
    { key: "customized", label: "Personnalisées", count: suggestions.filter((s) => s.status === "customized").length },
    { key: "ignored", label: "Ignorées", count: suggestions.filter((s) => s.status === "ignored").length },
  ];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <Filter className="h-4 w-4 text-ht-text-secondary shrink-0" />
        <div className="flex gap-1 overflow-x-auto pb-1 -mb-1">
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-[12px] font-medium transition-all ${
                filterStatus === f.key
                  ? "bg-ht-primary text-white"
                  : "bg-white border border-ht-border text-ht-text-secondary hover:text-ht-text"
              }`}
            >
              {f.label}
              <span className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                filterStatus === f.key ? "bg-white/20 text-white" : "bg-ht-fill-secondary text-ht-text-secondary"
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
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

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-ht-text-secondary" />
          <p className="text-[13px] text-ht-text-secondary">Chargement de l&apos;historique...</p>
        </div>
      )}

      {/* Table - Desktop */}
      {!loading && !error && (
        <>
          <div className="hidden md:block rounded-xl border border-ht-border bg-white overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-ht-border bg-ht-fill-secondary">
                  <th className="px-4 py-3 text-left text-[12px] font-medium text-ht-text-secondary">Date</th>
                  <th className="px-4 py-3 text-left text-[12px] font-medium text-ht-text-secondary">Agent</th>
                  <th className="px-4 py-3 text-left text-[12px] font-medium text-ht-text-secondary">Suggestion</th>
                  <th className="px-4 py-3 text-left text-[12px] font-medium text-ht-text-secondary hidden lg:table-cell">Collaborateur</th>
                  <th className="px-4 py-3 text-left text-[12px] font-medium text-ht-text-secondary">Statut</th>
                  <th className="px-4 py-3 text-left text-[12px] font-medium text-ht-text-secondary hidden lg:table-cell">Actions</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const statusMeta = SUGGESTION_STATUS_META[s.status as SuggestionStatus];
                  const severityMeta = SUGGESTION_SEVERITY_META[s.severity as SuggestionSeverity];
                  const isExpanded = expandedId === s.id;

                  return (
                    <Fragment key={s.id}>
                      <tr
                        className="border-b border-ht-border hover:bg-ht-fill-secondary/50 cursor-pointer transition-colors"
                        onClick={() => setExpandedId(isExpanded ? null : s.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-[12px] text-ht-text-secondary whitespace-nowrap">
                            <Calendar className="h-3 w-3 shrink-0" />
                            {formatDate(s.resolvedAt || s.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{s.agent.icon}</span>
                            <span className="text-[12px] text-ht-text truncate max-w-[120px]">{s.agent.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-[250px]">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: severityMeta?.color }} />
                            <span className="text-[12px] text-ht-text truncate">{s.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {s.employee ? (
                            <div className="flex items-center gap-1.5">
                              <User className="h-3 w-3 text-ht-text-secondary shrink-0" />
                              <span className="text-[12px] text-ht-text truncate max-w-[120px]">
                                {s.employee.firstName} {s.employee.lastName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[12px] text-ht-text-secondary">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap"
                            style={{ backgroundColor: statusMeta?.bgColor, color: statusMeta?.color }}
                          >
                            {statusMeta?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-[12px] text-ht-text-secondary">
                            {s.actionLogs.length} action{s.actionLogs.length !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <ChevronDown className={`h-4 w-4 text-ht-text-secondary transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                        </td>
                      </tr>
                      {/* Expanded detail row */}
                      <tr>
                        <td colSpan={7} className="p-0">
                          <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                            }`}
                          >
                            <div className="px-5 py-4 bg-ht-fill-secondary/30 space-y-3">
                              <p className="text-[12px] text-ht-text-secondary">{s.summary}</p>

                              {s.customizedAction && (
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                  <p className="text-[11px] font-medium text-blue-700 mb-1">Personnalisation :</p>
                                  <p className="text-[12px] text-blue-600">
                                    {(() => {
                                      const parsed = safeParseJSON<{ note?: string }>(s.customizedAction, {});
                                      return parsed.note || s.customizedAction;
                                    })()}
                                  </p>
                                </div>
                              )}

                              {s.actionLogs.length > 0 && (
                                <div>
                                  <p className="text-[11px] font-medium text-ht-text mb-2">Actions exécutées :</p>
                                  <div className="space-y-1">
                                    {s.actionLogs.map((log) => {
                                      const details = safeParseJSON<{ label?: string }>(log.actionDetails, {});
                                      return (
                                        <div key={log.id} className="flex items-center gap-2 rounded-lg border border-ht-border bg-white px-3 py-2">
                                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                            log.actionType === "email" ? "bg-blue-50 text-blue-600" : log.actionType === "meeting" ? "bg-purple-50 text-purple-600" : "bg-green-50 text-green-600"
                                          }`}>
                                            {log.actionType === "email" ? "Email" : log.actionType === "meeting" ? "Meeting" : "Tâche"}
                                          </span>
                                          <span className="text-[12px] text-ht-text flex-1 truncate">{details.label || "Action"}</span>
                                          <span className="text-[11px] text-ht-text-secondary">Simulé</span>
                                          <ExternalLink className="h-3 w-3 text-ht-text-secondary shrink-0" />
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((s) => {
              const statusMeta = SUGGESTION_STATUS_META[s.status as SuggestionStatus];
              const isExpanded = expandedId === s.id;
              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-ht-border bg-white overflow-hidden"
                  onClick={() => setExpandedId(isExpanded ? null : s.id)}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{s.agent.icon}</span>
                        <span className="text-[12px] text-ht-text-secondary">{s.agent.name}</span>
                      </div>
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: statusMeta?.bgColor, color: statusMeta?.color }}
                      >
                        {statusMeta?.label}
                      </span>
                    </div>
                    <p className="text-[13px] font-medium text-ht-text mb-1">{s.title}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] text-ht-text-secondary">{formatDate(s.resolvedAt || s.createdAt)}</p>
                      <ChevronDown className={`h-4 w-4 text-ht-text-secondary transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                  {/* Expandable detail */}
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[400px]" : "max-h-0"}`}>
                    <div className="border-t border-ht-border px-4 py-3 bg-ht-fill-secondary/30 space-y-2">
                      <p className="text-[12px] text-ht-text-secondary">{s.summary}</p>
                      {s.employee && (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-ht-text-secondary" />
                          <span className="text-[12px] text-ht-text">{s.employee.firstName} {s.employee.lastName}</span>
                        </div>
                      )}
                      {s.actionLogs.length > 0 && (
                        <p className="text-[11px] text-ht-primary font-medium">{s.actionLogs.length} action(s) exécutée(s)</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Filter className="h-10 w-10 text-ht-text-secondary mb-3" />
          <p className="text-[14px] font-medium text-ht-text">Aucun historique</p>
          <p className="text-[13px] text-ht-text-secondary mt-1">
            Les suggestions traitées apparaîtront ici.
          </p>
        </div>
      )}
    </div>
  );
}
