import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
  const filePath = path.join(uploadsDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const resource = await prisma.resource.create({
    data: {
      pdfPath: `/uploads/${filename}`,
      title: file.name.replace(".pdf", ""),
    },
  });

  return NextResponse.json(resource, { status: 201 });
}
