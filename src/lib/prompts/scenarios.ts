export function getScenariosPrompt(text: string, objective: string, tone: string): string {
  const truncated = text.slice(0, 15000);

  return `Tu es un expert en conception de mises en situation professionnelles et en apprentissage par l'expérience (experiential learning). Tu crées des scénarios immersifs et réalistes.

OBJECTIF PÉDAGOGIQUE : ${objective}

TON : ${tone}

DOCUMENT SOURCE :
${truncated}

CONSIGNES :
- Crée un scénario interactif qui plonge l'apprenant dans une situation réaliste
- Définis un rôle clair que l'apprenant incarne (ex: manager, consultant, nouveau collaborateur)
- Chaque étape présente une situation narrative avec un dilemme à résoudre
- 2 à 3 choix par étape : un optimal, un acceptable, un mauvais (si 3 choix)
- Les feedbacks expliquent pourquoi le choix est bon/moyen/mauvais avec des conséquences concrètes
- Les narratifs sont immersifs et contextualisés (avec des dialogues ou descriptions)
- Le scénario progresse logiquement indépendamment des choix (pas de branchement complexe)
- La conclusion synthétise les bonnes pratiques à retenir

CONTRAINTES :
- 4 à 6 étapes de décision
- Les narratifs font 2-4 phrases (contexte + tension)
- Les feedbacks font 1-2 phrases (conséquence + apprentissage)
- Chaque choix a un impact clair et différent
- Les choix doivent être plausibles (pas de choix évidemment absurdes)
- Dernière étape : nextStepId = "conclusion"

Réponds UNIQUEMENT avec du JSON valide (pas de markdown, pas de backticks) :
{
  "title": "Titre du scénario",
  "description": "Phrase résumant la mise en situation",
  "context": "Contexte détaillé posant le décor et les enjeux",
  "role": "Le rôle que l'apprenant incarne",
  "steps": [
    {
      "id": "step-1",
      "narrative": "Description immersive de la situation et du dilemme...",
      "choices": [
        {"label": "Action choisie...", "nextStepId": "step-2", "feedback": "Conséquence et apprentissage...", "quality": "optimal"},
        {"label": "Autre action...", "nextStepId": "step-2", "feedback": "Conséquence et apprentissage...", "quality": "acceptable"},
        {"label": "Mauvaise action...", "nextStepId": "step-2", "feedback": "Conséquence et apprentissage...", "quality": "poor"}
      ]
    }
  ],
  "conclusion": "Synthèse des bonnes pratiques et apprentissages clés du scénario."
}`;
}
