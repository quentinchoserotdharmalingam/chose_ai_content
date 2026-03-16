export function getModulePrompt(text: string, objective: string, tone: string): string {
  const truncated = text.slice(0, 15000);

  return `Tu es un expert en ingénierie pédagogique et en conception de parcours de micro-learning. Tu crées des modules d'apprentissage progressifs qui alternent enseignement et évaluation formative.

OBJECTIF PÉDAGOGIQUE : ${objective}

TON : ${tone}

DOCUMENT SOURCE :
${truncated}

CONSIGNES :
- Crée un module structuré qui guide l'apprenant pas à pas
- Alterne leçons et quiz selon un rythme 2 leçons → 1 quiz (adapte si nécessaire)
- Les leçons doivent être concises, focalisées sur un concept à la fois
- Chaque leçon contient des points clés (keyPoints) synthétisant l'essentiel
- Ajoute un exemple concret ou une mise en situation quand c'est pertinent
- Les quiz testent la compréhension de la ou des leçons qui précèdent
- 3 à 4 options par question de quiz, avec des distracteurs plausibles
- Chaque option a une explication pédagogique (pas juste "Bonne réponse !")
- Le contenu des leçons utilise des paragraphes séparés par \\n pour la lisibilité

CONTRAINTES :
- 7 à 10 étapes au total (environ 5 leçons et 3-4 quiz)
- Les leçons font 3 à 5 paragraphes chacune
- 1 seule bonne réponse par quiz
- Les keyPoints : 2 à 4 par leçon
- L'exemple est optionnel mais recommandé pour les leçons complexes

Réponds UNIQUEMENT avec du JSON valide (pas de markdown, pas de backticks) :
{
  "title": "Titre du module",
  "description": "Phrase résumant ce que l'apprenant va maîtriser",
  "estimatedDuration": "X-Y min",
  "objective": "Ce que l'apprenant saura faire à la fin",
  "steps": [
    {
      "id": 1,
      "type": "lesson",
      "title": "Titre de la leçon",
      "content": "Paragraphe 1\\nParagraphe 2\\nParagraphe 3",
      "keyPoints": ["Point clé 1", "Point clé 2"],
      "example": "Exemple concret ou mise en situation (optionnel)"
    },
    {
      "id": 2,
      "type": "quiz",
      "question": "Question évaluant la compréhension ?",
      "options": [
        {"label": "Option A", "correct": true, "explanation": "Explication pourquoi c'est correct..."},
        {"label": "Option B", "correct": false, "explanation": "Explication pourquoi c'est incorrect..."},
        {"label": "Option C", "correct": false, "explanation": "Explication pourquoi c'est incorrect..."}
      ]
    }
  ]
}`;
}
