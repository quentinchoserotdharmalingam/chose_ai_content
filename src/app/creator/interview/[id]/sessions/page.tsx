"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, MessageCircle, BarChart3 } from "lucide-react";

interface Session {
  id: string;
  participantName: string | null;
  status: string;
  startedAt: string;
  completedAt: string | null;
  analysis: { id: string; createdAt: string } | null;
  _count: { messages: number };
}

interface InterviewData {
  id: string;
  title: string;
  theme: string;
  sessions: Session[];
}

export default function InterviewSessionsPage() {
  const params = useParams();
  const interviewId = params.id as string;
  const [data, setData] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/interviews/${interviewId}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [interviewId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-ht-primary" />
      </div>
    );
  }

  if (!data) {
    return <p className="py-16 text-center text-gray-500">Interview introuvable</p>;
  }

  const statusStyles: Record<string, { label: string; color: string }> = {
    in_progress: { label: "En cours", color: "text-amber-600 bg-amber-50" },
    completed: { label: "Terminé", color: "text-green-600 bg-green-50" },
    abandoned: { label: "Abandonné", color: "text-gray-500 bg-gray-100" },
  };

  return (
    <div>
      <Link href="/creator" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Retour au dashboard
      </Link>

      <h1 className="mb-1 text-xl font-semibold">{data.title}</h1>
      <p className="mb-6 text-sm text-gray-500">{data.sessions.length} session(s)</p>

      {data.sessions.length === 0 ? (
        <div className="py-16 text-center">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">Aucune session pour cette interview</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.sessions.map((session) => {
            const status = statusStyles[session.status] || statusStyles.in_progress;
            return (
              <Link
                key={session.id}
                href={`/creator/interview/${interviewId}/sessions/${session.id}`}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium">{session.participantName || "Participant anonyme"}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(session.startedAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" — "}
                    {session._count.messages} message(s)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {session.analysis && (
                    <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-600">
                      <BarChart3 className="h-3 w-3" /> Analyse
                    </span>
                  )}
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
