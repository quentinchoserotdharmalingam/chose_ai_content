export function getFlashcardsPrompt(text: string, objective: string, tone: string): string {
  const truncated = text.slice(0, 15000);
  return `Génère des flashcards JSON. Objectif : ${objective}. Ton : ${tone}.

DOCUMENT :
${truncated}

JSON valide uniquement (sans markdown, sans backticks) :
{"title":"...","cards":[{"id":1,"question":"...","answer":"...","hint":"...","difficulty":"easy|medium|hard"}]}

5 à 8 cartes, réponses courtes (1-2 phrases), mix de difficultés.`;
}
