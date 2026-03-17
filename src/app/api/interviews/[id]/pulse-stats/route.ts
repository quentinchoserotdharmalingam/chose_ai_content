import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface ParsedAnalysis {
  dimensions?: Record<string, unknown>;
  globalSummary?: string;
  keyVerbatims?: string[];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const sessions = await prisma.interviewSession.findMany({
    where: {
      interviewResourceId: id,
      pulseScore: { not: null },
    },
    orderBy: { startedAt: "asc" },
    select: {
      id: true,
      participantName: true,
      pulseScore: true,
      status: true,
      startedAt: true,
      analysis: { select: { id: true, summary: true } },
    },
  });

  // Parse analysis summaries
  function parseAnalysis(summary: string | null): ParsedAnalysis | null {
    if (!summary) return null;
    try {
      return JSON.parse(summary) as ParsedAnalysis;
    } catch {
      return null;
    }
  }

  // Per-participant breakdown
  const byParticipant: Record<
    string,
    Array<{ date: string; score: number; sessionId: string; analysis: ParsedAnalysis | null }>
  > = {};
  let totalScore = 0;
  let count = 0;
  let lowScoreCount = 0;

  // For insights aggregation
  const alertsNegative: Array<{ participant: string; score: number; globalSummary: string; actionSuggestion: string | null; sessionId: string }> = [];
  const alertsPositive: Array<{ participant: string; score: number; globalSummary: string; sessionId: string }> = [];
  const themeCount: Record<string, number> = {};
  const latestByParticipant: Record<string, { globalSummary: string; dimensions: Record<string, unknown>; score: number; sessionId: string }> = {};

  for (const s of sessions) {
    const name = s.participantName || "Anonyme";
    if (!byParticipant[name]) byParticipant[name] = [];
    const score = s.pulseScore!;
    const parsed = parseAnalysis(s.analysis?.summary ?? null);

    byParticipant[name].push({
      date: s.startedAt.toISOString(),
      score,
      sessionId: s.id,
      analysis: parsed,
    });

    totalScore += score;
    count++;
    if (score <= 4) lowScoreCount++;

    // Aggregate insights from analyses
    if (parsed) {
      const sentiment = parsed.dimensions?.sentiment as string | undefined;
      const themes = parsed.dimensions?.themes as string[] | undefined;
      const actionSuggestion = parsed.dimensions?.action_suggérée as string | undefined;
      const summary = parsed.globalSummary || "";

      // Collect alerts
      if (sentiment === "négatif" || score <= 4) {
        alertsNegative.push({
          participant: name,
          score,
          globalSummary: summary,
          actionSuggestion: actionSuggestion || null,
          sessionId: s.id,
        });
      }
      if (sentiment === "positif" && score >= 7) {
        alertsPositive.push({
          participant: name,
          score,
          globalSummary: summary,
          sessionId: s.id,
        });
      }

      // Count themes
      if (themes) {
        for (const t of themes) {
          themeCount[t] = (themeCount[t] || 0) + 1;
        }
      }

      // Track latest analysis per participant (sessions are ordered asc, so last write wins)
      latestByParticipant[name] = {
        globalSummary: summary,
        dimensions: parsed.dimensions || {},
        score,
        sessionId: s.id,
      };
    }
  }

  // Compute trend (compare last half vs first half)
  const scores = sessions.map((s) => s.pulseScore!);
  let trend: "up" | "down" | "stable" = "stable";
  if (scores.length >= 4) {
    const mid = Math.floor(scores.length / 2);
    const recentAvg = scores.slice(mid).reduce((a, b) => a + b, 0) / (scores.length - mid);
    const olderAvg = scores.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
    if (recentAvg > olderAvg + 0.5) trend = "up";
    else if (recentAvg < olderAvg - 0.5) trend = "down";
  }

  // Top themes sorted by frequency
  const topThemes = Object.entries(themeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme, count]) => ({ theme, count }));

  return NextResponse.json({
    participants: Object.entries(byParticipant).map(([name, data]) => ({ name, sessions: data })),
    aggregate: {
      average: count > 0 ? Math.round((totalScore / count) * 10) / 10 : null,
      trend,
      count,
      lowScoreCount,
    },
    timeline: sessions.map((s) => ({
      date: s.startedAt.toISOString(),
      score: s.pulseScore,
      participant: s.participantName || "Anonyme",
      sessionId: s.id,
    })),
    insights: {
      alertsNegative: alertsNegative.slice(-3).reverse(),
      alertsPositive: alertsPositive.slice(-3).reverse(),
      topThemes,
      latestByParticipant,
    },
  });
}
