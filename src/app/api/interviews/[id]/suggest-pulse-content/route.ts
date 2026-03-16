import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { suggestPulseContent } from "@/lib/interview";

export const maxDuration = 30;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const interview = await prisma.interviewResource.findUnique({ where: { id } });
  if (!interview) {
    return NextResponse.json({ error: "Pulse introuvable" }, { status: 404 });
  }

  const result = await suggestPulseContent(
    interview.theme,
    interview.tone,
    interview.pulseFrequency || undefined
  );

  return NextResponse.json(result);
}
