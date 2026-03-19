import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;
  const status = searchParams.get("status") || undefined;

  const agents = await prisma.agent.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: [{ isTemplate: "desc" }, { createdAt: "desc" }],
    include: {
      suggestions: {
        select: { id: true, status: true, severity: true },
      },
    },
  });

  return NextResponse.json(agents);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const agent = await prisma.agent.create({
    data: {
      name: body.name || "Nouvel agent",
      description: body.description || null,
      icon: body.icon || "🤖",
      color: body.color || "#FF6058",
      category: body.category || "custom",
      triggerType: body.triggerType || "event",
      triggerLabel: body.triggerLabel || "",
      triggerConfig: JSON.stringify(body.triggerConfig || {}),
      infoDescription: body.infoDescription || null,
      actions: JSON.stringify(body.actions || []),
      isTemplate: body.isTemplate || false,
      templateId: body.templateId || null,
      status: body.status || "draft",
    },
  });

  return NextResponse.json(agent, { status: 201 });
}
