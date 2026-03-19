import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const [total, pending, accepted, customized, ignored, actionLogs] = await Promise.all([
    prisma.suggestion.count(),
    prisma.suggestion.count({ where: { status: "pending" } }),
    prisma.suggestion.count({ where: { status: "accepted" } }),
    prisma.suggestion.count({ where: { status: "customized" } }),
    prisma.suggestion.count({ where: { status: "ignored" } }),
    prisma.actionLog.count(),
  ]);

  const resolved = accepted + customized + ignored;
  const acceptanceRate = resolved > 0 ? Math.round(((accepted + customized) / resolved) * 100) : 0;
  const timeSavedMinutes = (accepted + customized) * 12; // ~12min saved per validated action

  return NextResponse.json({
    total,
    pending,
    accepted,
    customized,
    ignored,
    resolved,
    acceptanceRate,
    timeSavedMinutes,
    actionsExecuted: actionLogs,
  });
}
