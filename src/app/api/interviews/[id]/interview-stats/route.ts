import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { AnalysisTemplateDimension } from "@/types";

interface ParsedAnalysis {
  dimensions?: Record<string, unknown>;
  globalSummary?: string;
  keyVerbatims?: string[];
}

function parseAnalysis(summary: string | null): ParsedAnalysis | null {
  if (!summary) return null;
  try {
    return JSON.parse(summary) as ParsedAnalysis;
  } catch {
    return null;
  }
}

// Dimension keys where "élevé" is bad (risk dimensions)
function isRiskDimension(key: string): boolean {
  return /risk|risque|departure|départ/.test(key);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch interview resource for template
  const interview = await prisma.interviewResource.findUnique({
    where: { id },
    select: { analysisTemplate: true, theme: true },
  });

  if (!interview) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let template: AnalysisTemplateDimension[] = [];
  if (interview.analysisTemplate) {
    try {
      template = JSON.parse(interview.analysisTemplate as string) as AnalysisTemplateDimension[];
    } catch {
      template = [];
    }
  }

  // Fetch all sessions (completed + in_progress for total count)
  const sessions = await prisma.interviewSession.findMany({
    where: { interviewResourceId: id },
    orderBy: { startedAt: "asc" },
    select: {
      id: true,
      participantName: true,
      status: true,
      startedAt: true,
      completedAt: true,
      analysis: { select: { id: true, summary: true } },
    },
  });

  const totalCount = sessions.length;
  const completedSessions = sessions.filter((s: { status: string }) => s.status === "completed");
  const completedCount = completedSessions.length;

  // Parse all analyses
  const participants: Array<{
    name: string;
    sessionId: string;
    completedAt: string | null;
    dimensions: Record<string, unknown>;
    globalSummary: string;
    keyVerbatims: string[];
  }> = [];

  for (const s of completedSessions) {
    const parsed = parseAnalysis(s.analysis?.summary ?? null);
    if (!parsed) continue;

    participants.push({
      name: s.participantName || "Anonyme",
      sessionId: s.id,
      completedAt: s.completedAt?.toISOString() ?? null,
      dimensions: parsed.dimensions || {},
      globalSummary: parsed.globalSummary || "",
      keyVerbatims: parsed.keyVerbatims || [],
    });
  }

  // Aggregate dimensions based on template
  const dimensionAggregates: Record<string, {
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
  }> = {};

  for (const dim of template) {
    const values: Array<{ participant: string; value: unknown; sessionId: string }> = [];

    for (const p of participants) {
      const val = p.dimensions[dim.key];
      if (val !== undefined && val !== null) {
        values.push({ participant: p.name, value: val, sessionId: p.sessionId });
      }
    }

    const agg: typeof dimensionAggregates[string] = { type: dim.type, label: dim.label, values };

    if (dim.type === "score_1_10") {
      const nums = values.map((v) => v.value as number).filter((n) => typeof n === "number");
      if (nums.length > 0) {
        agg.average = Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
        agg.min = Math.min(...nums);
        agg.max = Math.max(...nums);
      }
    }

    if (dim.type === "score_low_med_high") {
      const dist = { faible: 0, moyen: 0, élevé: 0 };
      for (const v of values) {
        const val = (v.value as string).toLowerCase();
        if (val === "faible") dist.faible++;
        else if (val === "moyen") dist.moyen++;
        else if (val === "élevé" || val === "elevé") dist.élevé++;
      }
      agg.distribution = dist;
    }

    if (dim.type === "list") {
      const itemCount: Record<string, number> = {};
      for (const v of values) {
        const items = v.value as string[];
        if (Array.isArray(items)) {
          for (const item of items) {
            itemCount[item] = (itemCount[item] || 0) + 1;
          }
        }
      }
      agg.topItems = Object.entries(itemCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([item, count]) => ({ item, count }));
    }

    if (dim.type === "boolean") {
      let trueCount = 0;
      let falseCount = 0;
      for (const v of values) {
        if (v.value === true) trueCount++;
        else falseCount++;
      }
      agg.trueCount = trueCount;
      agg.falseCount = falseCount;
    }

    dimensionAggregates[dim.key] = agg;
  }

  // Compute alerts
  const alerts: Array<{ participant: string; sessionId: string; reason: string }> = [];
  const positiveSignals: Array<{ participant: string; sessionId: string; summary: string }> = [];

  for (const p of participants) {
    const reasons: string[] = [];
    let isPositive = true;

    for (const dim of template) {
      const val = p.dimensions[dim.key];
      if (dim.type === "score_1_10" && typeof val === "number" && val <= 4) {
        reasons.push(`${dim.label} : ${val}/10`);
        isPositive = false;
      }
      if (dim.type === "score_low_med_high") {
        const strVal = (val as string)?.toLowerCase();
        if (isRiskDimension(dim.key)) {
          if (strVal === "élevé" || strVal === "elevé") {
            reasons.push(`${dim.label} : élevé`);
            isPositive = false;
          }
        } else {
          if (strVal === "faible") {
            reasons.push(`${dim.label} : faible`);
            isPositive = false;
          }
        }
      }
    }

    if (reasons.length > 0) {
      alerts.push({ participant: p.name, sessionId: p.sessionId, reason: reasons.join(" · ") });
    } else if (isPositive) {
      positiveSignals.push({ participant: p.name, sessionId: p.sessionId, summary: p.globalSummary });
    }
  }

  // Aggregate list dimensions for themes
  const positiveDim = dimensionAggregates["positive_themes"];
  const negativeDim = dimensionAggregates["negative_themes"];
  const suggestionsDim = dimensionAggregates["suggestions"];

  // Collect all verbatims
  const allVerbatims: Array<{ quote: string; participant: string; sessionId: string }> = [];
  for (const p of participants) {
    for (const q of p.keyVerbatims) {
      allVerbatims.push({ quote: q, participant: p.name, sessionId: p.sessionId });
    }
  }

  return NextResponse.json({
    participants,
    dimensionAggregates,
    insights: {
      alerts,
      positiveSignals,
      topPositiveThemes: positiveDim?.topItems || [],
      topNegativeThemes: negativeDim?.topItems || [],
      topSuggestions: suggestionsDim?.topItems || [],
      allVerbatims: allVerbatims.slice(0, 8),
    },
    aggregate: { completedCount, totalCount },
  });
}
