import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      suggestions: {
        orderBy: { createdAt: "desc" },
        include: { employee: true },
      },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json(agent);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const agent = await prisma.agent.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.icon !== undefined ? { icon: body.icon } : {}),
      ...(body.color !== undefined ? { color: body.color } : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.triggerType !== undefined ? { triggerType: body.triggerType } : {}),
      ...(body.triggerLabel !== undefined ? { triggerLabel: body.triggerLabel } : {}),
      ...(body.triggerConfig !== undefined ? { triggerConfig: JSON.stringify(body.triggerConfig) } : {}),
      ...(body.infoDescription !== undefined ? { infoDescription: body.infoDescription } : {}),
      ...(body.actions !== undefined ? { actions: JSON.stringify(body.actions) } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    },
  });

  return NextResponse.json(agent);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.agent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
