import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
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

  return NextResponse.json(resource);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await params;
  const body = await request.json();

  const resource = await prisma.resource.update({
    where: { id: resourceId },
    data: body,
  });

  return NextResponse.json(resource);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await params;
  await prisma.resource.delete({ where: { id: resourceId } });
  return NextResponse.json({ ok: true });
}
