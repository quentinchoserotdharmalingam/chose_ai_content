export function getModulePrompt(text: string, objective: string, tone: string): string {
  const truncated = text.slice(0, 15000);
  return `Génère un module d'apprentissage JSON. Objectif : ${objective}. Ton : ${tone}.

DOCUMENT :
${truncated}

JSON valide uniquement (sans markdown, sans backticks) :
{"title":"...","estimatedDuration":"5-10 min","steps":[{"id":1,"type":"lesson","title":"...","content":"..."},{"id":2,"type":"quiz","question":"...","options":[{"label":"...","correct":false,"explanation":"..."}]}]}

5 à 6 étapes (alterner 2 leçons → 1 quiz), 3 options par quiz, contenu concis.`;
}
