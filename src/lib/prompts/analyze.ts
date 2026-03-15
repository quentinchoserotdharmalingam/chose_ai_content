export function getAnalyzePrompt(text: string): string {
  const truncated = text.slice(0, 50000);
  return `Tu es un expert en ingénierie pédagogique. Analyse le document suivant et produis un JSON structuré.

DOCUMENT :
---
${truncated}
---

Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks) au format suivant :
{
  "topics": ["liste des sujets principaux abordés"],
  "complexity": "beginner | intermediate | advanced",
  "keyThemes": ["les 3-5 thèmes clés"],
  "suggestedObjectives": ["3 objectifs pédagogiques suggérés, formulés comme 'À l'issue de cette ressource, l'apprenant sera capable de...'"],
  "summary": "Résumé en 2-3 phrases du contenu du document",
  "wordCount": nombre_de_mots_estimé
}`;
}
