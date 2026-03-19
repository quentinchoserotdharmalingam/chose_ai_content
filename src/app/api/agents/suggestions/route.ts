import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const agentId = searchParams.get("agentId") || undefined;
  const severity = searchParams.get("severity") || undefined;

  const statusFilter = status ? { status: { in: status.split(",") } } : {};

  const suggestions = await prisma.suggestion.findMany({
    where: {
      ...statusFilter,
      ...(agentId ? { agentId } : {}),
      ...(severity ? { severity } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      agent: { select: { id: true, name: true, icon: true, color: true, category: true } },
      employee: true,
      actionLogs: true,
    },
  });

  return NextResponse.json(suggestions);
}
