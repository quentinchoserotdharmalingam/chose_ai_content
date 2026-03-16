import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInterviewAnalysis } from "@/lib/interview";
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

  // Mark session as completed
  await prisma.interviewSession.update({
    where: { id: sessionId },
    data: { status: "completed", completedAt: new Date() },
  });

  // Determine analysis template
  let analysisTemplate: AnalysisTemplateDimension[];
  if (session.interviewResource.analysisTemplate) {
    analysisTemplate = JSON.parse(session.interviewResource.analysisTemplate);
  } else {
    const theme = session.interviewResource.theme as keyof typeof DEFAULT_ANALYSIS_TEMPLATES;
    analysisTemplate = DEFAULT_ANALYSIS_TEMPLATES[theme] || DEFAULT_ANALYSIS_TEMPLATES.onboarding;
  }

  // Generate analysis
  const messages = session.messages.map((m) => ({ role: m.role, content: m.content }));

  if (messages.length < 2) {
    return NextResponse.json({ error: "Pas assez de messages pour générer une analyse" }, { status: 400 });
  }

  const { summary, rawAnalysis } = await generateInterviewAnalysis(messages, analysisTemplate);

  const analysis = await prisma.interviewAnalysis.create({
    data: {
      sessionId,
      summary,
      rawAnalysis,
    },
  });

  return NextResponse.json(analysis, { status: 201 });
}
