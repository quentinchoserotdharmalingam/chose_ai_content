export function getScenariosPrompt(text: string, objective: string, tone: string): string {
  const truncated = text.slice(0, 15000);
  return `Génère un scénario interactif JSON. Objectif : ${objective}. Ton : ${tone}.

DOCUMENT :
${truncated}

JSON valide uniquement (sans markdown, sans backticks) :
{"title":"...","context":"...","steps":[{"id":"step-1","narrative":"...","choices":[{"label":"...","nextStepId":"step-2","feedback":"...","quality":"optimal|acceptable|poor"}]}],"conclusion":"..."}

3 à 4 étapes, 2-3 choix par étape (1 optimal, 1 poor minimum). Dernier step : nextStepId="conclusion".`;
}
