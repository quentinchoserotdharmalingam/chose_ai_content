import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Helper to create a date in the past
function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(Math.floor(Math.random() * 10) + 8); // between 8h-18h
  d.setMinutes(Math.floor(Math.random() * 60));
  return d;
}

function minutesAfter(base: Date, min: number): Date {
  return new Date(base.getTime() + min * 60 * 1000);
}

export async function POST() {
  // ============================================================
  // 1. INTERVIEW LONG — Onboarding M+1
  // ============================================================
  const interview1 = await prisma.interviewResource.create({
    data: {
      title: "Suivi d'intégration M+1",
      description: "Entretien de suivi à 1 mois pour les nouveaux collaborateurs — évaluer l'intégration, identifier les points de friction et recueillir les premières impressions.",
      type: "interview",
      theme: "onboarding",
      tone: "bienveillant",
      scopeIn: "Intégration dans l'équipe, relation avec le manager, qualité de l'onboarding, outils et processus, charge de travail, formation reçue, premières missions",
      scopeOut: "Rémunération, politique salariale, comparaison avec l'ancien employeur",
      anchorQuestions: JSON.stringify([
        "Sur une échelle de 1 à 10, comment évaluez-vous votre intégration jusqu'ici ?",
        "Quel a été le moment le plus marquant de votre premier mois ?",
      ]),
      checkpointQuestions: JSON.stringify([
        "Avez-vous identifié un point bloquant dans vos premières missions ?",
        "Comment décririez-vous la communication au sein de votre équipe ?",
        "Y a-t-il un sujet sur lequel vous aimeriez plus d'accompagnement ?",
      ]),
      targetDurationMinutes: 15,
      maxQuestions: 20,
      analysisTemplate: JSON.stringify([
        { key: "satisfaction_score", label: "Score de satisfaction", type: "score_1_10", description: "Satisfaction globale de l'intégration" },
        { key: "integration_quality", label: "Qualité d'intégration", type: "score_low_med_high", description: "Niveau d'intégration dans l'équipe" },
        { key: "positive_themes", label: "Points positifs", type: "list", description: "Thèmes positifs identifiés" },
        { key: "negative_themes", label: "Points d'alerte", type: "list", description: "Thèmes négatifs ou risques" },
        { key: "departure_risk", label: "Risque de départ", type: "score_low_med_high", description: "Évaluation du risque de départ anticipé" },
        { key: "suggestions", label: "Suggestions", type: "list", description: "Actions recommandées" },
      ]),
      status: "published",
      createdAt: daysAgo(21),
      updatedAt: daysAgo(21),
    },
  });

  // Session 1 — Marie, completed 18 days ago
  const s1Start = daysAgo(18);
  const session1 = await prisma.interviewSession.create({
    data: {
      interviewResourceId: interview1.id,
      participantName: "Marie",
      status: "completed",
      startedAt: s1Start,
      completedAt: minutesAfter(s1Start, 14),
    },
  });

  const s1Messages = [
    { role: "assistant", content: "Bonjour Marie, merci de prendre ce temps. Je suis là pour recueillir votre ressenti sur votre premier mois. Tout ce que vous direz restera confidentiel. Pour commencer, sur une échelle de 1 à 10, comment évaluez-vous votre intégration jusqu'ici ?" },
    { role: "user", content: "Je dirais 8 sur 10. L'équipe est vraiment accueillante, j'ai été bien accompagnée dès le premier jour." },
    { role: "assistant", content: "Je vois, c'est un bon retour. Qu'est-ce qui a le plus contribué à cette impression positive ?" },
    { role: "user", content: "Mon manager a pris le temps de faire des points réguliers la première semaine. Et ma marraine m'a beaucoup aidée sur les outils internes." },
    { role: "assistant", content: "D'accord. Quel a été le moment le plus marquant de votre premier mois ?" },
    { role: "user", content: "Quand j'ai présenté mon premier livrable en réunion d'équipe. J'étais stressée mais les retours étaient constructifs, ça m'a mise en confiance." },
    { role: "assistant", content: "Avez-vous identifié un point bloquant dans vos premières missions ?" },
    { role: "user", content: "Oui, la documentation interne est un peu éparpillée. J'ai perdu du temps à chercher des process qui n'étaient pas centralisés." },
    { role: "assistant", content: "Je comprends. Comment décririez-vous la communication au sein de votre équipe ?" },
    { role: "user", content: "Plutôt fluide. On utilise Slack et les gens répondent vite. Par contre les réunions sont parfois un peu longues et pas toujours utiles." },
    { role: "assistant", content: "Y a-t-il un sujet sur lequel vous aimeriez plus d'accompagnement ?" },
    { role: "user", content: "Sur les outils data. Je viens d'un environnement différent et j'aurais aimé une formation plus structurée plutôt que d'apprendre sur le tas." },
    { role: "assistant", content: "Merci beaucoup Marie pour ces retours. Ils sont précieux pour améliorer l'onboarding. N'hésitez pas à solliciter votre manager si besoin. Vous pouvez cliquer sur \"Terminer\" pour clôturer." },
  ];

  for (const msg of s1Messages) {
    await prisma.interviewMessage.create({
      data: { sessionId: session1.id, role: msg.role, content: msg.content },
    });
  }

  await prisma.interviewAnalysis.create({
    data: {
      sessionId: session1.id,
      summary: JSON.stringify({
        satisfaction_score: 8,
        integration_quality: "high",
        positive_themes: ["Accompagnement manager", "Marrainage efficace", "Équipe accueillante", "Retours constructifs"],
        negative_themes: ["Documentation éparpillée", "Réunions trop longues", "Formation outils data insuffisante"],
        departure_risk: "low",
        suggestions: ["Centraliser la documentation interne", "Planifier une formation outils data", "Optimiser le format des réunions"],
      }),
      rawAnalysis: "Marie montre une intégration très positive (8/10). Les points forts sont l'accompagnement managérial, le système de marrainage et l'accueil de l'équipe. Les axes d'amélioration concernent principalement la documentation interne (non centralisée), la formation aux outils data (apprentissage trop autonome) et l'efficacité des réunions. Le risque de départ est faible — Marie semble engagée et valorise la culture d'équipe.",
    },
  });

  // Session 2 — Thomas, completed 12 days ago
  const s2Start = daysAgo(12);
  const session2 = await prisma.interviewSession.create({
    data: {
      interviewResourceId: interview1.id,
      participantName: "Thomas",
      status: "completed",
      startedAt: s2Start,
      completedAt: minutesAfter(s2Start, 18),
    },
  });

  const s2Messages = [
    { role: "assistant", content: "Bonjour Thomas, merci d'avoir accepté cet échange. Sur une échelle de 1 à 10, comment évaluez-vous votre intégration jusqu'ici ?" },
    { role: "user", content: "Honnêtement, 5 sur 10. Je me sens un peu perdu." },
    { role: "assistant", content: "Je comprends. Qu'est-ce qui contribue à cette impression ?" },
    { role: "user", content: "Mon manager est souvent en déplacement, je n'ai pas eu de vrai point depuis la première semaine. Et mes missions ne sont pas très claires — on me donne des tâches au fil de l'eau sans vision d'ensemble." },
    { role: "assistant", content: "D'accord. Comment vous êtes-vous débrouillé dans ce contexte ?" },
    { role: "user", content: "J'ai essayé de me rapprocher des collègues mais chacun est très pris sur ses projets. J'ai l'impression de déranger quand je pose des questions." },
    { role: "assistant", content: "Quel a été le moment le plus marquant de votre premier mois ?" },
    { role: "user", content: "Quand j'ai livré un premier document sans savoir que le format avait changé. Personne ne m'avait prévenu et mon manager m'a fait la remarque en réunion devant tout le monde." },
    { role: "assistant", content: "C'est une situation difficile. Avez-vous pu en discuter avec votre manager ensuite ?" },
    { role: "user", content: "Non, pas vraiment. Il est passé à autre chose. Mais ça m'a refroidi." },
    { role: "assistant", content: "Comment décririez-vous la communication au sein de votre équipe ?" },
    { role: "user", content: "C'est très informel. Beaucoup de choses se disent à l'oral ou en apart. Quand on est nouveau, on rate une bonne partie des informations." },
    { role: "assistant", content: "Y a-t-il un sujet sur lequel vous aimeriez plus d'accompagnement ?" },
    { role: "user", content: "Plus de structure dans l'onboarding. Un planning de montée en compétence, des objectifs clairs, et surtout des points réguliers avec mon manager." },
    { role: "assistant", content: "Merci Thomas pour cette transparence. Ces retours sont importants. Vous pouvez cliquer sur \"Terminer\" pour clôturer l'échange." },
  ];

  for (const msg of s2Messages) {
    await prisma.interviewMessage.create({
      data: { sessionId: session2.id, role: msg.role, content: msg.content },
    });
  }

  await prisma.interviewAnalysis.create({
    data: {
      sessionId: session2.id,
      summary: JSON.stringify({
        satisfaction_score: 5,
        integration_quality: "low",
        positive_themes: ["Volonté de bien faire", "Initiative personnelle"],
        negative_themes: ["Manager absent", "Missions floues", "Feedback public négatif", "Communication informelle", "Isolement ressenti"],
        departure_risk: "high",
        suggestions: ["Instaurer des points hebdo obligatoires avec le manager", "Définir un plan d'onboarding structuré avec objectifs", "Formaliser les process de communication", "Sensibiliser le manager au feedback constructif"],
      }),
      rawAnalysis: "Thomas présente un cas d'intégration préoccupant (5/10). L'absence du manager et le manque de structure dans l'onboarding créent un sentiment d'isolement et de confusion. L'épisode du feedback négatif en public a marqué négativement le début de parcours. La communication très informelle pénalise les nouveaux arrivants. Le risque de départ est élevé si aucune action corrective n'est mise en place rapidement.",
    },
  });

  // Session 3 — Julie, completed 5 days ago
  const s3Start = daysAgo(5);
  const session3 = await prisma.interviewSession.create({
    data: {
      interviewResourceId: interview1.id,
      participantName: "Julie",
      status: "completed",
      startedAt: s3Start,
      completedAt: minutesAfter(s3Start, 12),
    },
  });

  const s3Messages = [
    { role: "assistant", content: "Bonjour Julie, merci pour votre disponibilité. Sur une échelle de 1 à 10, comment évaluez-vous votre intégration ?" },
    { role: "user", content: "9 ! Je suis vraiment contente de mon arrivée ici." },
    { role: "assistant", content: "Qu'est-ce qui rend cette expérience aussi positive ?" },
    { role: "user", content: "Tout était préparé : mon bureau, mon ordinateur, un planning d'onboarding sur 2 semaines. Mon manager avait même prévu des déjeuners avec les différentes équipes." },
    { role: "assistant", content: "Quel a été le moment le plus marquant de votre premier mois ?" },
    { role: "user", content: "Le hackathon interne. J'ai pu contribuer dès ma deuxième semaine et proposer une idée qui a été retenue. Ça m'a donné un vrai sentiment d'appartenance." },
    { role: "assistant", content: "Avez-vous identifié un point bloquant dans vos premières missions ?" },
    { role: "user", content: "Rien de bloquant. Le seul bémol c'est l'accès aux outils de prod — il a fallu 3 semaines pour avoir tous mes accès, mais c'est un sujet IT, pas humain." },
    { role: "assistant", content: "Merci Julie, c'est un retour très encourageant. Vous pouvez cliquer sur \"Terminer\"." },
  ];

  for (const msg of s3Messages) {
    await prisma.interviewMessage.create({
      data: { sessionId: session3.id, role: msg.role, content: msg.content },
    });
  }

  await prisma.interviewAnalysis.create({
    data: {
      sessionId: session3.id,
      summary: JSON.stringify({
        satisfaction_score: 9,
        integration_quality: "high",
        positive_themes: ["Onboarding structuré", "Manager impliqué", "Déjeuners inter-équipes", "Hackathon inclusif", "Sentiment d'appartenance rapide"],
        negative_themes: ["Délai accès outils IT (3 semaines)"],
        departure_risk: "low",
        suggestions: ["Accélérer le provisioning IT pour les nouveaux arrivants"],
      }),
      rawAnalysis: "Julie présente un cas d'intégration exemplaire (9/10). L'onboarding structuré, l'implication du manager et les initiatives sociales (déjeuners, hackathon) ont créé un sentiment d'appartenance rapide. Seul point d'amélioration : le délai de provisioning IT. Risque de départ très faible.",
    },
  });

  // Session 4 — Karim, in progress
  const s4Start = daysAgo(1);
  await prisma.interviewSession.create({
    data: {
      interviewResourceId: interview1.id,
      participantName: "Karim",
      status: "in_progress",
      startedAt: s4Start,
    },
  });

  // ============================================================
  // 2. INTERVIEW LONG — Satisfaction semestrielle
  // ============================================================
  const interview2 = await prisma.interviewResource.create({
    data: {
      title: "Point satisfaction semestriel",
      description: "Entretien semestriel pour mesurer la satisfaction globale des collaborateurs et identifier les leviers d'engagement.",
      type: "interview",
      theme: "satisfaction",
      tone: "direct",
      scopeIn: "Satisfaction globale, conditions de travail, évolution de carrière, relation managériale, équilibre vie pro/perso, outils et environnement de travail",
      scopeOut: "Rémunération individuelle, noms de collègues spécifiques, conflits personnels",
      anchorQuestions: JSON.stringify([
        "Comment décririez-vous votre niveau de satisfaction au travail en ce moment ?",
        "Qu'est-ce qui vous motive le plus dans votre poste actuel ?",
      ]),
      checkpointQuestions: JSON.stringify([
        "Avez-vous le sentiment d'évoluer professionnellement ?",
        "Comment évaluez-vous votre équilibre vie professionnelle / vie personnelle ?",
      ]),
      targetDurationMinutes: 20,
      maxQuestions: 25,
      analysisTemplate: JSON.stringify([
        { key: "satisfaction_score", label: "Score de satisfaction", type: "score_1_10", description: "Satisfaction globale" },
        { key: "positive_themes", label: "Points positifs", type: "list", description: "Leviers de satisfaction" },
        { key: "negative_themes", label: "Points négatifs", type: "list", description: "Irritants identifiés" },
        { key: "engagement_level", label: "Niveau d'engagement", type: "score_low_med_high", description: "Engagement perçu" },
        { key: "suggestions", label: "Suggestions", type: "list", description: "Actions recommandées" },
      ]),
      status: "published",
      createdAt: daysAgo(35),
      updatedAt: daysAgo(35),
    },
  });

  // Session — Camille
  const s5Start = daysAgo(28);
  const session5 = await prisma.interviewSession.create({
    data: {
      interviewResourceId: interview2.id,
      participantName: "Camille",
      status: "completed",
      startedAt: s5Start,
      completedAt: minutesAfter(s5Start, 16),
    },
  });

  const s5Messages = [
    { role: "assistant", content: "Bonjour Camille. Comment décririez-vous votre niveau de satisfaction au travail en ce moment ?" },
    { role: "user", content: "Globalement ça va. Je dirais 7 sur 10. J'aime mon métier et l'équipe, mais il y a des frustrations." },
    { role: "assistant", content: "Quelles sont ces frustrations ?" },
    { role: "user", content: "Le manque de visibilité sur mon évolution. Ça fait 2 ans que je suis au même niveau, et mon manager ne m'a jamais parlé de perspectives claires." },
    { role: "assistant", content: "Qu'est-ce qui vous motive le plus dans votre poste actuel ?" },
    { role: "user", content: "Les projets clients. Quand je suis en autonomie sur un dossier de A à Z, je suis dans mon élément." },
    { role: "assistant", content: "Avez-vous le sentiment d'évoluer professionnellement ?" },
    { role: "user", content: "Techniquement oui, j'apprends sur le terrain. Mais en termes de responsabilités et de reconnaissance, non." },
    { role: "assistant", content: "Comment évaluez-vous votre équilibre vie professionnelle / vie personnelle ?" },
    { role: "user", content: "Correct. Le télétravail aide beaucoup. Mais il y a des périodes de rush où c'est compliqué, et personne ne dit merci." },
    { role: "assistant", content: "Merci Camille pour cette transparence. Vous pouvez cliquer sur \"Terminer\"." },
  ];

  for (const msg of s5Messages) {
    await prisma.interviewMessage.create({
      data: { sessionId: session5.id, role: msg.role, content: msg.content },
    });
  }

  await prisma.interviewAnalysis.create({
    data: {
      sessionId: session5.id,
      summary: JSON.stringify({
        satisfaction_score: 7,
        positive_themes: ["Autonomie sur les projets", "Intérêt pour le métier", "Bonne équipe", "Télétravail apprécié"],
        negative_themes: ["Manque de visibilité sur l'évolution", "Pas de reconnaissance", "Absence de feedback positif en rush"],
        engagement_level: "medium",
        suggestions: ["Mettre en place un plan de carrière avec objectifs", "Instaurer des rituels de reconnaissance", "Discuter perspectives d'évolution lors de l'entretien annuel"],
      }),
      rawAnalysis: "Camille présente un profil de satisfaction mitigée (7/10). Elle est motivée par l'autonomie et les projets clients mais frustrée par le manque de perspectives d'évolution et de reconnaissance. L'engagement est moyen — elle pourrait se désengager si ses attentes en termes d'évolution ne sont pas adressées. Le télétravail est un levier de rétention important.",
    },
  });

  // Session — Antoine
  const s6Start = daysAgo(20);
  const session6 = await prisma.interviewSession.create({
    data: {
      interviewResourceId: interview2.id,
      participantName: "Antoine",
      status: "completed",
      startedAt: s6Start,
      completedAt: minutesAfter(s6Start, 22),
    },
  });

  const s6Messages = [
    { role: "assistant", content: "Bonjour Antoine. Comment décririez-vous votre niveau de satisfaction au travail en ce moment ?" },
    { role: "user", content: "3 sur 10. Je suis en train de chercher ailleurs." },
    { role: "assistant", content: "Qu'est-ce qui a mené à cette situation ?" },
    { role: "user", content: "Trop de changements de direction en 6 mois. On refait les mêmes projets 3 fois parce que la stratégie change. C'est usant." },
    { role: "assistant", content: "Comment ça impacte votre quotidien ?" },
    { role: "user", content: "J'ai l'impression que mon travail ne sert à rien. Je passe des semaines sur un livrable et il finit à la poubelle." },
    { role: "assistant", content: "Qu'est-ce qui vous motive le plus dans votre poste actuel ?" },
    { role: "user", content: "Franchement, plus grand chose. Mes collègues sont bien, mais ça ne suffit pas." },
    { role: "assistant", content: "Avez-vous le sentiment d'évoluer professionnellement ?" },
    { role: "user", content: "Non. J'ai l'impression de régresser. On me donne des tâches en dessous de mon niveau parce que les projets ambitieux sont annulés." },
    { role: "assistant", content: "Comment évaluez-vous votre équilibre vie professionnelle / vie personnelle ?" },
    { role: "user", content: "Mauvais. Le stress du travail déborde sur ma vie perso. Je rumine le soir et le week-end." },
    { role: "assistant", content: "Merci Antoine pour votre honnêteté. Ces retours seront traités avec attention. Vous pouvez cliquer sur \"Terminer\"." },
  ];

  for (const msg of s6Messages) {
    await prisma.interviewMessage.create({
      data: { sessionId: session6.id, role: msg.role, content: msg.content },
    });
  }

  await prisma.interviewAnalysis.create({
    data: {
      sessionId: session6.id,
      summary: JSON.stringify({
        satisfaction_score: 3,
        positive_themes: ["Bonne relation avec les collègues"],
        negative_themes: ["Changements stratégiques répétés", "Sentiment d'inutilité", "Sous-emploi des compétences", "Stress impactant la vie perso", "Recherche active d'emploi"],
        engagement_level: "low",
        suggestions: ["Alerte RH : risque de départ imminent", "Entretien manager urgent pour stabiliser le rôle", "Clarifier la stratégie et la feuille de route", "Confier des projets valorisants"],
      }),
      rawAnalysis: "ALERTE — Antoine est en situation critique (3/10) et déclare être en recherche active d'emploi. Les changements stratégiques répétés et le sentiment d'inutilité ont détruit son engagement. Le stress professionnel impacte sa vie personnelle. Sans intervention immédiate (clarification du rôle, projets valorisants, écoute managériale), le départ est quasi-certain à court terme.",
    },
  });

  // ============================================================
  // 3. INTERVIEW LONG — Rétention (draft, pas de sessions)
  // ============================================================
  await prisma.interviewResource.create({
    data: {
      title: "Entretien de rétention Q2",
      description: "Interview ciblée pour les talents identifiés à risque de départ.",
      type: "interview",
      theme: "retention",
      tone: "formel",
      scopeIn: "Satisfaction, perspectives d'évolution, conditions de travail, relation managériale, attractivité du marché",
      scopeOut: "Rémunération précise, offres reçues d'autres entreprises",
      anchorQuestions: JSON.stringify([
        "Comment voyez-vous votre avenir dans l'entreprise à 12 mois ?",
      ]),
      checkpointQuestions: JSON.stringify([
        "Qu'est-ce qui pourrait vous faire hésiter à rester ?",
        "Quel serait votre poste idéal ?",
      ]),
      targetDurationMinutes: 20,
      maxQuestions: 20,
      analysisTemplate: JSON.stringify([
        { key: "departure_risk", label: "Risque de départ", type: "score_low_med_high", description: "Probabilité de départ" },
        { key: "satisfaction_score", label: "Score de satisfaction", type: "score_1_10", description: "Satisfaction globale" },
        { key: "retention_factors", label: "Facteurs de rétention", type: "list", description: "Ce qui retient le collaborateur" },
        { key: "push_factors", label: "Facteurs de push", type: "list", description: "Ce qui pourrait le faire partir" },
        { key: "suggestions", label: "Suggestions", type: "list", description: "Actions pour retenir" },
      ]),
      status: "draft",
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    },
  });

  // ============================================================
  // 4. PULSE — Bien-être hebdomadaire
  // ============================================================
  const pulse1 = await prisma.interviewResource.create({
    data: {
      title: "Bien-être hebdomadaire",
      description: "Pulse récurrent pour suivre le bien-être des équipes au fil des semaines.",
      type: "pulse",
      theme: "satisfaction",
      tone: "bienveillant",
      pulseQuestion: "Comment évaluez-vous votre bien-être au travail cette semaine ?",
      pulseFrequency: "weekly",
      pulseMaxFollowUps: 3,
      maxQuestions: 3,
      targetDurationMinutes: 3,
      status: "published",
      createdAt: daysAgo(42),
      updatedAt: daysAgo(42),
    },
  });

  // Pulse sessions — simulate 4 weeks of data
  const pulseParticipants = [
    { name: "Marie", scores: [8, 9, 7, 8] },
    { name: "Thomas", scores: [5, 4, 6, 5] },
    { name: "Julie", scores: [9, 8, 9, 10] },
    { name: "Camille", scores: [7, 7, 6, 7] },
    { name: "Antoine", scores: [4, 3, 3, 2] },
  ];

  const pulseConversations: Record<string, { msgs: { role: string; content: string }[]; analysis: Record<string, unknown> }[]> = {
    Marie: [
      {
        msgs: [
          { role: "assistant", content: "C'est un bon score. Qu'est-ce qui a bien fonctionné pour vous cette semaine ?" },
          { role: "user", content: "Mon projet avance bien et j'ai eu de bons retours de mon manager." },
          { role: "assistant", content: "Merci pour ce retour. Vous pouvez maintenant fermer cette page." },
        ],
        analysis: { sentiment: "positif", keyInsight: "Progression projet et reconnaissance managériale", themes: ["Avancement projet", "Feedback positif"], verbatim: "Mon projet avance bien et j'ai eu de bons retours de mon manager.", actionSuggestion: null },
      },
    ],
    Thomas: [
      {
        msgs: [
          { role: "assistant", content: "Je vois que le score est mitigé. Qu'est-ce qui a été difficile cette semaine ?" },
          { role: "user", content: "Toujours le même problème : je n'ai pas de visibilité sur mes priorités. Mon manager ne répond pas à mes messages." },
          { role: "assistant", content: "Comment ça impacte votre travail au quotidien ?" },
          { role: "user", content: "Je fais les choses à l'aveugle. Et quand c'est pas ce qui était attendu, on me le reproche." },
          { role: "assistant", content: "Merci pour cette transparence. Vous pouvez maintenant fermer cette page." },
        ],
        analysis: { sentiment: "négatif", keyInsight: "Manque de direction et communication managériale défaillante", themes: ["Absence manager", "Priorités floues", "Communication"], verbatim: "Je fais les choses à l'aveugle. Et quand c'est pas ce qui était attendu, on me le reproche.", actionSuggestion: "Organiser un point de priorisation hebdomadaire avec le manager" },
      },
    ],
    Julie: [
      {
        msgs: [
          { role: "assistant", content: "Excellent score. Qu'est-ce qui a rendu cette semaine particulièrement positive ?" },
          { role: "user", content: "On a lancé un nouveau projet passionnant et toute l'équipe est motivée." },
          { role: "assistant", content: "Merci pour ce retour. Vous pouvez maintenant fermer cette page." },
        ],
        analysis: { sentiment: "positif", keyInsight: "Énergie collective autour d'un nouveau projet", themes: ["Nouveau projet", "Cohésion équipe"], verbatim: "On a lancé un nouveau projet passionnant et toute l'équipe est motivée.", actionSuggestion: null },
      },
    ],
    Camille: [
      {
        msgs: [
          { role: "assistant", content: "Score correct. Y a-t-il eu des hauts et des bas cette semaine ?" },
          { role: "user", content: "Semaine classique. Le boulot est intéressant mais la charge est un peu lourde en ce moment." },
          { role: "assistant", content: "Qu'est-ce qui contribue à cette charge ?" },
          { role: "user", content: "Deux collègues en congés, donc je récupère leurs dossiers en plus des miens." },
          { role: "assistant", content: "Merci pour ce retour. Vous pouvez maintenant fermer cette page." },
        ],
        analysis: { sentiment: "mitigé", keyInsight: "Surcharge temporaire due aux absences", themes: ["Charge de travail", "Absences collègues"], verbatim: "Deux collègues en congés, donc je récupère leurs dossiers en plus des miens.", actionSuggestion: "Vérifier la répartition de charge pendant les périodes d'absences" },
      },
    ],
    Antoine: [
      {
        msgs: [
          { role: "assistant", content: "Je vois que le score est bas. Qu'est-ce qui ne va pas en ce moment ?" },
          { role: "user", content: "J'en ai marre. Encore un revirement stratégique cette semaine. Mon projet de 3 mois est annulé." },
          { role: "assistant", content: "Comment vivez-vous cette situation ?" },
          { role: "user", content: "Très mal. J'ai l'impression de perdre mon temps. Je me demande ce que je fais encore là." },
          { role: "assistant", content: "C'est compréhensible. Y a-t-il un élément positif malgré tout ?" },
          { role: "user", content: "Non, franchement non." },
          { role: "assistant", content: "Merci pour votre honnêteté. Vous pouvez maintenant fermer cette page." },
        ],
        analysis: { sentiment: "négatif", keyInsight: "Démotivation profonde après annulation de projet", themes: ["Annulation projet", "Perte de sens", "Désengagement"], verbatim: "J'ai l'impression de perdre mon temps. Je me demande ce que je fais encore là.", actionSuggestion: "ALERTE : entretien manager urgent, risque de départ élevé" },
      },
    ],
  };

  for (const participant of pulseParticipants) {
    for (let week = 0; week < participant.scores.length; week++) {
      const weekDaysAgo = 28 - week * 7;
      const pStart = daysAgo(weekDaysAgo);
      const score = participant.scores[week];

      const ps = await prisma.interviewSession.create({
        data: {
          interviewResourceId: pulse1.id,
          participantName: participant.name,
          status: "completed",
          pulseScore: score,
          startedAt: pStart,
          completedAt: minutesAfter(pStart, 2),
        },
      });

      // Add conversation for the most recent week only (to avoid too much data)
      const convData = pulseConversations[participant.name]?.[0];
      if (week === participant.scores.length - 1 && convData) {
        for (const msg of convData.msgs) {
          await prisma.interviewMessage.create({
            data: { sessionId: ps.id, role: msg.role, content: msg.content },
          });
        }
        await prisma.interviewAnalysis.create({
          data: {
            sessionId: ps.id,
            summary: JSON.stringify(convData.analysis),
            rawAnalysis: `Pulse analysis for ${participant.name} — Score: ${score}/10. ${convData.analysis.keyInsight}`,
          },
        });
      }
    }
  }

  // ============================================================
  // 5. PULSE — Onboarding S+2
  // ============================================================
  const pulse2 = await prisma.interviewResource.create({
    data: {
      title: "Pulse onboarding S+2",
      description: "Check-in rapide à la fin de la 2ème semaine d'intégration.",
      type: "pulse",
      theme: "onboarding",
      tone: "bienveillant",
      pulseQuestion: "Comment jugez-vous votre intégration dans l'équipe à ce stade ?",
      pulseFrequency: "biweekly",
      pulseMaxFollowUps: 3,
      maxQuestions: 3,
      targetDurationMinutes: 3,
      status: "published",
      createdAt: daysAgo(14),
      updatedAt: daysAgo(14),
    },
  });

  // 2 sessions for pulse2
  const p2s1Start = daysAgo(10);
  const p2s1 = await prisma.interviewSession.create({
    data: {
      interviewResourceId: pulse2.id,
      participantName: "Léa",
      status: "completed",
      pulseScore: 8,
      startedAt: p2s1Start,
      completedAt: minutesAfter(p2s1Start, 2),
    },
  });

  for (const msg of [
    { role: "assistant", content: "Bonne note. Qu'est-ce qui facilite votre intégration ?" },
    { role: "user", content: "L'équipe est accueillante et mon buddy m'aide beaucoup sur les process." },
    { role: "assistant", content: "Merci pour ce retour. Vous pouvez maintenant fermer cette page." },
  ]) {
    await prisma.interviewMessage.create({
      data: { sessionId: p2s1.id, role: msg.role, content: msg.content },
    });
  }

  await prisma.interviewAnalysis.create({
    data: {
      sessionId: p2s1.id,
      summary: JSON.stringify({ sentiment: "positif", keyInsight: "Intégration facilitée par le buddy et l'accueil de l'équipe", themes: ["Buddy system", "Accueil équipe"], verbatim: "L'équipe est accueillante et mon buddy m'aide beaucoup sur les process.", actionSuggestion: null }),
      rawAnalysis: "Léa — Score 8/10. Intégration positive grâce au buddy system et à l'accueil de l'équipe.",
    },
  });

  const p2s2Start = daysAgo(8);
  const p2s2 = await prisma.interviewSession.create({
    data: {
      interviewResourceId: pulse2.id,
      participantName: "Romain",
      status: "completed",
      pulseScore: 5,
      startedAt: p2s2Start,
      completedAt: minutesAfter(p2s2Start, 3),
    },
  });

  for (const msg of [
    { role: "assistant", content: "Score mitigé. Qu'est-ce qui pourrait être amélioré dans votre intégration ?" },
    { role: "user", content: "Je n'ai pas encore eu de vrai onboarding technique. Je suis livré à moi-même sur les outils." },
    { role: "assistant", content: "Avez-vous pu en parler à votre manager ?" },
    { role: "user", content: "Oui, il m'a dit qu'il allait organiser quelque chose mais rien n'est venu pour l'instant." },
    { role: "assistant", content: "Merci pour ce retour. Vous pouvez maintenant fermer cette page." },
  ]) {
    await prisma.interviewMessage.create({
      data: { sessionId: p2s2.id, role: msg.role, content: msg.content },
    });
  }

  await prisma.interviewAnalysis.create({
    data: {
      sessionId: p2s2.id,
      summary: JSON.stringify({ sentiment: "mitigé", keyInsight: "Onboarding technique manquant malgré les promesses du manager", themes: ["Onboarding technique absent", "Promesse non tenue"], verbatim: "Il m'a dit qu'il allait organiser quelque chose mais rien n'est venu.", actionSuggestion: "Planifier une session de formation technique cette semaine" }),
      rawAnalysis: "Romain — Score 5/10. L'onboarding technique n'a pas été mis en place malgré la demande. Risque de frustration croissante.",
    },
  });

  return NextResponse.json({
    message: "Seed completed",
    data: {
      interviews: [
        { id: interview1.id, title: interview1.title, sessions: 4 },
        { id: interview2.id, title: interview2.title, sessions: 2 },
      ],
      pulses: [
        { id: pulse1.id, title: pulse1.title, sessions: 20 },
        { id: pulse2.id, title: pulse2.title, sessions: 2 },
      ],
    },
  });
}
