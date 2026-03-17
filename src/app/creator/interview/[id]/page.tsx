"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Eye,
  Trash2,
  MessageCircle,
  BarChart3,
  Clock,
  Hash,
  Settings2,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Copy,
  Check,
  Brain,
  AlertTriangle,
  Users,
  ChevronRight,
  MessageSquareQuote,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import {
  INTERVIEW_THEME_META,
  INTERVIEW_TONE_META,
  PULSE_FREQUENCY_META,
  type InterviewTheme,
  type InterviewTone,
  type PulseFrequency,
  type AnalysisTemplateDimension,
} from "@/types";

interface Session {
  id: string;
  participantName: string | null;
  status: string;
  startedAt: string;
  completedAt: string | null;
  analysis: { id: string; createdAt: string } | null;
  _count: { messages: number };
}

interface InterviewDetail {
  id: string;
  title: string;
  description: string | null;
  type: string;
  theme: string;
  tone: string;
  status: string;
  targetDurationMinutes: number;
  maxQuestions: number;
  scopeIn: string | null;
  scopeOut: string | null;
  anchorQuestions: string[];
  checkpointQuestions: string[];
  analysisTemplate: AnalysisTemplateDimension[] | null;
  pulseQuestion: string | null;
  pulseFrequency: string | null;
  pulseMaxFollowUps: number;
  createdAt: string;
  sessions: Session[];
}

interface InterviewStats {
  participants: Array<{
    name: string;
    sessionId: string;
    completedAt: string | null;
    dimensions: Record<string, unknown>;
    globalSummary: string;
    keyVerbatims: string[];
  }>;
  dimensionAggregates: Record<string, {
    type: string;
    label: string;
    average?: number;
    min?: number;
    max?: number;
    distribution?: { faible: number; moyen: number; élevé: number };
    topItems?: Array<{ item: string; count: number }>;
    trueCount?: number;
    falseCount?: number;
    values: Array<{ participant: string; value: unknown; sessionId: string }>;
  }>;
  insights: {
    alerts: Array<{ participant: string; sessionId: string; reason: string }>;
    positiveSignals: Array<{ participant: string; sessionId: string; summary: string }>;
    topPositiveThemes: Array<{ item: string; count: number }>;
    topNegativeThemes: Array<{ item: string; count: number }>;
    topSuggestions: Array<{ item: string; count: number }>;
    allVerbatims: Array<{ quote: string; participant: string; sessionId: string }>;
  };
  aggregate: { completedCount: number; totalCount: number };
}

interface PulseAnalysis {
  dimensions?: Record<string, unknown>;
  globalSummary?: string;
  keyVerbatims?: string[];
}

interface PulseStats {
  aggregate: { average: number | null; trend: "up" | "down" | "stable"; count: number; lowScoreCount: number };
  timeline: Array<{ date: string; score: number; participant: string; sessionId: string }>;
  participants: Array<{
    name: string;
    sessions: Array<{ date: string; score: number; sessionId: string; analysis: PulseAnalysis | null }>;
  }>;
  insights: {
    alertsNegative: Array<{ participant: string; score: number; globalSummary: string; actionSuggestion: string | null; sessionId: string }>;
    alertsPositive: Array<{ participant: string; score: number; globalSummary: string; sessionId: string }>;
    topThemes: Array<{ theme: string; count: number }>;
    latestByParticipant: Record<string, { globalSummary: string; dimensions: Record<string, unknown>; score: number; sessionId: string }>;
  };
}

