import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { getAgentSuggestionPrompt } from "@/lib/prompts/agent-suggestions";

const client = new Anthropic();

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      position: true,
      department: true,
      hireDate: true,
      status: true,
      onboardingCompleted: true,
      lastPulseScore: true,
    },
  });

  const actions = JSON.parse(agent.actions || "[]");
  const prompt = getAgentSuggestionPrompt(
    {
      name: agent.name,
      description: agent.description || "",
      triggerLabel: agent.triggerLabel,
      infoDescription: agent.infoDescription || "",
      actions,
    },
    employees.map(e => ({
      firstName: e.firstName,
      lastName: e.lastName,
      position: e.position,
      department: e.department,
      hireDate: e.hireDate.toISOString().split("T")[0],
      status: e.status,
      onboardingCompleted: e.onboardingCompleted,
      lastPulseScore: e.lastPulseScore,
    })),
  );

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const suggestions = parsed.suggestions || [];

  // Create suggestions in DB
  const created = [];
  for (const s of suggestions) {
    // Match employee by name
    const employee = employees.find(
      e => `${e.firstName} ${e.lastName}` === s.employeeName
    );

    const suggestion = await prisma.suggestion.create({
      data: {
        agentId: id,
        employeeId: employee?.id || null,
        severity: s.severity || "attention",
        category: s.category || "onboarding",
        title: s.title,
        summary: s.summary,
        context: JSON.stringify(s.context || {}),
        actionPlan: JSON.stringify(s.actionPlan || []),
        alternatives: JSON.stringify(s.alternatives || []),
        status: "pending",
      },
      include: {
        agent: { select: { id: true, name: true, icon: true, color: true } },
        employee: true,
      },
    });
    created.push(suggestion);
  }

  return NextResponse.json({ suggestions: created });
}
