import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await params;

  const session = await prisma.consumptionSession.create({
    data: {
      resourceId,
      completed: true,
      completedAt: new Date(),
    },
  });

  return NextResponse.json(session);
}
