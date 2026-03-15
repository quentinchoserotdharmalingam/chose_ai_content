export function getFlashcardsPrompt(text: string, objective: string, tone: string): string {
  const truncated = text.slice(0, 15000);

  return `Tu es un expert en mémorisation active (active recall). Tu crées des flashcards pédagogiques qui favorisent la rétention à long terme.

OBJECTIF PÉDAGOGIQUE : ${objective}

TON : ${tone}

DOCUMENT SOURCE :
${truncated}

CONSIGNES :
- Crée des flashcards qui couvrent les concepts essentiels du document
- Les questions doivent stimuler la réflexion, pas juste la mémoire brute (préfère "Pourquoi..." ou "Comment..." à "Quel est...")
- Les réponses sont concises (1-3 phrases max) mais complètes
- Chaque carte a une catégorie thématique pour le regroupement
- Les indices (hints) sont des amorces qui orientent sans donner la réponse
- Varie les types de questions : définition, comparaison, application, cause-effet
- Assure un mix équilibré de difficultés (2-3 faciles, 3-4 moyennes, 2-3 difficiles)

CONTRAINTES :
- 8 à 12 cartes
- Réponses de 1 à 3 phrases maximum
- Chaque carte doit avoir un indice (hint)
- 2 à 4 catégories différentes maximum
- Difficultés : "easy" (rappel direct), "medium" (compréhension), "hard" (application/analyse)

Réponds UNIQUEMENT avec du JSON valide (pas de markdown, pas de backticks) :
{
  "title": "Titre du jeu de flashcards",
  "description": "Phrase décrivant le périmètre couvert par ces flashcards",
  "cards": [
    {
      "id": 1,
      "category": "Catégorie thématique",
      "question": "Question stimulant la réflexion ?",
      "answer": "Réponse concise et complète.",
      "hint": "Indice orientant vers la réponse...",
      "difficulty": "easy|medium|hard"
    }
  ]
}`;
}
