import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const interview = await prisma.interviewResource.findUnique({
    where: { id },
    include: {
      sessions: {
        orderBy: { startedAt: "desc" },
        include: {
          analysis: { select: { id: true, createdAt: true } },
          _count: { select: { messages: true } },
        },
      },
    },
  });

  if (!interview) {
    return NextResponse.json({ error: "Interview introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    ...interview,
    anchorQuestions: JSON.parse(interview.anchorQuestions),
    checkpointQuestions: JSON.parse(interview.checkpointQuestions),
    analysisTemplate: interview.analysisTemplate ? JSON.parse(interview.analysisTemplate) : null,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  const directFields = ["title", "description", "theme", "tone", "scopeIn", "scopeOut", "targetDurationMinutes", "maxQuestions", "status"];

  for (const field of directFields) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  if (body.anchorQuestions !== undefined) data.anchorQuestions = JSON.stringify(body.anchorQuestions);
  if (body.checkpointQuestions !== undefined) data.checkpointQuestions = JSON.stringify(body.checkpointQuestions);
  if (body.analysisTemplate !== undefined) data.analysisTemplate = JSON.stringify(body.analysisTemplate);

  const interview = await prisma.interviewResource.update({
    where: { id },
    data,
  });

  return NextResponse.json(interview);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.interviewResource.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
