import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateFormatContent } from "@/lib/claude";
import type { FormatSlug } from "@/types";

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await params;
  const body = await request.json();
  const format: FormatSlug = body.format;
  const instructions: string | undefined = body.instructions;

  if (!format) {
    return NextResponse.json({ error: "format est requis" }, { status: 400 });
  }

  if (format === "chat") {
    return NextResponse.json({ format, content: null, dynamic: true });
  }

  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) {
    return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 });
  }

  if (!resource.extractedText || !resource.objective) {
    return NextResponse.json(
      { error: "Le document doit être analysé et un objectif défini" },
      { status: 400 }
    );
  }

  // Build the objective with optional instructions
  const objective = instructions
    ? `${resource.objective}\n\nInstructions supplémentaires du créateur : ${instructions}`
    : resource.objective;

  try {
    const content = await generateFormatContent(
      resource.extractedText,
      objective,
      format,
      resource.tone
    );

    await prisma.formatContent.upsert({
      where: { resourceId_format: { resourceId, format } },
      create: { resourceId, format, content: JSON.stringify(content) },
      update: { content: JSON.stringify(content), version: { increment: 1 } },
    });

    return NextResponse.json({ format, content });
  } catch (error) {
    console.error(`Regeneration error for ${format}:`, error);
    return NextResponse.json(
      { error: `Erreur lors de la regénération du format ${format}` },
      { status: 500 }
    );
  }
}
