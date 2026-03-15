export function getModulePrompt(text: string, objective: string, tone: string): string {
  const truncated = text.slice(0, 50000);
  return `Tu es un expert en microlearning et ingénierie pédagogique. Génère un module structuré d'apprentissage à partir du document ci-dessous.

OBJECTIF PÉDAGOGIQUE : ${objective}
TON : ${tone}

DOCUMENT :
---
${truncated}
---

Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks) au format suivant :
{
  "title": "Titre du module",
  "estimatedDuration": "5-15 min",
  "steps": [
    {
      "id": 1,
      "type": "lesson",
      "title": "Titre de la leçon",
      "content": "Contenu pédagogique clair et structuré"
    },
    {
      "id": 2,
      "type": "quiz",
      "question": "Question de vérification",
      "options": [
        { "label": "Option A", "correct": false, "explanation": "Pourquoi cette réponse est incorrecte" },
        { "label": "Option B", "correct": true, "explanation": "Pourquoi cette réponse est correcte" },
        { "label": "Option C", "correct": false, "explanation": "Pourquoi cette réponse est incorrecte" }
      ]
    }
  ]
}

Règles :
- Alterner leçons et quiz (pattern : 2-3 leçons → 1 quiz)
- 8 à 15 étapes au total
- Chaque leçon : 2-4 paragraphes maximum
- Chaque quiz : 3-4 options, exactement 1 correcte
- Progression logique du simple au complexe
- Les quiz testent la compréhension, pas la mémorisation brute`;
}
