import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { analyzeDocument } from "@/lib/claude";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await params;
  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });

  if (!resource) {
    return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 });
  }

  if (!resource.extractedText) {
    return NextResponse.json({ error: "Aucun texte extrait pour cette ressource" }, { status: 400 });
  }

  try {
    const analysis = await analyzeDocument(resource.extractedText);

    await prisma.resource.update({
      where: { id: resourceId },
      data: {
        analysis: JSON.stringify(analysis),
        status: "analyzed",
      },
    });

    return NextResponse.json({ extractedText: resource.extractedText.slice(0, 500), analysis });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse du document" },
      { status: 500 }
    );
  }
}
