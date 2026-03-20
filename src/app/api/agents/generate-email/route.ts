import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { actionLabel, actionDetail, agentName, agentDescription } = await request.json();

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `Tu es un assistant RH expert en rédaction d'emails professionnels. Tu génères des emails pour des agents IA RH.

## Variables disponibles
Tu DOIS utiliser ces variables dans tes emails pour personnaliser le contenu :
- {{collaborateur.prenom}} : prénom du collaborateur
- {{collaborateur.nom}} : nom du collaborateur
- {{collaborateur.poste}} : poste du collaborateur
- {{collaborateur.departement}} : département
- {{collaborateur.manager}} : nom du manager
- {{collaborateur.date_arrivee}} : date d'arrivée
- {{entreprise.nom}} : nom de l'entreprise

## Règles
- Rédige un email professionnel mais chaleureux
- Utilise les variables pertinentes (pas toutes obligatoirement)
- Le corps doit faire 5-10 lignes
- Adapte le ton au contexte RH (onboarding, suivi, alerte...)
- Réponds UNIQUEMENT en JSON valide sans markdown`,
      messages: [
        {
          role: "user",
          content: `Génère un email pour cette action d'agent IA :
- Agent : ${agentName || "Agent RH"}
- Description agent : ${agentDescription || ""}
- Action : ${actionLabel || "Email"}
- Détail : ${actionDetail || ""}

Réponds en JSON :
{
  "to": "destinataire avec variable si pertinent",
  "subject": "objet de l'email",
  "body": "corps complet de l'email avec variables"
}`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Invalid response" }, { status: 500 });
    }

    const email = JSON.parse(jsonMatch[0]);
    return NextResponse.json(email);
  } catch (error) {
    console.error("Generate email error:", error);
    return NextResponse.json({ error: "Failed to generate email" }, { status: 500 });
  }
}
