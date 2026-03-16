import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { suggestAnalysisTemplate } from "@/lib/interview";

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

  const suggestions = await suggestAnalysisTemplate(
    interview.theme,
    undefined,
    interview.scopeIn || undefined
  );

  return NextResponse.json(suggestions);
}
