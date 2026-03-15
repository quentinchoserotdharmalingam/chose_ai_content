import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateFormatContent } from "@/lib/claude";
import type { FormatSlug } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await params;
  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });

  if (!resource) {
    return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 });
  }

  if (!resource.extractedText || !resource.objective) {
    return NextResponse.json(
      { error: "Le document doit être analysé et un objectif défini avant la génération" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const formats: FormatSlug[] = body.formats || ["synthese", "flashcards", "module", "scenarios"];

  const results: Record<string, object> = {};
  const errors: Record<string, string> = {};

  for (const format of formats) {
    if (format === "chat") continue;

    try {
      const content = await generateFormatContent(
        resource.extractedText,
        resource.objective,
        format,
        resource.tone
      );

      await prisma.formatContent.upsert({
        where: { resourceId_format: { resourceId, format } },
        create: { resourceId, format, content: JSON.stringify(content) },
        update: { content: JSON.stringify(content), version: { increment: 1 } },
      });

      results[format] = content;
    } catch (error) {
      console.error(`Generation error for ${format}:`, error);
      errors[format] = `Erreur lors de la génération du format ${format}`;
    }
  }

  const enabledFormats = formats.filter((f) => f === "chat" || results[f]);

  await prisma.resource.update({
    where: { id: resourceId },
    data: {
      enabledFormats: JSON.stringify(enabledFormats),
      status: "generated",
    },
  });

  return NextResponse.json({ results, errors });
}
