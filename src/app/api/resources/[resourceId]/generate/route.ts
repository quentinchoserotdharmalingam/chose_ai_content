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
  const format: FormatSlug | undefined = body.format;
  const formats: FormatSlug[] | undefined = body.formats;

  // Single format mode: generate one format at a time (recommended)
  if (format) {
    if (format === "chat") {
      return NextResponse.json({ format, content: null, dynamic: true });
    }

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

      return NextResponse.json({ format, content });
    } catch (error) {
      console.error(`Generation error for ${format}:`, error);
      return NextResponse.json(
        { error: `Erreur lors de la génération du format ${format}` },
        { status: 500 }
      );
    }
  }

  // Batch mode (legacy): generate all formats at once
  const allFormats: FormatSlug[] = formats || ["synthese", "flashcards", "module", "scenarios"];

  const results: Record<string, object> = {};
  const errors: Record<string, string> = {};

  for (const f of allFormats) {
    if (f === "chat") continue;

    try {
      const content = await generateFormatContent(
        resource.extractedText,
        resource.objective,
        f,
        resource.tone
      );

      await prisma.formatContent.upsert({
        where: { resourceId_format: { resourceId, format: f } },
        create: { resourceId, format: f, content: JSON.stringify(content) },
        update: { content: JSON.stringify(content), version: { increment: 1 } },
      });

      results[f] = content;
    } catch (error) {
      console.error(`Generation error for ${f}:`, error);
      errors[f] = `Erreur lors de la génération du format ${f}`;
    }
  }

  const enabledFormats = allFormats.filter((f) => f === "chat" || results[f]);

  await prisma.resource.update({
    where: { id: resourceId },
    data: {
      enabledFormats: JSON.stringify(enabledFormats),
      status: "generated",
    },
  });

  return NextResponse.json({ results, errors });
}
