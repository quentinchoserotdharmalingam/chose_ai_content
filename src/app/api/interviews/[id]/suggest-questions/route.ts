import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { suggestQuestions } from "@/lib/interview";

export const maxDuration = 30;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const interview = await prisma.interviewResource.findUnique({ where: { id } });
  if (!interview) {
    return NextResponse.json({ error: "Interview introuvable" }, { status: 404 });
  }

  const result = await suggestQuestions(
    interview.theme,
    undefined,
    interview.scopeIn || undefined,
    interview.scopeOut || undefined,
    interview.tone
  );

  return NextResponse.json(result);
}
