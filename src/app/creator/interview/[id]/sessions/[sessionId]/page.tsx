"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, BarChart3, MessageCircle, RefreshCw } from "lucide-react";

interface Message {
  id: string;
  role: string;
  content: string;
  isAnchorQuestion: boolean;
  isCheckpoint: boolean;
  createdAt: string;
}

interface Analysis {
  id: string;
  summary: string;
  rawAnalysis: string;
  createdAt: string;
}

interface SessionData {
  id: string;
  participantName: string | null;
  status: string;
  startedAt: string;
  completedAt: string | null;
  messages: Message[];
  analysis: Analysis | null;
  interviewResource: {
    id: string;
    title: string;
    analysisTemplate: string | null;
  };
}

export default function SessionDetailPage() {
  const params = useParams();
  const interviewId = params.id as string;
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"verbatim" | "analysis">("verbatim");
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [parsedAnalysis, setParsedAnalysis] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`/api/interviews/${interviewId}/sessions/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setSession(data);
        if (data.analysis?.summary) {
          try {
            setParsedAnalysis(JSON.parse(data.analysis.summary));
          } catch {
            // Summary might already be an object
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [interviewId, sessionId]);

  const handleGenerateAnalysis = async () => {
    setGeneratingAnalysis(true);
    try {
      const res = await fetch(`/api/interviews/${interviewId}/sessions/${sessionId}/complete`, {
        method: "POST",
      });
      if (res.ok) {
        // Reload session
        const updated = await fetch(`/api/interviews/${interviewId}/sessions/${sessionId}`).then((r) => r.json());
        setSession(updated);
        if (updated.analysis?.summary) {
          try {
            setParsedAnalysis(JSON.parse(updated.analysis.summary));
          } catch {
            // ignore
          }
        }
        setActiveView("analysis");
      }
    } catch {
      // Silent
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-ht-primary" />
      </div>
    );
  }

  if (!session) {
    return <p className="py-16 text-center text-gray-500">Session introuvable</p>;
  }

  const analysisData = parsedAnalysis as {
    dimensions?: Record<string, unknown>;
    keyVerbatims?: string[];
    globalSummary?: string;
  } | null;

  return (
    <div>
      <Link
        href={`/creator/interview/${interviewId}/sessions`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux sessions
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {session.participantName || "Participant"} — {session.interviewResource.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {new Date(session.startedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" — "}
            {session.messages.length} messages
            {session.status === "completed" && session.completedAt && (
              <> — Durée : {Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)} min</>
            )}
          </p>
        </div>
        {session.status !== "completed" && (
          <button
            onClick={handleGenerateAnalysis}
            disabled={generatingAnalysis || session.messages.length < 4}
            className="flex items-center gap-2 rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-dark disabled:opacity-50"
          >
            {generatingAnalysis ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
            Clôturer et analyser
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveView("verbatim")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeView === "verbatim"
              ? "border-b-2 border-coral text-coral"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <MessageCircle className="h-4 w-4" /> Verbatim
        </button>
        <button
          onClick={() => setActiveView("analysis")}
          disabled={!session.analysis}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 ${
            activeView === "analysis"
              ? "border-b-2 border-coral text-coral"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <BarChart3 className="h-4 w-4" /> Analyse
        </button>
      </div>

      {activeView === "verbatim" && (
        <div className="space-y-3">
          {session.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-coral/10 text-gray-800"
                    : "bg-white border border-gray-200 text-gray-800"
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-400">
                    {msg.role === "assistant" ? "Agent IA" : session.participantName || "Collaborateur"}
                  </span>
                  <span className="text-xs text-gray-300">
                    {new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeView === "analysis" && session.analysis && (
        <div className="space-y-6">
          {/* Global summary */}
          {analysisData?.globalSummary && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-2 text-sm font-medium text-gray-500">Résumé global</h3>
              <p className="text-sm leading-relaxed text-gray-800">{analysisData.globalSummary}</p>
            </div>
          )}

          {/* Dimensions */}
          {analysisData?.dimensions && (
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(analysisData.dimensions).map(([key, value]) => (
                <div key={key} className="rounded-xl border border-gray-200 bg-white p-4">
                  <h4 className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {key.replace(/_/g, " ")}
                  </h4>
                  <div className="text-sm">
                    {typeof value === "number" ? (
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-coral">{value}</span>
                        {value <= 10 && (
                          <div className="flex-1">
                            <div className="h-2 rounded-full bg-gray-100">
                              <div
                                className={`h-2 rounded-full ${
                                  value >= 7 ? "bg-green-500" : value >= 4 ? "bg-amber-500" : "bg-red-500"
                                }`}
                                style={{ width: `${(value / 10) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : Array.isArray(value) ? (
                      <ul className="space-y-1">
                        {(value as string[]).map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-700">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : typeof value === "boolean" ? (
                      <span className={`font-medium ${value ? "text-red-600" : "text-green-600"}`}>
                        {value ? "Oui" : "Non"}
                      </span>
                    ) : typeof value === "string" ? (
                      <span className={`font-medium ${
                        value === "élevé" || value === "elevé" ? "text-red-600" :
                        value === "moyen" ? "text-amber-600" :
                        value === "faible" ? "text-green-600" : "text-gray-800"
                      }`}>
                        {value}
                      </span>
                    ) : (
                      <span className="text-gray-700">{JSON.stringify(value)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Key verbatims */}
          {analysisData?.keyVerbatims && analysisData.keyVerbatims.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-medium text-gray-500">Verbatims clés</h3>
              <div className="space-y-2">
                {analysisData.keyVerbatims.map((v, i) => (
                  <blockquote key={i} className="border-l-2 border-coral/30 pl-3 text-sm italic text-gray-700">
                    &ldquo;{v}&rdquo;
                  </blockquote>
                ))}
              </div>
            </div>
          )}

          {/* Regenerate */}
          {session.status === "completed" && (
            <button
              onClick={handleGenerateAnalysis}
              disabled={generatingAnalysis}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              {generatingAnalysis ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Regénérer l&apos;analyse
            </button>
          )}
        </div>
      )}
    </div>
  );
}
