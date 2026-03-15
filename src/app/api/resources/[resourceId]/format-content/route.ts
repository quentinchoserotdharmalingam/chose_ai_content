import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { FormatSlug } from "@/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await params;
  const body = await request.json();
  const format: FormatSlug = body.format;
  const content: object = body.content;

  if (!format || !content) {
    return NextResponse.json(
      { error: "format et content sont requis" },
      { status: 400 }
    );
  }

  const existing = await prisma.formatContent.findUnique({
    where: { resourceId_format: { resourceId, format } },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Contenu introuvable pour ce format" },
      { status: 404 }
    );
  }

  await prisma.formatContent.update({
    where: { resourceId_format: { resourceId, format } },
    data: { content: JSON.stringify(content) },
  });

  return NextResponse.json({ success: true });
}
