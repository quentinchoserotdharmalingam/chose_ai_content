import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

  // Per-participant breakdown
  const byParticipant: Record<string, Array<{ date: string; score: number; sessionId: string }>> = {};
  let totalScore = 0;
  let count = 0;
  let lowScoreCount = 0;

  for (const s of sessions) {
    const name = s.participantName || "Anonyme";
    if (!byParticipant[name]) byParticipant[name] = [];
    const score = s.pulseScore!;
    byParticipant[name].push({
      date: s.startedAt.toISOString(),
      score,
      sessionId: s.id,
    });
    totalScore += score;
    count++;
    if (score <= 4) lowScoreCount++;
  }

  // Compute trend (compare last 5 vs previous 5)
  const scores = sessions.map((s) => s.pulseScore!);
  let trend: "up" | "down" | "stable" = "stable";
  if (scores.length >= 4) {
    const mid = Math.floor(scores.length / 2);
    const recentAvg = scores.slice(mid).reduce((a, b) => a + b, 0) / (scores.length - mid);
    const olderAvg = scores.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
    if (recentAvg > olderAvg + 0.5) trend = "up";
    else if (recentAvg < olderAvg - 0.5) trend = "down";
  }

  return NextResponse.json({
    participants: Object.entries(byParticipant).map(([name, data]) => ({ name, sessions: data })),
    aggregate: {
      average: count > 0 ? Math.round((totalScore / count) * 10) / 10 : null,
      trend,
      count,
      lowScoreCount,
    },
    // Timeline for chart (all scores chronologically)
    timeline: sessions.map((s) => ({
      date: s.startedAt.toISOString(),
      score: s.pulseScore,
      participant: s.participantName || "Anonyme",
    })),
  });
}
