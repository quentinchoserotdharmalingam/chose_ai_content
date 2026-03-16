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

  const truncated = resource.extractedText.slice(0, 8000);

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Tu es un expert en pédagogie et en ancrage mémoriel. Tu génères le contenu de 3 rappels espacés (J+1, J+7, J+30) pour aider un apprenant à retenir l'essentiel d'une formation.

OBJECTIF DE LA FORMATION : ${resource.objective}

CONTENU SOURCE (extrait) :
${truncated}

CONSIGNES POUR CHAQUE RAPPEL :
- J+1 (lendemain) : Rappel "à chaud" — résumé court des 3-5 points essentiels, ton encourageant. Focus sur ce qu'il faut retenir absolument.
- J+7 (une semaine) : Rappel "consolidation" — reformulation des concepts clés sous un angle différent, avec une question de réflexion pour stimuler le rappel actif.
- J+30 (un mois) : Rappel "ancrage" — synthèse très concise des enseignements durables + une mise en application concrète à tester.

CONTRAINTES :
- Chaque rappel a un titre court et accrocheur (max 60 caractères)
- Le corps de chaque rappel fait 3-6 lignes maximum
- Utilise le tutoiement bienveillant
- Sépare les paragraphes avec \\n\\n
- Les points clés peuvent utiliser des tirets (-)

Réponds UNIQUEMENT en JSON valide :
{
  "1": {
    "title": "Titre du rappel J+1",
    "body": "Contenu du rappel J+1..."
  },
  "7": {
    "title": "Titre du rappel J+7",
    "body": "Contenu du rappel J+7..."
  },
  "30": {
    "title": "Titre du rappel J+30",
    "body": "Contenu du rappel J+30..."
  }
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
    console.error("Rappel generation error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération des rappels" },
      { status: 500 }
    );
  }
}
