export function getFlashcardsPrompt(text: string, objective: string, tone: string): string {
  const truncated = text.slice(0, 50000);
  return `Tu es un expert en ingénierie pédagogique spécialisé en active recall. Génère un jeu de flashcards à partir du document ci-dessous.

OBJECTIF PÉDAGOGIQUE : ${objective}
TON : ${tone}

DOCUMENT :
---
${truncated}
---

Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks) au format suivant :
{
  "title": "Titre du jeu de flashcards",
  "cards": [
    {
      "id": 1,
      "question": "Question claire et précise",
      "answer": "Réponse concise mais complète",
      "hint": "Indice optionnel",
      "difficulty": "easy | medium | hard"
    }
  ]
}

Règles :
- 8 à 15 cartes
- Mélanger les niveaux de difficulté (30% easy, 50% medium, 20% hard)
- Questions variées : définitions, applications, comparaisons, cas pratiques
- Réponses courtes (1-3 phrases)
- Les indices doivent guider sans donner la réponse`;
}
