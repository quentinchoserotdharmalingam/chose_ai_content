"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Filter, Calendar, User, ChevronDown, ExternalLink } from "lucide-react";
import { SUGGESTION_STATUS_META, SUGGESTION_SEVERITY_META, type SuggestionStatus, type SuggestionSeverity } from "@/types";

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
  const [filterStatus, setFilterStatus] = useState<SuggestionStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/agents/suggestions?status=accepted,customized,ignored");
    setSuggestions(await res.json());
    setLoading(false);
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
        <Filter className="h-4 w-4 text-ht-text-secondary" />
        <div className="flex gap-1">
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
                filterStatus === f.key
                  ? "bg-ht-primary text-white"
                  : "bg-white border border-ht-border text-ht-text-secondary hover:text-ht-text"
              }`}
            >
              {f.label}
              <span className={`text-[10px] ${filterStatus === f.key ? "text-white/80" : ""}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-ht-text-secondary" />
        </div>
      )}

      {/* Table - Desktop */}
      {!loading && (
        <>
          <div className="hidden md:block rounded-xl border border-ht-border bg-white overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-ht-border bg-ht-fill-secondary">
                  <th className="px-5 py-3 text-left text-[12px] font-medium text-ht-text-secondary">Date</th>
                  <th className="px-5 py-3 text-left text-[12px] font-medium text-ht-text-secondary">Agent</th>
                  <th className="px-5 py-3 text-left text-[12px] font-medium text-ht-text-secondary">Suggestion</th>
                  <th className="px-5 py-3 text-left text-[12px] font-medium text-ht-text-secondary">Collaborateur</th>
                  <th className="px-5 py-3 text-left text-[12px] font-medium text-ht-text-secondary">Statut</th>
                  <th className="px-5 py-3 text-left text-[12px] font-medium text-ht-text-secondary">Actions</th>
                  <th className="px-5 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const statusMeta = SUGGESTION_STATUS_META[s.status as SuggestionStatus];
                  const severityMeta = SUGGESTION_SEVERITY_META[s.severity as SuggestionSeverity];
                  const isExpanded = expandedId === s.id;

                  return (
                    <>
                      <tr
                        key={s.id}
                        className="border-b border-ht-border hover:bg-ht-fill-secondary/50 cursor-pointer transition-colors"
                        onClick={() => setExpandedId(isExpanded ? null : s.id)}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5 text-[12px] text-ht-text-secondary">
                            <Calendar className="h-3 w-3" />
                            {formatDate(s.resolvedAt || s.createdAt)}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{s.agent.icon}</span>
                            <span className="text-[12px] text-ht-text">{s.agent.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 max-w-[300px]">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: severityMeta?.color }} />
                            <span className="text-[12px] text-ht-text truncate">{s.title}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {s.employee ? (
                            <div className="flex items-center gap-1.5">
                              <User className="h-3 w-3 text-ht-text-secondary" />
                              <span className="text-[12px] text-ht-text">
                                {s.employee.firstName} {s.employee.lastName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[12px] text-ht-text-secondary">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                            style={{ backgroundColor: statusMeta?.bgColor, color: statusMeta?.color }}
                          >
                            {statusMeta?.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[12px] text-ht-text-secondary">
                            {s.actionLogs.length} action{s.actionLogs.length !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <ChevronDown className={`h-4 w-4 text-ht-text-secondary transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${s.id}-detail`}>
                          <td colSpan={7} className="px-5 py-4 bg-ht-fill-secondary/30">
                            <div className="space-y-3">
                              <p className="text-[12px] text-ht-text-secondary">{s.summary}</p>

                              {s.customizedAction && (
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                  <p className="text-[11px] font-medium text-blue-700 mb-1">Personnalisation :</p>
                                  <p className="text-[12px] text-blue-600">
                                    {(() => {
                                      try {
                                        const parsed = JSON.parse(s.customizedAction);
                                        return parsed.note || JSON.stringify(parsed);
                                      } catch {
                                        return s.customizedAction;
                                      }
                                    })()}
                                  </p>
                                </div>
                              )}

                              {s.actionLogs.length > 0 && (
                                <div>
                                  <p className="text-[11px] font-medium text-ht-text mb-2">Actions exécutées :</p>
                                  <div className="space-y-1">
                                    {s.actionLogs.map((log) => {
                                      const details = JSON.parse(log.actionDetails);
                                      return (
                                        <div key={log.id} className="flex items-center gap-2 rounded-lg border border-ht-border bg-white px-3 py-2">
                                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                            log.actionType === "email" ? "bg-blue-50 text-blue-600" : log.actionType === "meeting" ? "bg-purple-50 text-purple-600" : "bg-green-50 text-green-600"
                                          }`}>
                                            {log.actionType === "email" ? "Email" : log.actionType === "meeting" ? "Meeting" : "Tâche"}
                                          </span>
                                          <span className="text-[12px] text-ht-text">{details.label}</span>
                                          <span className="ml-auto text-[11px] text-ht-text-secondary">Simulé</span>
                                          <ExternalLink className="h-3 w-3 text-ht-text-secondary" />
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((s) => {
              const statusMeta = SUGGESTION_STATUS_META[s.status as SuggestionStatus];
              return (
                <div key={s.id} className="rounded-xl border border-ht-border bg-white p-4">
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
                  <p className="text-[12px] text-ht-text-secondary">{formatDate(s.resolvedAt || s.createdAt)}</p>
                  {s.actionLogs.length > 0 && (
                    <p className="text-[11px] text-ht-primary mt-2">{s.actionLogs.length} action(s) exécutée(s)</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && filtered.length === 0 && (
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
