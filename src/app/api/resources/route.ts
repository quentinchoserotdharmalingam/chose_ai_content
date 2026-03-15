import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractTextFromPdfBuffer } from "@/lib/pdf";

export async function GET() {
  const resources = await prisma.resource.findMany({
    orderBy: { createdAt: "desc" },
    include: { contents: { select: { format: true } } },
  });
  return NextResponse.json(resources);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file || !file.name.endsWith(".pdf")) {
    return NextResponse.json({ error: "Un fichier PDF est requis" }, { status: 400 });
  }

  try {
    // Extract text from PDF using Mistral OCR
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extractedText = await extractTextFromPdfBuffer(buffer);

    const resource = await prisma.resource.create({
      data: {
        title: file.name.replace(".pdf", ""),
        extractedText,
        status: "draft",
      },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error("Upload/OCR error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors du traitement du PDF" },
      { status: 500 }
    );
  }
}
