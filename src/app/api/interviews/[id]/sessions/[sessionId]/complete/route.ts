import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInterviewAnalysis, generatePulseAnalysis } from "@/lib/interview";
import type { AnalysisTemplateDimension } from "@/types";
import { DEFAULT_ANALYSIS_TEMPLATES } from "@/types";

export const maxDuration = 120;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const { id, sessionId } = await params;

  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      interviewResource: true,
    },
  });

  if (!session || session.interviewResourceId !== id) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  if (session.status === "completed") {
    return NextResponse.json({ error: "Session déjà terminée" }, { status: 400 });
  }

  // Mark session as completed immediately
  await prisma.interviewSession.update({
    where: { id: sessionId },
    data: { status: "completed", completedAt: new Date() },
  });

  // Launch analysis generation in background (don't block the response)
  const messages = session.messages.map((m) => ({ role: m.role, content: m.content }));

  if (messages.length >= 2) {
    const isPulse = session.interviewResource.type === "pulse";

    if (isPulse) {
      // Pulse analysis — lighter, uses Haiku
      generatePulseAnalysis(
        session.interviewResource.pulseQuestion || "",
        session.pulseScore || 5,
        messages
      )
        .then(({ summary, rawAnalysis }) =>
          prisma.interviewAnalysis.create({ data: { sessionId, summary, rawAnalysis } })
        )
        .catch((err) => console.error("Background pulse analysis failed:", err));
    } else {
      // Interview analysis
      let analysisTemplate: AnalysisTemplateDimension[];
      if (session.interviewResource.analysisTemplate) {
        analysisTemplate = JSON.parse(session.interviewResource.analysisTemplate);
      } else {
        const theme = session.interviewResource.theme as keyof typeof DEFAULT_ANALYSIS_TEMPLATES;
        analysisTemplate = DEFAULT_ANALYSIS_TEMPLATES[theme] || DEFAULT_ANALYSIS_TEMPLATES.onboarding;
      }

      generateInterviewAnalysis(messages, analysisTemplate)
        .then(({ summary, rawAnalysis }) =>
          prisma.interviewAnalysis.create({ data: { sessionId, summary, rawAnalysis } })
        )
        .catch((err) => console.error("Background analysis generation failed:", err));
    }
  }

  return NextResponse.json({ status: "completed" }, { status: 200 });
}
