import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || undefined;

  const interviews = await prisma.interviewResource.findMany({
    where: type ? { type } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      sessions: {
        select: { id: true, status: true, startedAt: true, completedAt: true, participantName: true, pulseScore: true },
      },
    },
  });
  return NextResponse.json(interviews);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const interview = await prisma.interviewResource.create({
    data: {
      title: body.title || (body.type === "pulse" ? "Nouveau pulse" : "Nouvelle interview"),
      description: body.description || null,
      type: body.type || "interview",
      theme: body.theme || "onboarding",
      tone: body.tone || "bienveillant",
      scopeIn: body.scopeIn || null,
      scopeOut: body.scopeOut || null,
      anchorQuestions: JSON.stringify(body.anchorQuestions || []),
      checkpointQuestions: JSON.stringify(body.checkpointQuestions || []),
      targetDurationMinutes: body.targetDurationMinutes || (body.type === "pulse" ? 3 : 15),
      maxQuestions: body.maxQuestions || (body.type === "pulse" ? 3 : 25),
      analysisTemplate: body.analysisTemplate ? JSON.stringify(body.analysisTemplate) : null,
      status: body.status || "draft",
      pulseQuestion: body.pulseQuestion || null,
      pulseFrequency: body.pulseFrequency || null,
      pulseMaxFollowUps: body.pulseMaxFollowUps ?? 3,
    },
  });

  return NextResponse.json(interview, { status: 201 });
}
