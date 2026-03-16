"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  Trash2,
  Eye,
  MessageSquare,
  Activity,
  Plus,
  ChevronDown,
} from "lucide-react";
import { INTERVIEW_THEME_META, PULSE_FREQUENCY_META, type InterviewTheme, type PulseFrequency } from "@/types";

type TabType = "interview" | "pulse";

interface InterviewResource {
  id: string;
  title: string;
  description: string | null;
  type: string;
  theme: string;
  tone: string;
  status: string;
  pulseFrequency: string | null;
  createdAt: string;
  sessions: Array<{ id: string; status: string; participantName: string | null; pulseScore: number | null }>;
}

export default function InterviewDashboard() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<InterviewResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabType>("interview");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/interviews")
      .then((res) => res.json())
      .then((data) => {
        setInterviews(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette interview ?")) return;
    await fetch(`/api/interviews/${id}`, { method: "DELETE" });
    setInterviews((prev) => prev.filter((i) => i.id !== id));
    setOpenMenu(null);
  };

  const themeLabel = (theme: string) => {
    const meta = INTERVIEW_THEME_META[theme as InterviewTheme];
    return meta ? `${meta.icon} ${meta.label}` : theme;
  };

  const getAvgScore = (interview: InterviewResource) => {
    const scores = interview.sessions
      .filter((s) => s.pulseScore !== null && s.status === "completed")
      .map((s) => s.pulseScore!);
    if (scores.length === 0) return null;
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
  };

  const filtered = interviews.filter((i) => {
    const matchesTab = (i.type || "interview") === tab;
    if (!matchesTab) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return i.title.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-ht-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-[22px] sm:text-[28px] font-medium tracking-[-0.02em] text-ht-text">
          Interview IA
        </h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ht-text-secondary" />
            <input
              type="text"
              placeholder="Rechercher"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full sm:w-[200px] rounded-lg border border-ht-border bg-white pl-9 pr-3 text-[13px] text-ht-text placeholder:text-ht-text-secondary transition-all duration-200 focus:border-ht-border-secondary focus:outline-none focus:shadow-[var(--focus-ring)]"
            />
          </div>
          <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ht-border text-ht-text-secondary transition-all duration-200 hover:bg-ht-fill-secondary hover:text-ht-text">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-ht-primary px-4 sm:px-5 text-[13px] font-semibold text-white shadow-ht-1 transition-all duration-200 hover:bg-ht-primary-dark"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouveau</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showAddMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
                <div className="absolute right-0 z-50 mt-1 w-52 rounded-lg border border-ht-border bg-white py-1 shadow-ht-3">
                  <Link
                    href="/creator/interview/new"
                    className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-ht-text hover:bg-ht-fill-secondary"
                    onClick={() => setShowAddMenu(false)}
                  >
                    <MessageSquare className="h-4 w-4 text-ht-text-secondary" />
                    Interview IA
                  </Link>
                  <Link
                    href="/creator/interview/new-pulse"
                    className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-ht-text hover:bg-ht-fill-secondary"
                    onClick={() => setShowAddMenu(false)}
                  >
                    <Activity className="h-4 w-4 text-ht-text-secondary" />
                    Pulse IA
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-ht-fill-secondary p-1">
        <button
          onClick={() => setTab("interview")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-all ${
            tab === "interview"
              ? "bg-white text-ht-text shadow-sm"
              : "text-ht-text-secondary hover:text-ht-text"
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Interviews
        </button>
        <button
          onClick={() => setTab("pulse")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-all ${
            tab === "pulse"
              ? "bg-white text-ht-text shadow-sm"
              : "text-ht-text-secondary hover:text-ht-text"
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          Pulses
        </button>
      </div>

      <p className="mb-5 text-[13px] font-medium text-ht-text-secondary">
        {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          {tab === "pulse" ? (
            <Activity className="mx-auto mb-4 h-12 w-12 text-ht-text-inactive" />
          ) : (
            <MessageSquare className="mx-auto mb-4 h-12 w-12 text-ht-text-inactive" />
          )}
          <p className="text-[13px] text-ht-text-secondary">
            {search
              ? "Aucun résultat pour cette recherche"
              : tab === "pulse"
              ? "Aucun pulse pour le moment"
              : "Aucune interview IA pour le moment"}
          </p>
          {!search && (
            <Link
              href={tab === "pulse" ? "/creator/interview/new-pulse" : "/creator/interview/new"}
              className="mt-4 inline-block rounded-lg border border-ht-border-secondary px-4 py-2 text-[13px] font-medium text-ht-text transition-all duration-200 hover:bg-ht-fill-secondary"
            >
              {tab === "pulse" ? "Créer mon premier pulse" : "Créer ma première interview IA"}
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden" ref={menuRef}>
            {filtered.map((interview) => {
              const completedSessions = interview.sessions.filter((s) => s.status === "completed").length;
              return (
                <div key={interview.id} className="rounded-xl border border-ht-border bg-white p-4">
                  <div className="flex items-start justify-between">
                    <Link href={`/creator/interview/${interview.id}`} className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-ht-text truncate">{interview.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-[12px] text-ht-text-secondary">{themeLabel(interview.theme)}</span>
                        {tab === "pulse" && interview.pulseFrequency && (
                          <span className="text-[12px] text-ht-text-secondary">
                            {PULSE_FREQUENCY_META[interview.pulseFrequency as PulseFrequency]?.label}
                          </span>
                        )}
                        {tab === "pulse" && getAvgScore(interview) !== null && (
                          <span className="text-[12px] font-medium text-ht-primary">
                            Moy. {getAvgScore(interview)}/10
                          </span>
                        )}
                        <span className="text-[12px] text-ht-text-secondary">{completedSessions}/{interview.sessions.length} sessions</span>
                        <span className={`text-[12px] font-medium ${interview.status === "published" ? "text-ht-success" : "text-ht-text-secondary"}`}>
                          {interview.status === "published" ? "Publié" : "Brouillon"}
                        </span>
                      </div>
                    </Link>
                    <div className="relative ml-2">
                      <button
                        onClick={() => setOpenMenu(openMenu === interview.id ? null : interview.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-ht-text-secondary hover:bg-ht-fill-secondary"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {openMenu === interview.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                          <div className="absolute right-0 z-50 w-52 rounded-lg border border-ht-border bg-white py-1 shadow-ht-3 top-full mt-1">
                            {interview.status === "published" && (
                              <Link href={`/${(interview.type || "interview") === "pulse" ? "pulse" : "interview"}/${interview.id}`} className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-ht-text hover:bg-ht-fill-secondary" onClick={() => setOpenMenu(null)}>
                                <Eye className="h-4 w-4 text-ht-text-secondary" /> Tester
                              </Link>
                            )}
                            {interview.sessions.length > 0 && (
                              <Link href={`/creator/interview/${interview.id}/sessions`} className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-ht-text hover:bg-ht-fill-secondary" onClick={() => setOpenMenu(null)}>
                                <Search className="h-4 w-4 text-ht-text-secondary" /> Sessions
                              </Link>
                            )}
                            <button className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-ht-error hover:bg-ht-error-warm" onClick={() => handleDelete(interview.id)}>
                              <Trash2 className="h-4 w-4" /> Supprimer
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-visible rounded-xl border border-ht-border bg-white">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-ht-border">
                  <th className="border-r border-ht-border px-5 py-3 text-left text-[12px] font-medium text-ht-text-secondary">Nom</th>
                  <th className="border-r border-ht-border px-5 py-3 text-left text-[12px] font-medium text-ht-text-secondary">Thème</th>
                  {tab === "pulse" && (
                    <>
                      <th className="border-r border-ht-border px-5 py-3 text-left text-[12px] font-medium text-ht-text-secondary">Fréquence</th>
                      <th className="border-r border-ht-border px-5 py-3 text-left text-[12px] font-medium text-ht-text-secondary">Score moy.</th>
                    </>
                  )}
                  <th className="border-r border-ht-border px-5 py-3 text-left text-[12px] font-medium text-ht-text-secondary">Sessions</th>
                  <th className="border-r border-ht-border px-5 py-3 text-left text-[12px] font-medium text-ht-text-secondary">Statut</th>
                  <th className="w-14 px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((interview, idx) => {
                  const isLast = idx === filtered.length - 1;
                  const completedSessions = interview.sessions.filter((s) => s.status === "completed").length;
                  return (
                    <tr
                      key={interview.id}
                      onClick={() => router.push(`/creator/interview/${interview.id}`)}
                      className={`cursor-pointer transition-all duration-200 hover:bg-ht-fill-container ${!isLast ? "border-b border-ht-border" : ""}`}
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-[13px] font-medium text-ht-text">{interview.title}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[13px] text-ht-text">{themeLabel(interview.theme)}</span>
                      </td>
                      {tab === "pulse" && (
                        <>
                          <td className="px-5 py-3.5">
                            <span className="text-[13px] text-ht-text">
                              {interview.pulseFrequency
                                ? PULSE_FREQUENCY_META[interview.pulseFrequency as PulseFrequency]?.label || "—"
                                : "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {getAvgScore(interview) !== null ? (
                              <span className="text-[13px] font-medium text-ht-primary">{getAvgScore(interview)}/10</span>
                            ) : (
                              <span className="text-[13px] text-ht-text-secondary">—</span>
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-5 py-3.5">
                        <span className="text-[13px] text-ht-text">{completedSessions}/{interview.sessions.length}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[13px] font-medium ${interview.status === "published" ? "text-ht-success" : "text-ht-text-secondary"}`}>
                          {interview.status === "published" ? "Publié" : "Brouillon"}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenMenu(openMenu === interview.id ? null : interview.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-ht-text-secondary transition-all duration-200 hover:bg-ht-fill-secondary hover:text-ht-text"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {openMenu === interview.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                              <div className="absolute right-0 z-50 w-52 rounded-lg border border-ht-border bg-white py-1 shadow-ht-3 top-full mt-1">
                                {interview.status === "published" && (
                                  <Link href={`/${(interview.type || "interview") === "pulse" ? "pulse" : "interview"}/${interview.id}`} className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-ht-text hover:bg-ht-fill-secondary" onClick={() => setOpenMenu(null)}>
                                    <Eye className="h-4 w-4 text-ht-text-secondary" /> Tester comme collaborateur
                                  </Link>
                                )}
                                {interview.sessions.length > 0 && (
                                  <Link href={`/creator/interview/${interview.id}/sessions`} className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-ht-text hover:bg-ht-fill-secondary" onClick={() => setOpenMenu(null)}>
                                    <Search className="h-4 w-4 text-ht-text-secondary" /> Voir les sessions
                                  </Link>
                                )}
                                <button className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-ht-error hover:bg-ht-error-warm" onClick={() => handleDelete(interview.id)}>
                                  <Trash2 className="h-4 w-4" /> Supprimer
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
