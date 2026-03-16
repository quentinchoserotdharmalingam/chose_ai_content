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
} from "lucide-react";
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

interface PulseStats {
  aggregate: { average: number | null; trend: "up" | "down" | "stable"; count: number; lowScoreCount: number };
  timeline: Array<{ date: string; score: number; participant: string }>;
  participants: Array<{ name: string; sessions: Array<{ date: string; score: number }> }>;
}

export default function InterviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [data, setData] = useState<InterviewDetail | null>(null);
  const [pulseStats, setPulseStats] = useState<PulseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/interviews/${interviewId}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
        // Fetch pulse stats if pulse
        if (d.type === "pulse") {
          fetch(`/api/interviews/${interviewId}/pulse-stats`)
            .then((res) => res.json())
            .then(setPulseStats)
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

      {/* Pulse score chart placeholder — will be replaced by Recharts */}
      {isPulse && pulseStats && pulseStats.timeline.length > 0 && (
        <div className="mb-6 rounded-xl border border-ht-border bg-white p-5" id="pulse-chart-container">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-ht-text-secondary" />
            <h2 className="text-[14px] font-semibold text-ht-text">Évolution des scores</h2>
          </div>
          <PulseChart timeline={pulseStats.timeline} />
        </div>
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

// Pulse score evolution chart component
function PulseChart({ timeline }: { timeline: Array<{ date: string; score: number; participant: string }> }) {
  if (timeline.length === 0) return null;

  // Simple SVG chart — no external deps needed for basic rendering
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 35 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = timeline.map((t, i) => ({
    x: padding.left + (timeline.length > 1 ? (i / (timeline.length - 1)) * chartW : chartW / 2),
    y: padding.top + chartH - ((t.score - 1) / 9) * chartH,
    score: t.score,
    participant: t.participant,
    date: new Date(t.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
  }));

  const pathD = points.length > 1
    ? `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")}`
    : "";

  // Color based on average
  const avg = timeline.reduce((a, t) => a + t.score, 0) / timeline.length;
  const lineColor = avg >= 7 ? "#22c55e" : avg >= 5 ? "#f59e0b" : "#ef4444";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {/* Y axis labels */}
      {[1, 5, 10].map((v) => {
        const y = padding.top + chartH - ((v - 1) / 9) * chartH;
        return (
          <g key={v}>
            <text x={padding.left - 8} y={y + 4} textAnchor="end" className="text-[11px]" fill="#9ca3af">{v}</text>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f3f4f6" strokeWidth={1} />
          </g>
        );
      })}

      {/* Line */}
      {pathD && (
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      )}

      {/* Dots */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill={lineColor} stroke="white" strokeWidth={2} />
          {/* X label — show for first, last, every 5th */}
          {(i === 0 || i === points.length - 1 || i % 5 === 0) && (
            <text x={p.x} y={height - 5} textAnchor="middle" className="text-[10px]" fill="#9ca3af">
              {p.date}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
