import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export const maxDuration = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await params;
  const body = await request.json();
  const recipientRole: string = body.recipientRole || "manager";

  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) {
    return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 });
  }

  if (!resource.extractedText || !resource.objective) {
    return NextResponse.json(
      { error: "Le document doit être analysé et un objectif défini" },
      { status: 400 }
    );
  }

  const roleLabels: Record<string, string> = {
    manager: "le manager",
    parrain: "le parrain / buddy",
    gestionnaire_rh: "le gestionnaire RH",
  };

  const roleLabel = roleLabels[recipientRole] || "le manager";
  const truncated = resource.extractedText.slice(0, 8000);

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Tu es un assistant RH. Génère un email professionnel destiné à ${roleLabel} pour l'informer qu'un collaborateur a complété une formation.

CONTEXTE DE LA FORMATION :
- Objectif : ${resource.objective}
- Résumé du contenu : ${truncated.slice(0, 2000)}

CONSIGNES :
- L'email doit être court, professionnel et bienveillant
- Utilise le vouvoiement
- Inclus les variables {prenom}, {nom}, {formation}, {date} aux endroits appropriés
- Le sujet doit être clair et concis
- Le corps ne doit pas dépasser 6 lignes

Réponds en JSON avec exactement cette structure :
{
  "subject": "Objet de l'email",
  "body": "Corps de l'email"
}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Email generation error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de l'email" },
      { status: 500 }
    );
  }
}
