import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { put } from "@vercel/blob";

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

  const blob = await put(`pdfs/${Date.now()}-${file.name.replace(/\s+/g, "_")}`, file, {
    access: "public",
  });

  const resource = await prisma.resource.create({
    data: {
      pdfUrl: blob.url,
      title: file.name.replace(".pdf", ""),
    },
  });

  return NextResponse.json(resource, { status: 201 });
}
