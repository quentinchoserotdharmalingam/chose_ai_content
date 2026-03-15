export function getSynthesePrompt(text: string, objective: string, tone: string): string {
  const truncated = text.slice(0, 50000);
  return `Tu es un expert en ingénierie pédagogique. Génère une synthèse structurée à partir du document ci-dessous.

OBJECTIF PÉDAGOGIQUE : ${objective}
TON : ${tone}

DOCUMENT :
---
${truncated}
---

Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks) au format suivant :
{
  "title": "Titre de la synthèse",
  "duration": "1-2 min",
  "sections": [
    {
      "heading": "Titre de la section",
      "content": "Contenu de la section (texte riche, clair et concis)",
      "keyPoints": ["Point clé 1", "Point clé 2"]
    }
  ],
  "takeaways": ["3 à 5 points à retenir essentiels"]
}

Règles :
- 3 à 6 sections maximum
- Langage clair et accessible
- Chaque section doit avoir 2-4 points clés
- Les takeaways doivent être actionnables`;
}
