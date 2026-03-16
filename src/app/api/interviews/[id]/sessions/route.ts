import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessions = await prisma.interviewSession.findMany({
    where: { interviewResourceId: id },
    orderBy: { startedAt: "desc" },
    include: {
      analysis: { select: { id: true, createdAt: true } },
      _count: { select: { messages: true } },
    },
  });
  return NextResponse.json(sessions);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const interview = await prisma.interviewResource.findUnique({ where: { id } });
  if (!interview || interview.status !== "published") {
    return NextResponse.json({ error: "Interview introuvable ou non publiée" }, { status: 404 });
  }

  // Check if there's an existing in-progress session for this participant
  if (body.participantName) {
    const existingSession = await prisma.interviewSession.findFirst({
      where: {
        interviewResourceId: id,
        participantName: body.participantName,
        status: "in_progress",
      },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (existingSession) {
      return NextResponse.json(existingSession);
    }
  }

  const session = await prisma.interviewSession.create({
    data: {
      interviewResourceId: id,
      participantName: body.participantName || null,
    },
    include: {
      messages: true,
    },
  });

  return NextResponse.json(session, { status: 201 });
}
