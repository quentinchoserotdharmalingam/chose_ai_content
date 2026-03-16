import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

const client = new Anthropic();

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const interview = await prisma.interviewResource.findUnique({ where: { id } });
  if (!interview) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `Tu es un expert RH. Génère UNE question pulse pertinente pour un sondage récurrent en entreprise.

Contexte :
- Thème : ${interview.theme}
- Ton : ${interview.tone}
- Titre du pulse : ${interview.title}
${interview.description ? `- Description : ${interview.description}` : ""}

La question doit :
- Être formulée pour obtenir une réponse sur une échelle de 1 à 10
- Être courte, claire et bienveillante
- Être adaptée au thème et au ton choisis
- Être en français, tutoiement si ton décontracté, vouvoiement sinon

Réponds UNIQUEMENT avec la question, sans guillemets ni explication.`,
      },
    ],
  });

  const question = (msg.content[0] as { type: string; text: string }).text.trim();

  return NextResponse.json({ question });
}
