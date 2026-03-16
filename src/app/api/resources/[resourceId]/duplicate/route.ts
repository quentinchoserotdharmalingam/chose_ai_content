import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await params;

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    include: { contents: true },
  });

  if (!resource) {
    return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 });
  }

  // Create duplicate resource
  const duplicate = await prisma.resource.create({
    data: {
      title: resource.title ? `${resource.title} (copie)` : "Sans titre (copie)",
      description: resource.description,
      extractedText: resource.extractedText,
      analysis: resource.analysis,
      objective: resource.objective,
      tone: resource.tone,
      language: resource.language,
      enabledFormats: resource.enabledFormats,
      status: "generated",
    },
  });

  // Duplicate format contents
  for (const content of resource.contents) {
    await prisma.formatContent.create({
      data: {
        resourceId: duplicate.id,
        format: content.format,
        content: content.content,
        version: 1,
      },
    });
  }

  // Fetch with relations for response
  const result = await prisma.resource.findUnique({
    where: { id: duplicate.id },
    include: {
      contents: { select: { format: true } },
      sessions: { select: { completed: true } },
    },
  });

  return NextResponse.json(result, { status: 201 });
}
