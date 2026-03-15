export function getSynthesePrompt(text: string, objective: string, tone: string): string {
  const truncated = text.slice(0, 15000);
  return `Génère une synthèse structurée JSON. Objectif : ${objective}. Ton : ${tone}.

DOCUMENT :
${truncated}

JSON valide uniquement (sans markdown, sans backticks) :
{"title":"...","duration":"1-2 min","sections":[{"heading":"...","content":"...","keyPoints":["..."]}],"takeaways":["..."]}

3 à 4 sections max, 2-3 points clés par section, 3 takeaways actionnables.`;
}
