import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};

  if (body.status) {
    data.status = body.status;
    if (body.status !== "pending") {
      data.resolvedAt = new Date();
    }
  }

  if (body.customizedAction) {
    data.customizedAction = JSON.stringify(body.customizedAction);
  }

  const suggestion = await prisma.suggestion.update({
    where: { id },
    data,
    include: {
      agent: { select: { id: true, name: true, icon: true, color: true } },
      employee: true,
    },
  });

  // If accepted or customized, create action logs
  if (body.status === "accepted" || body.status === "customized") {
    const actionPlan = JSON.parse(suggestion.actionPlan || "[]") as Array<{ id: number; label: string; detail?: string }>;

    for (const action of actionPlan) {
      const actionType = action.label.toLowerCase().includes("email") || action.label.toLowerCase().includes("envoyer") || action.label.toLowerCase().includes("notifier")
        ? "email"
        : action.label.toLowerCase().includes("meeting") || action.label.toLowerCase().includes("planifier") || action.label.toLowerCase().includes("créneau")
        ? "meeting"
        : "task";

      await prisma.actionLog.create({
        data: {
          suggestionId: id,
          actionType,
          actionDetails: JSON.stringify({
            label: action.label,
            detail: action.detail,
            employeeName: suggestion.employee ? `${suggestion.employee.firstName} ${suggestion.employee.lastName}` : "N/A",
            simulatedAt: new Date().toISOString(),
            status: "simulated",
          }),
        },
      });
    }
  }

  return NextResponse.json(suggestion);
}
