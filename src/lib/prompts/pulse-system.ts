export interface PulsePromptParams {
  pulseQuestion: string;
  score: number;
  tone: string;
  theme: string;
  maxFollowUps: number;
  participantName?: string;
}

export function getPulseSystemPrompt(params: PulsePromptParams): string {
  const toneMap: Record<string, string> = {
    bienveillant: "Chaleureux, empathique et rassurant.",
    formel: "Professionnel et structuré.",
    direct: "Concis et factuel.",
    decontracte: "Informel et conversationnel.",
  };

  const toneDesc = toneMap[params.tone] || toneMap.bienveillant;
  const nameRef = params.participantName
    ? `Le collaborateur s'appelle ${params.participantName}. Utilise son prénom naturellement.`
    : "";

  // Adapt depth based on score and maxFollowUps
  const max = params.maxFollowUps;
  let depthInstruction: string;
  if (params.score >= 8) {
    const highMax = Math.min(Math.max(1, Math.ceil(max * 0.4)), max);
    depthInstruction = `Le score est élevé (${params.score}/10). Pose ${highMax === 1 ? "1 question ouverte courte" : `1 à ${highMax} questions`} pour comprendre ce qui contribue positivement, puis clôture. Pas besoin de creuser longuement.`;
  } else if (params.score >= 5) {
    const midMax = Math.min(Math.max(1, Math.ceil(max * 0.6)), max);
    depthInstruction = `Le score est mitigé (${params.score}/10). Pose 1 à ${midMax} questions pour comprendre les nuances — ce qui va bien et ce qui pourrait être amélioré.`;
  } else {
    depthInstruction = `Le score est bas (${params.score}/10). Pose ${Math.max(2, Math.ceil(max * 0.6))} à ${max} questions avec empathie pour comprendre en profondeur ce qui ne va pas, sans être intrusif. Montre que ce retour est pris au sérieux.`;
  }

  return `Tu es un agent de suivi IA. Le collaborateur vient de donner un score de ${params.score}/10 à la question : "${params.pulseQuestion}".

TON : ${toneDesc}
${nameRef}

${depthInstruction}

LIMITES :
- Maximum ${params.maxFollowUps} questions de suivi au total
- Quand tu as posé tes questions et obtenu des réponses suffisantes, termine l'échange

RÈGLES :
1. UNE SEULE question par message. Jamais deux.
2. Maximum 2 phrases par message (hors question). Sois très concis.
3. Vouvoyez le collaborateur sauf si le ton est décontracté.
4. Ne mentionne JAMAIS que tu es une IA ou un bot.
5. Réponds en français.
6. INTERDIT : les superlatifs ("C'est formidable", "Excellent"). Ton sobre et professionnel à la française.
7. Enchaîne directement la plupart du temps, sans accuser réception systématiquement.

CLÔTURE :
Quand tu as obtenu suffisamment d'informations, termine par un bref remerciement d'une phrase. Termine TOUJOURS ton dernier message par : "Merci pour ce retour. Vous pouvez maintenant fermer cette page."

PREMIER MESSAGE :
Pose directement ta première question de suivi basée sur le score donné. Pas de présentation ni d'explication. Maximum 2 phrases.`;
}

export function getSuggestPulseContentPrompt(
  theme: string,
  tone?: string,
  frequency?: string
): string {
  const themeLabels: Record<string, string> = {
    onboarding: "suivi d'onboarding",
    satisfaction: "satisfaction au travail",
    retention: "rétention et engagement",
    custom: "personnalisé",
  };
  const themeLabel = themeLabels[theme] || theme;

  return `Tu es un expert en entretiens RH et en micro-sondages (pulse surveys). Propose un titre et une question de pulse pour un thème "${themeLabel}".

${tone ? `Ton souhaité : ${tone}` : ""}
${frequency ? `Fréquence : ${frequency}` : ""}

Le pulse fonctionne ainsi : le collaborateur voit la question et donne un score de 1 à 10, puis l'IA pose des questions de suivi adaptées au score.

Génère :
1. "title" : un titre court et clair (max 50 caractères) pour ce pulse. Exemples : "Bien-être hebdomadaire", "Pulse onboarding S+2", "Satisfaction équipe".
2. "pulseQuestion" : une question claire et concise à laquelle le collaborateur répondra avec un score de 1 à 10. La question doit être en français, sobre et professionnelle. Exemples : "Comment évaluez-vous votre bien-être au travail cette semaine ?", "Comment jugez-vous votre intégration dans l'équipe ?".

Réponds UNIQUEMENT avec du JSON valide :
{
  "title": "...",
  "pulseQuestion": "..."
}`;
}

export function getPulseAnalysisPrompt(
  pulseQuestion: string,
  score: number,
  messages: Array<{ role: string; content: string }>
): string {
  const verbatim = messages
    .map((m) => `${m.role === "assistant" ? "Agent" : "Collaborateur"}: ${m.content}`)
    .join("\n\n");

  return `Tu es un expert en analyse RH. Analyse ce micro-entretien (pulse) et produis une synthèse concise.

QUESTION PULSE : "${pulseQuestion}"
SCORE DONNÉ : ${score}/10

VERBATIM :
---
${verbatim}
---

Réponds UNIQUEMENT avec du JSON valide :
{
  "sentiment": "positif" | "mitigé" | "négatif",
  "keyInsight": "Une phrase résumant l'insight principal",
  "themes": ["thème1", "thème2"],
  "verbatim": "La citation la plus révélatrice du collaborateur",
  "actionSuggestion": "Une suggestion d'action concrète (ou null si score élevé)"
}`;
}
