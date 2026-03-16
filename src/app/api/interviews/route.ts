import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const interviews = await prisma.interviewResource.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      sessions: {
        select: { id: true, status: true, startedAt: true, completedAt: true, participantName: true },
      },
    },
  });
  return NextResponse.json(interviews);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const interview = await prisma.interviewResource.create({
    data: {
      title: body.title || "Nouvelle interview",
      description: body.description || null,
      theme: body.theme || "onboarding",
      tone: body.tone || "bienveillant",
      scopeIn: body.scopeIn || null,
      scopeOut: body.scopeOut || null,
      anchorQuestions: JSON.stringify(body.anchorQuestions || []),
      checkpointQuestions: JSON.stringify(body.checkpointQuestions || []),
      targetDurationMinutes: body.targetDurationMinutes || 15,
      maxQuestions: body.maxQuestions || 25,
      analysisTemplate: body.analysisTemplate ? JSON.stringify(body.analysisTemplate) : null,
      status: body.status || "draft",
    },
  });

  return NextResponse.json(interview, { status: 201 });
}
