import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractTextFromPdf } from "@/lib/pdf";
import { analyzeDocument } from "@/lib/claude";
import path from "path";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await params;
  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });

  if (!resource) {
    return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 });
  }

  try {
    const filePath = path.join(process.cwd(), "public", resource.pdfPath);
    const extractedText = await extractTextFromPdf(filePath);

    const analysis = await analyzeDocument(extractedText);

    await prisma.resource.update({
      where: { id: resourceId },
      data: {
        extractedText,
        analysis: JSON.stringify(analysis),
        status: "analyzed",
      },
    });

    return NextResponse.json({ extractedText: extractedText.slice(0, 500), analysis });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse du document" },
      { status: 500 }
    );
  }
}
