export function getScenariosPrompt(text: string, objective: string, tone: string): string {
  const truncated = text.slice(0, 50000);
  return `Tu es un expert en scénarisation pédagogique et mises en situation professionnelles. Génère un scénario interactif à choix multiples à partir du document ci-dessous.

OBJECTIF PÉDAGOGIQUE : ${objective}
TON : ${tone}

DOCUMENT :
---
${truncated}
---

Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks) au format suivant :
{
  "title": "Titre du scénario",
  "context": "Paragraphe de mise en contexte : qui est l'apprenant, quelle est la situation",
  "steps": [
    {
      "id": "step-1",
      "narrative": "Description de la situation à laquelle l'apprenant fait face",
      "choices": [
        {
          "label": "Choix A (description courte de l'action)",
          "nextStepId": "step-2",
          "feedback": "Feedback détaillé sur ce choix",
          "quality": "optimal | acceptable | poor"
        }
      ]
    }
  ],
  "conclusion": "Conclusion pédagogique et résumé des apprentissages"
}

Règles :
- 4 à 6 étapes (steps)
- 2 à 3 choix par étape
- Au moins 1 choix "optimal", 1 "acceptable" ou "poor" par étape
- Les feedbacks expliquent pourquoi le choix est bon ou mauvais
- Le scénario doit être réaliste et ancré dans un contexte professionnel
- Tous les chemins doivent converger vers la conclusion (le dernier step a des nextStepId vides ou "conclusion")
- Le dernier step doit avoir des choices avec nextStepId: "conclusion"`;
}