export default function InterviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [data, setData] = useState<InterviewDetail | null>(null);
  const [pulseStats, setPulseStats] = useState<PulseStats | null>(null);
  const [interviewStats, setInterviewStats] = useState<InterviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/interviews/${interviewId}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
        if (d.type === "pulse") {
          fetch(`/api/interviews/${interviewId}/pulse-stats`)
            .then((res) => res.json())
            .then(setPulseStats)
            .catch(() => {});
        } else if (d.type === "interview") {
          fetch(`/api/interviews/${interviewId}/interview-stats`)
            .then((res) => res.json())
            .then(setInterviewStats)
            .catch(() => {});
        }
      })
      .catch(() => setLoading(false));
  }, [interviewId]);

  const copyPulseLink = () => {
    const url = `${window.location.origin}/pulse/${interviewId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer cette interview ?")) return;
    await fetch(`/api/interviews/${interviewId}`, { method: "DELETE" });
    router.push("/creator/interview");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-ht-primary" />
      </div>
    );
  }

  if (!data) {
    return <p className="py-16 text-center text-ht-text-secondary">Interview introuvable</p>;
  }

  const isPulse = data.type === "pulse";
  const themeMeta = INTERVIEW_THEME_META[data.theme as InterviewTheme];
  const toneMeta = INTERVIEW_TONE_META[data.tone as InterviewTone];
  const completedSessions = data.sessions.filter((s) => s.status === "completed").length;
  const recentSessions = data.sessions.slice(0, 5);
  const testLink = isPulse ? `/pulse/${data.id}` : `/interview/${data.id}`;

  const sessionStatusStyles: Record<string, { label: string; color: string }> = {
    in_progress: { label: "En cours", color: "text-amber-600 bg-amber-50" },
    completed: { label: "Terminé", color: "text-green-600 bg-green-50" },
    abandoned: { label: "Abandonné", color: "text-ht-text-secondary bg-ht-fill-secondary" },
  };

  return (
    <div>
      {/* Back link */}
      <Link
        href="/creator/interview"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-ht-text-secondary hover:text-ht-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux interviews
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[22px] sm:text-[28px] font-medium tracking-[-0.02em] text-ht-text">
              {data.title}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
                data.status === "published"
                  ? "text-ht-success bg-green-50"
                  : "text-ht-text-secondary bg-ht-fill-secondary"
              }`}
            >
              {data.status === "published" ? "Publié" : "Brouillon"}
            </span>
            {themeMeta && (
              <span className="text-[13px] text-ht-text-secondary">
                {themeMeta.icon} {themeMeta.label}
              </span>
            )}
          </div>
          {data.description && (
            <p className="mt-1 text-[13px] text-ht-text-secondary">{data.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {data.status === "published" && (
            <>
              {isPulse && (
                <button
                  onClick={copyPulseLink}
                  className="flex h-9 items-center gap-2 rounded-lg border border-ht-border px-4 text-[13px] font-medium text-ht-text transition-all duration-200 hover:bg-ht-fill-secondary"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-ht-text-secondary" />}
                  {copied ? "Copié !" : "Copier le lien"}
                </button>
              )}
              <Link
                href={testLink}
                className="flex h-9 items-center gap-2 rounded-lg border border-ht-border px-4 text-[13px] font-medium text-ht-text transition-all duration-200 hover:bg-ht-fill-secondary"
              >
                <Eye className="h-4 w-4 text-ht-text-secondary" /> Tester
              </Link>
            </>
          )}
          <button
            onClick={handleDelete}
            className="flex h-9 items-center gap-2 rounded-lg border border-ht-border px-4 text-[13px] font-medium text-ht-error transition-all duration-200 hover:bg-ht-error-warm"
          >
            <Trash2 className="h-4 w-4" /> Supprimer
          </button>
        </div>
      </div>

      {/* Stats summary */}
      {isPulse ? (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-ht-border bg-white p-4">
            <p className="text-[12px] font-medium text-ht-text-secondary">Score moyen</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-[20px] font-semibold text-ht-text">
                {pulseStats?.aggregate.average ?? "—"}
                {pulseStats?.aggregate.average !== null && <span className="text-[14px] font-normal text-ht-text-secondary">/10</span>}
              </p>
              {pulseStats?.aggregate.trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
              {pulseStats?.aggregate.trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
              {pulseStats?.aggregate.trend === "stable" && <Minus className="h-4 w-4 text-ht-text-secondary" />}
            </div>
          </div>
          <div className="rounded-xl border border-ht-border bg-white p-4">
            <p className="text-[12px] font-medium text-ht-text-secondary">Réponses</p>
            <p className="mt-1 text-[20px] font-semibold text-ht-text">{pulseStats?.aggregate.count ?? 0}</p>
          </div>
          <div className="rounded-xl border border-ht-border bg-white p-4">
            <p className="text-[12px] font-medium text-ht-text-secondary">Scores bas (&le;4)</p>
            <p className={`mt-1 text-[20px] font-semibold ${(pulseStats?.aggregate.lowScoreCount ?? 0) > 0 ? "text-red-500" : "text-ht-text"}`}>
              {pulseStats?.aggregate.lowScoreCount ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-ht-border bg-white p-4">
            <p className="text-[12px] font-medium text-ht-text-secondary">Fréquence</p>
            <p className="mt-1 text-[20px] font-semibold text-ht-text">
              {data.pulseFrequency ? PULSE_FREQUENCY_META[data.pulseFrequency as PulseFrequency]?.label : "—"}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-ht-border bg-white p-4">
            <p className="text-[12px] font-medium text-ht-text-secondary">Sessions</p>
            <p className="mt-1 text-[20px] font-semibold text-ht-text">
              {completedSessions}<span className="text-[14px] font-normal text-ht-text-secondary">/{data.sessions.length}</span>
            </p>
          </div>
          <div className="rounded-xl border border-ht-border bg-white p-4">
            <p className="text-[12px] font-medium text-ht-text-secondary">Durée cible</p>
            <p className="mt-1 text-[20px] font-semibold text-ht-text">{data.targetDurationMinutes} min</p>
          </div>
          <div className="rounded-xl border border-ht-border bg-white p-4">
            <p className="text-[12px] font-medium text-ht-text-secondary">Max questions</p>
            <p className="mt-1 text-[20px] font-semibold text-ht-text">{data.maxQuestions}</p>
          </div>
          <div className="rounded-xl border border-ht-border bg-white p-4">
            <p className="text-[12px] font-medium text-ht-text-secondary">Ton</p>
            <p className="mt-1 text-[20px] font-semibold text-ht-text">{toneMeta?.label || data.tone}</p>
          </div>
        </div>
      )}

      {/* Pulse question card */}
      {isPulse && data.pulseQuestion && (
        <div className="mb-6 rounded-xl border border-ht-border bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-ht-primary" />
            <p className="text-[12px] font-medium text-ht-text-secondary uppercase tracking-wide">Question Pulse</p>
          </div>
          <p className="text-[15px] text-ht-text">{data.pulseQuestion}</p>
          <p className="mt-2 text-[12px] text-ht-text-secondary">
            Score 1-10 &middot; Max {data.pulseMaxFollowUps} questions de suivi IA &middot; {toneMeta?.label || data.tone}
          </p>
        </div>
      )}

      {/* Pulse chart — evolution (recurring) or distribution (one-time) */}
      {isPulse && pulseStats && pulseStats.timeline.length > 0 && (() => {
        const isRecurring = pulseStats.participants.some((p) => p.sessions.length > 1);
        return isRecurring ? (
          <div className="mb-6 rounded-xl border border-ht-border bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-ht-text-secondary" />
              <h2 className="text-[14px] font-semibold text-ht-text">Évolution des scores</h2>
            </div>
            <PulseEvolutionChart pulseStats={pulseStats} />
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-ht-border bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-ht-text-secondary" />
              <h2 className="text-[14px] font-semibold text-ht-text">Distribution des scores</h2>
            </div>
            <PulseScoreDistribution pulseStats={pulseStats} />
          </div>
        );
      })()}

      {/* Pulse global summary */}
      {isPulse && pulseStats && pulseStats.insights && (
        <PulseGlobalSummary pulseStats={pulseStats} />
      )}

      {/* Pulse alerts */}
      {isPulse && pulseStats && pulseStats.insights && (
        <PulseAlerts interviewId={data.id} insights={pulseStats.insights} />
      )}

      {/* Pulse per-participant view */}
      {isPulse && pulseStats && pulseStats.participants.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-ht-text-secondary" />
            <h2 className="text-[14px] font-semibold text-ht-text">Suivi par participant</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pulseStats.participants.map((p) => (
              <ParticipantCard key={p.name} participant={p} interviewId={data.id} insights={pulseStats.insights} />
            ))}
          </div>
        </div>
      )}

      {/* Interview aggregate dashboard */}
      {!isPulse && interviewStats && interviewStats.participants.length > 0 && (
        <>
          <InterviewDimensionScores stats={interviewStats} />
          <InterviewThemesSummary stats={interviewStats} />
          <InterviewAlerts interviewId={data.id} stats={interviewStats} />
          <InterviewVerbatims interviewId={data.id} stats={interviewStats} />
          <InterviewParticipantCards interviewId={data.id} stats={interviewStats} />
        </>
      )}

      {/* Sessions — full width, above config */}
      <div className="mb-6 rounded-xl border border-ht-border bg-white">
        <div className="flex items-center justify-between border-b border-ht-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-ht-text-secondary" />
            <h2 className="text-[14px] font-semibold text-ht-text">Sessions</h2>
            <span className="text-[12px] text-ht-text-secondary">({data.sessions.length})</span>
          </div>
          {data.sessions.length > 5 && (
            <Link
              href={`/creator/interview/${data.id}/sessions`}
              className="text-[12px] font-medium text-ht-primary hover:text-ht-primary-dark transition-colors"
            >
              Voir tout
            </Link>
          )}
        </div>

        {recentSessions.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="mx-auto mb-3 h-10 w-10 text-ht-text-inactive" />
            <p className="text-[13px] text-ht-text-secondary">Aucune session pour le moment</p>
            {data.status === "published" && (
              <Link
                href={testLink}
                className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ht-primary hover:text-ht-primary-dark"
              >
                <Eye className="h-4 w-4" /> Lancer un test
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-ht-border">
            {recentSessions.map((session) => {
              const status = sessionStatusStyles[session.status] || sessionStatusStyles.in_progress;
              return (
                <Link
                  key={session.id}
                  href={`/creator/interview/${data.id}/sessions/${session.id}`}
                  className="flex items-center justify-between px-5 py-3.5 transition-all duration-200 hover:bg-ht-fill-container"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ht-text truncate">
                      {session.participantName || "Participant anonyme"}
                    </p>
                    <div className="mt-0.5 flex items-center gap-3 text-[12px] text-ht-text-secondary">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(session.startedAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span>{session._count.messages} msg</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.analysis && (
                      <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-600">
                        <BarChart3 className="h-3 w-3" /> Analyse
                      </span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Configuration — only for interview type */}
      {!isPulse && <div className="rounded-xl border border-ht-border bg-white">
        <div className="flex items-center gap-2 border-b border-ht-border px-5 py-3.5">
          <Settings2 className="h-4 w-4 text-ht-text-secondary" />
          <h2 className="text-[14px] font-semibold text-ht-text">Configuration</h2>
        </div>
        <div className="space-y-4 p-5">
          {/* Scope */}
          {(data.scopeIn || data.scopeOut) && (
            <div>
              <p className="mb-2 text-[12px] font-medium text-ht-text-secondary uppercase tracking-wide">Périmètre</p>
              {data.scopeIn && (
                <div className="mb-2 rounded-lg bg-green-50 px-3 py-2">
                  <p className="text-[12px] font-medium text-green-700">Zone verte</p>
                  <p className="text-[13px] text-green-800">{data.scopeIn}</p>
                </div>
              )}
              {data.scopeOut && (
                <div className="rounded-lg bg-red-50 px-3 py-2">
                  <p className="text-[12px] font-medium text-red-700">Zone rouge</p>
                  <p className="text-[13px] text-red-800">{data.scopeOut}</p>
                </div>
              )}
            </div>
          )}

          {/* Anchor questions */}
          {data.anchorQuestions.length > 0 && (
            <div>
              <p className="mb-2 text-[12px] font-medium text-ht-text-secondary uppercase tracking-wide">
                Questions d&apos;ancrage ({data.anchorQuestions.length})
              </p>
              <ul className="space-y-1.5">
                {data.anchorQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-ht-text">
                    <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ht-text-secondary" />
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Checkpoint questions */}
          {data.checkpointQuestions.length > 0 && (
            <div>
              <p className="mb-2 text-[12px] font-medium text-ht-text-secondary uppercase tracking-wide">
                Questions de passage ({data.checkpointQuestions.length})
              </p>
              <ul className="space-y-1.5">
                {data.checkpointQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-ht-text">
                    <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ht-text-secondary" />
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Analysis dimensions */}
          {data.analysisTemplate && data.analysisTemplate.length > 0 && (
            <div>
              <p className="mb-2 text-[12px] font-medium text-ht-text-secondary uppercase tracking-wide">
                Dimensions d&apos;analyse ({data.analysisTemplate.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {data.analysisTemplate.map((dim) => (
                  <span
                    key={dim.key}
                    className="rounded-full bg-ht-fill-secondary px-2.5 py-1 text-[12px] font-medium text-ht-text"
                  >
                    {dim.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>}
    </div>
  );
}

// ============================================================
// Interview aggregate dashboard components
// ============================================================

function isRiskDimension(key: string): boolean {
  return /risk|risque|departure|départ/.test(key);
}

// Dimension comparison: horizontal bars for scores, distribution for low/med/high
function InterviewDimensionScores({ stats }: { stats: InterviewStats }) {
  const scoreDims = Object.entries(stats.dimensionAggregates).filter(([, d]) => d.type === "score_1_10");
  const qualDims = Object.entries(stats.dimensionAggregates).filter(([, d]) => d.type === "score_low_med_high");

  if (scoreDims.length === 0 && qualDims.length === 0) return null;

  return (
    <div className="mb-6 space-y-4">
      {scoreDims.map(([key, dim]) => (
        <div key={key} className="rounded-xl border border-ht-border bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-ht-text-secondary" />
              <h2 className="text-[14px] font-semibold text-ht-text">{dim.label}</h2>
            </div>
            {dim.average !== undefined && (
              <span className="text-[13px] text-ht-text-secondary">
                Moyenne : <span className="font-semibold text-ht-text">{dim.average}/10</span>
              </span>
            )}
          </div>
          <div className="space-y-3">
            {dim.values
              .sort((a, b) => (b.value as number) - (a.value as number))
              .map((v) => {
                const score = v.value as number;
                const color = score >= 7 ? "bg-green-500" : score >= 5 ? "bg-amber-500" : "bg-red-500";
                const textColor = score >= 7 ? "text-green-700" : score >= 5 ? "text-amber-700" : "text-red-700";
                return (
                  <div key={v.participant} className="flex items-center gap-3">
                    <span className="w-24 text-[13px] font-medium text-ht-text truncate">{v.participant}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color} transition-all duration-500`}
                        style={{ width: `${(score / 10) * 100}%` }}
                      />
                    </div>
                    <span className={`text-[14px] font-semibold ${textColor} w-10 text-right`}>{score}/10</span>
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      {qualDims.map(([key, dim]) => {
        const risk = isRiskDimension(key);
        return (
          <div key={key} className="rounded-xl border border-ht-border bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-ht-text-secondary" />
              <h2 className="text-[14px] font-semibold text-ht-text">{dim.label}</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {dim.values.map((v) => {
                const val = (v.value as string).toLowerCase();
                let pillColor: string;
                if (risk) {
                  pillColor = val === "faible" ? "bg-green-100 text-green-700" : val === "moyen" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
                } else {
                  pillColor = val === "élevé" || val === "elevé" ? "bg-green-100 text-green-700" : val === "moyen" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
                }
                return (
                  <div key={v.participant} className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-ht-text">{v.participant}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${pillColor}`}>
                      {v.value as string}
                    </span>
                  </div>
                );
              })}
            </div>
            {dim.distribution && (
              <div className="mt-3 flex items-center gap-4 text-[12px] text-ht-text-secondary">
                <span>{dim.distribution.faible} faible</span>
                <span>{dim.distribution.moyen} moyen</span>
                <span>{dim.distribution.élevé} élevé</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Cross-session themes: positive, negative, suggestions
function InterviewThemesSummary({ stats }: { stats: InterviewStats }) {
  const { topPositiveThemes, topNegativeThemes, topSuggestions } = stats.insights;
  if (topPositiveThemes.length === 0 && topNegativeThemes.length === 0 && topSuggestions.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-ht-border bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-4 w-4 text-purple-500" />
        <h2 className="text-[14px] font-semibold text-ht-text">Thèmes récurrents</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Positive themes */}
        {topPositiveThemes.length > 0 && (
          <div>
            <p className="text-[12px] font-medium text-green-700 mb-2">Points positifs</p>
            <div className="flex flex-wrap gap-1.5">
              {topPositiveThemes.map((t) => (
                <span key={t.item} className="rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-[12px] font-medium text-green-700">
                  {t.item} {t.count > 1 && <span className="text-green-500">({t.count})</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Negative themes */}
        {topNegativeThemes.length > 0 && (
          <div>
            <p className="text-[12px] font-medium text-red-700 mb-2">Points d&apos;alerte</p>
            <div className="flex flex-wrap gap-1.5">
              {topNegativeThemes.map((t) => (
                <span key={t.item} className="rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-[12px] font-medium text-red-700">
                  {t.item} {t.count > 1 && <span className="text-red-400">({t.count})</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {topSuggestions.length > 0 && (
        <div>
          <p className="text-[12px] font-medium text-amber-700 mb-2">Suggestions d&apos;amélioration</p>
          <ul className="space-y-1">
            {topSuggestions.map((s) => (
              <li key={s.item} className="flex items-start gap-2 text-[13px] text-ht-text">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                {s.item} {s.count > 1 && <span className="text-ht-text-secondary">({s.count}x)</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Alerts: positive signals vs warnings
function InterviewAlerts({ interviewId, stats }: { interviewId: string; stats: InterviewStats }) {
  const { alerts, positiveSignals } = stats.insights;
  if (alerts.length === 0 && positiveSignals.length === 0) return null;

  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Positive signals */}
      <div className="rounded-xl border border-ht-border bg-white p-5 border-l-4 border-l-green-500">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <h3 className="text-[13px] font-semibold text-ht-text">Signaux positifs</h3>
        </div>
        {positiveSignals.length === 0 ? (
          <p className="text-[12px] text-ht-text-secondary">Aucun signal positif</p>
        ) : (
          <div className="space-y-3">
            {positiveSignals.map((s) => (
              <Link key={s.sessionId} href={`/creator/interview/${interviewId}/sessions/${s.sessionId}`} className="block group">
                <span className="text-[13px] font-medium text-ht-text group-hover:text-ht-primary transition-colors">{s.participant}</span>
                <p className="text-[12px] text-ht-text-secondary leading-relaxed line-clamp-2 mt-0.5">{s.summary}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Alerts */}
      <div className="rounded-xl border border-ht-border bg-white p-5 border-l-4 border-l-red-500">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <h3 className="text-[13px] font-semibold text-ht-text">Points d&apos;alerte</h3>
        </div>
        {alerts.length === 0 ? (
          <p className="text-[12px] text-ht-text-secondary">Aucune alerte</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((a) => (
              <Link key={a.sessionId} href={`/creator/interview/${interviewId}/sessions/${a.sessionId}`} className="block group">
                <span className="text-[13px] font-medium text-ht-text group-hover:text-ht-primary transition-colors">{a.participant}</span>
                <p className="mt-0.5 text-[11px] font-medium text-red-700 bg-red-50 rounded px-2 py-0.5 inline-block">{a.reason}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Key verbatims across all sessions
function InterviewVerbatims({ interviewId, stats }: { interviewId: string; stats: InterviewStats }) {
  const { allVerbatims } = stats.insights;
  if (allVerbatims.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-ht-border bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquareQuote className="h-4 w-4 text-ht-text-secondary" />
        <h2 className="text-[14px] font-semibold text-ht-text">Verbatims clés</h2>
      </div>
      <div className="space-y-3">
        {allVerbatims.map((v, i) => (
          <Link
            key={i}
            href={`/creator/interview/${interviewId}/sessions/${v.sessionId}`}
            className="block group"
          >
            <blockquote className="border-l-2 border-[#FF6058] pl-3 py-1">
              <p className="text-[13px] text-ht-text leading-relaxed italic group-hover:text-ht-primary transition-colors">
                &ldquo;{v.quote}&rdquo;
              </p>
              <p className="mt-1 text-[11px] text-ht-text-secondary font-medium">— {v.participant}</p>
            </blockquote>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Per-participant summary cards
function InterviewParticipantCards({ interviewId, stats }: { interviewId: string; stats: InterviewStats }) {
  if (stats.participants.length === 0) return null;

  // Find the primary score dimension (first score_1_10)
  const scoreDimKey = Object.keys(stats.dimensionAggregates).find(
    (k) => stats.dimensionAggregates[k].type === "score_1_10"
  );
  // Find risk dimension
  const riskDimKey = Object.keys(stats.dimensionAggregates).find(
    (k) => stats.dimensionAggregates[k].type === "score_low_med_high" && isRiskDimension(k)
  );

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-4 w-4 text-ht-text-secondary" />
        <h2 className="text-[14px] font-semibold text-ht-text">Par participant</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.participants.map((p) => {
          const score = scoreDimKey ? (p.dimensions[scoreDimKey] as number) : null;
          const riskVal = riskDimKey ? (p.dimensions[riskDimKey] as string) : null;

          const scoreColor = score !== null
            ? score >= 7 ? "text-green-700 bg-green-100" : score >= 5 ? "text-amber-700 bg-amber-100" : "text-red-700 bg-red-100"
            : "";

          const riskColor = riskVal
            ? riskVal.toLowerCase() === "faible" ? "text-green-700 bg-green-50" : riskVal.toLowerCase() === "moyen" ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50"
            : "";

          return (
            <Link
              key={p.sessionId}
              href={`/creator/interview/${interviewId}/sessions/${p.sessionId}`}
              className="rounded-xl border border-ht-border bg-white p-4 transition-all duration-200 hover:shadow-md hover:border-ht-border-secondary block group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-medium text-ht-text group-hover:text-ht-primary transition-colors">
                    {p.name}
                  </span>
                  {score !== null && (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${scoreColor}`}>
                      {score}/10
                    </span>
                  )}
                  {riskVal && (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${riskColor}`}>
                      Risque : {riskVal}
                    </span>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-ht-text-secondary group-hover:text-ht-primary transition-colors" />
              </div>
              {p.globalSummary && (
                <p className="text-[12px] text-ht-text-secondary leading-relaxed line-clamp-2">
                  {p.globalSummary}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Pulse dashboard components
// ============================================================

// Participant colors for chart
const PARTICIPANT_COLORS = ["#FF6058", "#3B82F6", "#22C55E", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

// Recharts-based pulse evolution chart
function PulseEvolutionChart({ pulseStats }: { pulseStats: PulseStats }) {
  const participantNames = pulseStats.participants.map((p) => p.name);

  // Pivot timeline data: group by date, one column per participant
  const dateMap: Record<string, Record<string, number>> = {};
  for (const point of pulseStats.timeline) {
    const dateKey = new Date(point.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    if (!dateMap[dateKey]) dateMap[dateKey] = {};
    dateMap[dateKey][point.participant] = point.score;
  }

  const chartData = Object.entries(dateMap).map(([date, scores]) => {
    const values = Object.values(scores);
    const avg = values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : null;
    return { date, ...scores, moyenne: avg };
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={{ stroke: "#f3f4f6" }} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} ticks={[0, 2, 4, 6, 8, 10]} />
        <ReferenceLine y={4} stroke="#fecaca" strokeDasharray="4 4" />
        <ReferenceLine y={7} stroke="#bbf7d0" strokeDasharray="4 4" />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #f3f4f6", fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
          formatter={(value: unknown, name: unknown) => [
            `${value}/10`,
            name === "moyenne" ? "Moyenne" : String(name),
          ]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        {participantNames.map((name, i) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            stroke={PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 2, fill: "white" }}
            connectNulls
          />
        ))}
        <Line
          type="monotone"
          dataKey="moyenne"
          stroke="#6b7280"
          strokeWidth={2.5}
          strokeDasharray="6 3"
          dot={false}
          name="Moyenne"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Score distribution for one-time pulses (horizontal bars)
function PulseScoreDistribution({ pulseStats }: { pulseStats: PulseStats }) {
  const sorted = [...pulseStats.participants]
    .map((p) => ({ name: p.name, score: p.sessions[p.sessions.length - 1]?.score ?? 0 }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-3">
      {sorted.map((p) => {
        const color = p.score >= 7 ? "bg-green-500" : p.score >= 5 ? "bg-amber-500" : "bg-red-500";
        const textColor = p.score >= 7 ? "text-green-700" : p.score >= 5 ? "text-amber-700" : "text-red-700";
        return (
          <div key={p.name} className="flex items-center gap-3">
            <span className="w-20 text-[13px] font-medium text-ht-text truncate">{p.name}</span>
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${color} transition-all duration-500`}
                style={{ width: `${(p.score / 10) * 100}%` }}
              />
            </div>
            <span className={`text-[14px] font-semibold ${textColor} w-10 text-right`}>{p.score}/10</span>
          </div>
        );
      })}
    </div>
  );
}

// Global AI summary card
function PulseGlobalSummary({ pulseStats }: { pulseStats: PulseStats }) {
  const { insights } = pulseStats;
  if (!insights) return null;

  const latestEntries = Object.entries(insights.latestByParticipant);
  if (latestEntries.length === 0) return null;

  // Count sentiments
  let positif = 0, mitigé = 0, négatif = 0;
  for (const [, data] of latestEntries) {
    const sentiment = data.dimensions?.sentiment as string | undefined;
    if (sentiment === "positif") positif++;
    else if (sentiment === "négatif") négatif++;
    else mitigé++;
  }

  // Find lowest-scoring participant's insight
  const lowestEntry = latestEntries.reduce((min, curr) => (curr[1].score < min[1].score ? curr : min), latestEntries[0]);

  return (
    <div className="mb-6 rounded-xl border border-ht-border bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-4 w-4 text-purple-500" />
        <h2 className="text-[14px] font-semibold text-ht-text">Synthèse globale</h2>
      </div>

      {/* Sentiment distribution */}
      <div className="flex items-center gap-4 mb-4 text-[13px]">
        {positif > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="text-ht-text">{positif} positif{positif > 1 ? "s" : ""}</span>
          </span>
        )}
        {mitigé > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-ht-text">{mitigé} mitigé{mitigé > 1 ? "s" : ""}</span>
          </span>
        )}
        {négatif > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="text-ht-text">{négatif} négatif{négatif > 1 ? "s" : ""}</span>
          </span>
        )}
      </div>

      {/* Top themes */}
      {insights.topThemes.length > 0 && (
        <div className="mb-4">
          <p className="text-[12px] font-medium text-ht-text-secondary mb-2">Thèmes récurrents</p>
          <div className="flex flex-wrap gap-1.5">
            {insights.topThemes.map((t) => (
              <span key={t.theme} className="rounded-full bg-ht-fill-secondary px-2.5 py-1 text-[12px] font-medium text-ht-text">
                {t.theme} <span className="text-ht-text-secondary">({t.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key insight from lowest scorer */}
      {lowestEntry[1].globalSummary && (
        <div className="rounded-lg bg-red-50 px-4 py-3">
          <p className="text-[12px] font-medium text-red-700 mb-1">Point d&apos;attention — {lowestEntry[0]}</p>
          <p className="text-[13px] text-red-800 leading-relaxed">{lowestEntry[1].globalSummary}</p>
        </div>
      )}
    </div>
  );
}

// Positive and negative alerts cards
function PulseAlerts({ interviewId, insights }: { interviewId: string; insights: PulseStats["insights"] }) {
  if (insights.alertsNegative.length === 0 && insights.alertsPositive.length === 0) return null;

  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Positive signals */}
      <div className="rounded-xl border border-ht-border bg-white p-5 border-l-4 border-l-green-500">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <h3 className="text-[13px] font-semibold text-ht-text">Signaux positifs</h3>
        </div>
        {insights.alertsPositive.length === 0 ? (
          <p className="text-[12px] text-ht-text-secondary">Aucun signal positif récent</p>
        ) : (
          <div className="space-y-3">
            {insights.alertsPositive.map((a, i) => (
              <Link key={i} href={`/creator/interview/${interviewId}/sessions/${a.sessionId}`} className="block group">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[13px] font-medium text-ht-text group-hover:text-ht-primary transition-colors">{a.participant}</span>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">{a.score}/10</span>
                </div>
                <p className="text-[12px] text-ht-text-secondary leading-relaxed line-clamp-2">{a.globalSummary}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Negative alerts */}
      <div className="rounded-xl border border-ht-border bg-white p-5 border-l-4 border-l-red-500">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <h3 className="text-[13px] font-semibold text-ht-text">Points d&apos;alerte</h3>
        </div>
        {insights.alertsNegative.length === 0 ? (
          <p className="text-[12px] text-ht-text-secondary">Aucune alerte</p>
        ) : (
          <div className="space-y-3">
            {insights.alertsNegative.map((a, i) => (
              <Link key={i} href={`/creator/interview/${interviewId}/sessions/${a.sessionId}`} className="block group">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[13px] font-medium text-ht-text group-hover:text-ht-primary transition-colors">{a.participant}</span>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">{a.score}/10</span>
                </div>
                <p className="text-[12px] text-ht-text-secondary leading-relaxed line-clamp-2">{a.globalSummary}</p>
                {a.actionSuggestion && (
                  <p className="mt-1 text-[11px] font-medium text-amber-700 bg-amber-50 rounded px-2 py-0.5 inline-block">
                    {a.actionSuggestion}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Per-participant card with sparkline
function ParticipantCard({
  participant,
  interviewId,
  insights,
}: {
  participant: PulseStats["participants"][0];
  interviewId: string;
  insights: PulseStats["insights"];
}) {
  const sessions = participant.sessions;
  if (sessions.length === 0) return null;

  const latestSession = sessions[sessions.length - 1];
  const latestScore = latestSession.score;
  const latestInsight = insights.latestByParticipant[participant.name];

  // Per-participant trend
  let trend: "up" | "down" | "stable" = "stable";
  if (sessions.length >= 2) {
    const mid = Math.floor(sessions.length / 2);
    const recentAvg = sessions.slice(mid).reduce((a, s) => a + s.score, 0) / (sessions.length - mid);
    const olderAvg = sessions.slice(0, mid).reduce((a, s) => a + s.score, 0) / mid;
    if (recentAvg > olderAvg + 0.3) trend = "up";
    else if (recentAvg < olderAvg - 0.3) trend = "down";
  }

  const scoreColor = latestScore >= 7 ? "text-green-700 bg-green-100" : latestScore >= 5 ? "text-amber-700 bg-amber-100" : "text-red-700 bg-red-100";
  const sparkData = sessions.map((s) => ({ score: s.score }));
  const sparkColor = latestScore >= 7 ? "#22c55e" : latestScore >= 5 ? "#f59e0b" : "#ef4444";

  const actionSuggestion = latestInsight?.dimensions?.action_suggérée as string | undefined;

  return (
    <Link
      href={`/creator/interview/${interviewId}/sessions/${latestSession.sessionId}`}
      className="rounded-xl border border-ht-border bg-white p-4 transition-all duration-200 hover:shadow-md hover:border-ht-border-secondary block group"
    >
      {/* Header: name + score + trend */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium text-ht-text group-hover:text-ht-primary transition-colors">
            {participant.name}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${scoreColor}`}>
            {latestScore}/10
          </span>
          {trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-green-500" />}
          {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
          {trend === "stable" && <Minus className="h-3.5 w-3.5 text-ht-text-secondary" />}
        </div>
        <ChevronRight className="h-4 w-4 text-ht-text-secondary group-hover:text-ht-primary transition-colors" />
      </div>

      {/* Sparkline */}
      {sparkData.length >= 2 && (
        <div className="mb-3 h-[40px]">
          <ResponsiveContainer width="100%" height={40}>
            <LineChart data={sparkData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <Line type="monotone" dataKey="score" stroke={sparkColor} strokeWidth={2} dot={false} />
              <YAxis domain={[0, 10]} hide />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Latest insight */}
      {latestInsight?.globalSummary ? (
        <p className="text-[12px] text-ht-text-secondary leading-relaxed line-clamp-2 mb-2">
          {latestInsight.globalSummary}
        </p>
      ) : (
        <p className="text-[12px] text-ht-text-secondary italic mb-2">Analyse non disponible</p>
      )}

      {/* Action suggestion */}
      {actionSuggestion && actionSuggestion !== "Aucune action nécessaire" && (
        <p className="text-[11px] font-medium text-amber-700 bg-amber-50 rounded px-2 py-1 inline-block">
          {actionSuggestion}
        </p>
      )}

      {/* Session count */}
      <p className="text-[11px] text-ht-text-secondary mt-2">{sessions.length} session{sessions.length > 1 ? "s" : ""}</p>
    </Link>
  );
}
