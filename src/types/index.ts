export type FormatSlug = "synthese" | "flashcards" | "chat" | "module" | "scenarios";

export type ResourceStatus = "draft" | "analyzed" | "generated" | "published";

export interface SyntheseContent {
  title: string;
  duration: string;
  introduction?: string;
  sections: Array<{
    emoji?: string;
    heading: string;
    content: string;
    keyPoints?: string[];
    highlight?: string;
  }>;
  takeaways: string[];
}

export interface FlashcardsContent {
  title: string;
  description?: string;
  cards: Array<{
    id: number;
    question: string;
    answer: string;
    hint?: string;
    category?: string;
    difficulty: "easy" | "medium" | "hard";
  }>;
}

export interface ModuleContent {
  title: string;
  description?: string;
  estimatedDuration: string;
  objective?: string;
  steps: Array<{
    id: number;
    type: "lesson" | "quiz";
    title?: string;
    content?: string;
    keyPoints?: string[];
    example?: string;
    question?: string;
    options?: Array<{
      label: string;
      correct: boolean;
      explanation: string;
    }>;
  }>;
}

export interface ScenariosContent {
  title: string;
  description?: string;
  context: string;
  role?: string;
  steps: Array<{
    id: string;
    narrative: string;
    choices: Array<{
      label: string;
      nextStepId: string;
      feedback: string;
      quality: "optimal" | "acceptable" | "poor";
    }>;
  }>;
  conclusion: string;
}

export interface AnalysisResult {
  topics: string[];
  complexity: "beginner" | "intermediate" | "advanced";
  keyThemes: string[];
  suggestedObjectives: string[];
  summary: string;
  wordCount: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// --- Extensions ---

export type ExtensionSlug =
  | "rappels"
  | "connexion"
  | "questionnaire"
  | "email"
  | "defi"
  | "attestation";

/** Roles assignable to extension actions */
export type AssigneeRole = "manager" | "parrain" | "gestionnaire_rh";

export const ASSIGNEE_ROLES: { value: AssigneeRole; label: string }[] = [
  { value: "manager", label: "Manager" },
  { value: "parrain", label: "Parrain / Buddy" },
  { value: "gestionnaire_rh", label: "Gestionnaire RH" },
];

// --- Per-extension settings ---

export interface RappelContent {
  /** Title for this reminder */
  title: string;
  /** Body content (markdown-like) */
  body: string;
}

export interface RappelSettings {
  /** Per-reminder content keyed by delay day */
  reminders: {
    1: RappelContent;
    7: RappelContent;
    30: RappelContent;
  };
  /** Whether the content was AI-generated */
  aiGenerated?: boolean;
}

export interface ConnexionSettings {
  /** Type of event */
  eventType: "reunion" | "cafe_virtuel" | "atelier" | "shadowing";
  /** How to assign the event partner */
  assigneeType: "role" | "user" | "none";
  /** Role if assigneeType is "role" */
  assigneeRole?: AssigneeRole;
  /** Specific user email/name if assigneeType is "user" */
  assigneeUser?: string;
  /** Event title */
  title?: string;
  /** Event description */
  description?: string;
  /** Duration in minutes */
  durationMinutes?: number;
}

export interface EmailSettings {
  /** How to pick the recipient */
  recipientType: "role" | "user";
  /** Role if recipientType is "role" */
  recipientRole?: AssigneeRole;
  /** Specific user email if recipientType is "user" */
  recipientUser?: string;
  /** Email subject */
  subject: string;
  /** Email body (can be AI-generated) */
  body: string;
  /** Whether the body was AI-generated */
  aiGenerated?: boolean;
}

export interface QuestionnaireSettings {
  /** Number of questions to generate */
  questionCount: number;
  /** Pass threshold percentage (0-100) */
  passThreshold: number;
  /** Difficulty */
  difficulty: "easy" | "mixed" | "hard";
}

export interface DefiSettings {
  /** Challenge title */
  title: string;
  /** Challenge description / instructions */
  description: string;
  /** Duration in days */
  durationDays: number;
  /** Assign a validator */
  validatorType: "role" | "user" | "auto";
  /** Role if validatorType is "role" */
  validatorRole?: AssigneeRole;
  /** Specific user if validatorType is "user" */
  validatorUser?: string;
}

export interface AttestationSettings {
  /** Type of attestation */
  templateType: "completion" | "success" | "custom";
  /** Include completion date */
  includeDate: boolean;
  /** Include score if applicable */
  includeScore: boolean;
  /** Custom title */
  customTitle?: string;
}

export type ExtensionSettingsMap = {
  rappels: RappelSettings;
  connexion: ConnexionSettings;
  questionnaire: QuestionnaireSettings;
  email: EmailSettings;
  defi: DefiSettings;
  attestation: AttestationSettings;
};

export interface ExtensionConfig {
  enabled: boolean;
  /** Delay in days after completion (null = immediate) */
  delayDays?: number | null;
  /** Extension-specific settings */
  settings?: Record<string, unknown>;
}

/** Default settings for each extension */
export const DEFAULT_EXTENSION_SETTINGS: ExtensionSettingsMap = {
  rappels: {
    reminders: {
      1: { title: "", body: "" },
      7: { title: "", body: "" },
      30: { title: "", body: "" },
    },
    aiGenerated: false,
  },
  connexion: {
    eventType: "reunion",
    assigneeType: "role",
    assigneeRole: "manager",
    durationMinutes: 30,
  },
  questionnaire: {
    questionCount: 5,
    passThreshold: 80,
    difficulty: "mixed",
  },
  email: {
    recipientType: "role",
    recipientRole: "manager",
    subject: "",
    body: "",
    aiGenerated: false,
  },
  defi: {
    title: "",
    description: "",
    durationDays: 7,
    validatorType: "role",
    validatorRole: "manager",
  },
  attestation: {
    templateType: "completion",
    includeDate: true,
    includeScore: false,
  },
};

export interface GeneratedAction {
  extensionSlug: ExtensionSlug;
  label: string;
  heyteamObject: string;
  triggerLabel: string;
  delayDays: number | null;
}

export const EXTENSION_META: Record<
  ExtensionSlug,
  {
    label: string;
    icon: string;
    description: string;
    heyteamObject: string;
    defaultDelayDays: number | null;
    delayConfigurable: boolean;
    /** For rappels: multiple actions generated */
    multiAction?: { delaysDays: number[]; labels: string[] };
  }
> = {
  rappels: {
    label: "Rappels espacés",
    icon: "⏰",
    description:
      "Envoie des rappels de révision à intervalles croissants pour ancrer la mémorisation",
    heyteamObject: "Ressource formation",
    defaultDelayDays: null,
    delayConfigurable: false,
    multiAction: {
      delaysDays: [1, 7, 30],
      labels: ["Rappel J+1", "Rappel J+7", "Rappel J+30"],
    },
  },
  connexion: {
    label: "Connexion",
    icon: "🤝",
    description:
      "Crée un événement ou une tâche pour mettre en pratique avec un pair ou un manager",
    heyteamObject: "Événement / Tâche",
    defaultDelayDays: 3,
    delayConfigurable: true,
  },
  questionnaire: {
    label: "Questionnaire",
    icon: "📝",
    description:
      "Crée un questionnaire natif HeyTeam pour évaluer la compréhension",
    heyteamObject: "Questionnaire natif",
    defaultDelayDays: 0,
    delayConfigurable: true,
  },
  email: {
    label: "Email / Notification",
    icon: "📧",
    description:
      "Envoie un email récapitulatif ou une alerte au manager après complétion",
    heyteamObject: "Email via notifications",
    defaultDelayDays: 0,
    delayConfigurable: false,
  },
  defi: {
    label: "Défi / Challenge",
    icon: "🏆",
    description:
      "Crée un challenge natif pour appliquer les apprentissages en situation réelle",
    heyteamObject: "Challenge natif",
    defaultDelayDays: 7,
    delayConfigurable: true,
  },
  attestation: {
    label: "Attestation",
    icon: "📄",
    description:
      "Génère une attestation ou un document de certification après complétion",
    heyteamObject: "Document dynamique",
    defaultDelayDays: 0,
    delayConfigurable: false,
  },
};

// --- Interview IA ---

export type InterviewResourceType = "interview" | "pulse";

export type InterviewTheme = "onboarding" | "satisfaction" | "retention" | "custom";

export type InterviewTone = "bienveillant" | "formel" | "direct" | "decontracte";

export type InterviewResourceStatus = "draft" | "published";

export type InterviewSessionStatus = "in_progress" | "completed" | "abandoned";

export type PulseFrequency = "weekly" | "biweekly" | "monthly";

export const PULSE_FREQUENCY_META: Record<PulseFrequency, { label: string; days: number }> = {
  weekly: { label: "Hebdomadaire", days: 7 },
  biweekly: { label: "Bi-mensuel", days: 14 },
  monthly: { label: "Mensuel", days: 30 },
};

export interface InterviewConfig {
  title: string;
  description?: string;
  type: InterviewResourceType;
  theme: InterviewTheme;
  customTheme?: string;
  tone: InterviewTone;
  scopeIn?: string;
  scopeOut?: string;
  anchorQuestions: string[];
  checkpointQuestions: string[];
  targetDurationMinutes: number;
  maxQuestions: number;
  analysisTemplate?: AnalysisTemplateDimension[];
  // Pulse-specific
  pulseQuestion?: string;
  pulseFrequency?: PulseFrequency;
  pulseMaxFollowUps?: number;
}

export interface AnalysisTemplateDimension {
  key: string;
  label: string;
  type: "score_1_10" | "score_low_med_high" | "text" | "list" | "boolean";
  description?: string;
}

export interface InterviewAnalysisResult {
  dimensions: Record<string, unknown>;
  keyVerbatims: string[];
  globalSummary: string;
}

export interface InterviewMessageData {
  role: "user" | "assistant";
  content: string;
  isAnchorQuestion?: boolean;
  isCheckpoint?: boolean;
}

export const INTERVIEW_THEME_META: Record<InterviewTheme, { label: string; icon: string; description: string }> = {
  onboarding: {
    label: "Onboarding",
    icon: "🚀",
    description: "Suivi d'intégration des nouveaux collaborateurs",
  },
  satisfaction: {
    label: "Satisfaction",
    icon: "😊",
    description: "Mesure de la satisfaction et du bien-être",
  },
  retention: {
    label: "Rétention",
    icon: "🔒",
    description: "Identification des risques de départ",
  },
  custom: {
    label: "Personnalisé",
    icon: "⚙️",
    description: "Thème d'interview sur mesure",
  },
};

export const INTERVIEW_TONE_META: Record<InterviewTone, { label: string; description: string }> = {
  bienveillant: { label: "Bienveillant", description: "Chaleureux et empathique" },
  formel: { label: "Formel", description: "Professionnel et structuré" },
  direct: { label: "Direct", description: "Concis et factuel" },
  decontracte: { label: "Décontracté", description: "Informel et conversationnel" },
};

export const DEFAULT_ANALYSIS_TEMPLATES: Record<Exclude<InterviewTheme, "custom">, AnalysisTemplateDimension[]> = {
  onboarding: [
    { key: "satisfaction_score", label: "Score de satisfaction", type: "score_1_10", description: "Niveau global de satisfaction de l'intégration" },
    { key: "integration_quality", label: "Qualité de l'intégration", type: "score_low_med_high", description: "Évaluation globale du processus d'intégration" },
    { key: "positive_themes", label: "Thèmes positifs", type: "list", description: "Points forts identifiés" },
    { key: "negative_themes", label: "Points d'alerte", type: "list", description: "Difficultés et frustrations" },
    { key: "departure_risk", label: "Risque de départ", type: "score_low_med_high", description: "Indicateur de risque de départ anticipé" },
    { key: "suggestions", label: "Suggestions d'amélioration", type: "list", description: "Actions recommandées" },
  ],
  satisfaction: [
    { key: "satisfaction_score", label: "Score de satisfaction", type: "score_1_10", description: "Niveau global de satisfaction" },
    { key: "positive_themes", label: "Thèmes positifs", type: "list", description: "Sources de satisfaction" },
    { key: "negative_themes", label: "Points de friction", type: "list", description: "Sources d'insatisfaction" },
    { key: "engagement_level", label: "Niveau d'engagement", type: "score_low_med_high", description: "Degré d'implication perçu" },
    { key: "suggestions", label: "Suggestions d'amélioration", type: "list", description: "Pistes d'action" },
  ],
  retention: [
    { key: "departure_risk", label: "Risque de départ", type: "score_low_med_high", description: "Niveau de risque de départ" },
    { key: "satisfaction_score", label: "Score de satisfaction", type: "score_1_10", description: "Satisfaction globale" },
    { key: "retention_factors", label: "Facteurs de rétention", type: "list", description: "Ce qui retient le collaborateur" },
    { key: "push_factors", label: "Facteurs de départ", type: "list", description: "Ce qui pourrait pousser au départ" },
    { key: "looking_elsewhere", label: "Recherche active", type: "boolean", description: "Le collaborateur regarde-t-il ailleurs ?" },
    { key: "suggestions", label: "Actions de rétention", type: "list", description: "Leviers recommandés" },
  ],
};

export const FORMAT_META: Record<FormatSlug, { label: string; icon: string; duration: string; description: string }> = {
  synthese: {
    label: "Synthèse",
    icon: "📋",
    duration: "1-2 min",
    description: "Vue d'ensemble rapide et points clés",
  },
  flashcards: {
    label: "Flashcards",
    icon: "🃏",
    duration: "2-5 min",
    description: "Questions-réponses pour mémoriser",
  },
  chat: {
    label: "Chat questionneur",
    icon: "💬",
    duration: "3-8 min",
    description: "Exploration libre avec l'IA",
  },
  module: {
    label: "Module structuré",
    icon: "📖",
    duration: "5-15 min",
    description: "Apprentissage progressif avec quiz",
  },
  scenarios: {
    label: "Mises en situation",
    icon: "🎭",
    duration: "3-5 min",
    description: "Scénarios interactifs à choix",
  },
};

// --- Agent IA ---

export type AgentCategory = "skill_rh" | "skill_manager" | "custom";
export type AgentTriggerType = "event" | "scheduled";
export type AgentStatus = "draft" | "active" | "paused";

export type SuggestionSeverity = "urgent" | "attention" | "opportunity" | "optimization";
export type SuggestionStatus = "pending" | "accepted" | "customized" | "ignored";
export type ActionType = "email" | "task" | "meeting";

export type EmployeeStatus = "active" | "onleave" | "departing";

export interface AgentActionPreview {
  to?: string;
  subject?: string;
  body?: string;
  date?: string;
  duration?: string;
  participants?: string[];
  note?: string;
}

export interface AgentAction {
  id: number;
  label: string;
  enabled: boolean;
  type?: "email" | "meeting" | "task" | "notification";
  detail?: string;
  preview?: AgentActionPreview;
}

export interface SuggestionContext {
  employeeName: string;
  employeeRole?: string;
  department?: string;
  contractType?: string;
  startDate?: string;
  team?: string;
  additionalInfo?: Record<string, string>;
}

export interface SuggestionActionStep {
  id: number;
  label: string;
  detail?: string;
  type?: "email" | "meeting" | "task" | "notification";
  preview?: {
    to?: string;
    subject?: string;
    body?: string;
    date?: string;
    duration?: string;
    participants?: string[];
    note?: string;
  };
}

export interface SuggestionAlternative {
  label: string;
  description?: string;
}

export interface AgentTemplate {
  templateId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: AgentCategory;
  triggerType: AgentTriggerType;
  triggerLabel: string;
  triggerConfig: Record<string, unknown>;
  infoDescription: string;
  actions: AgentAction[];
}

export const AGENT_CATEGORY_META: Record<AgentCategory, { label: string; description: string }> = {
  skill_rh: { label: "RH", description: "Agents pour les équipes RH" },
  skill_manager: { label: "Managers", description: "Agents pour les managers" },
  custom: { label: "Personnalisé", description: "Agents personnalisés" },
};

export const SUGGESTION_SEVERITY_META: Record<SuggestionSeverity, { label: string; color: string; bgColor: string }> = {
  urgent: { label: "Urgent", color: "#DC2626", bgColor: "#FEF2F2" },
  attention: { label: "Attention", color: "#D97706", bgColor: "#FFFBEB" },
  opportunity: { label: "Opportunité", color: "#2563EB", bgColor: "#EFF6FF" },
  optimization: { label: "Optimisation", color: "#7C3AED", bgColor: "#F5F3FF" },
};

export const SUGGESTION_STATUS_META: Record<SuggestionStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: "En attente", color: "#6B7280", bgColor: "#F3F4F6" },
  accepted: { label: "Validée", color: "#059669", bgColor: "#ECFDF5" },
  customized: { label: "Personnalisée", color: "#2563EB", bgColor: "#EFF6FF" },
  ignored: { label: "Ignorée", color: "#9CA3AF", bgColor: "#F9FAFB" },
};

export const SUGGESTION_CATEGORY_META: Record<string, { label: string; icon: string }> = {
  onboarding: { label: "Onboarding", icon: "🚀" },
  documents: { label: "Documents", icon: "📄" },
  engagement: { label: "Engagement", icon: "💪" },
  management: { label: "Management", icon: "👔" },
  formation: { label: "Formation", icon: "📚" },
  administratif: { label: "Administratif", icon: "📋" },
};

export const AGENT_TEMPLATES: AgentTemplate[] = [
  // --- Skills RH (6) ---
  {
    templateId: "welcome_message",
    name: "Rappel message de bienvenue",
    description: "Détecte les nouveaux collaborateurs sans message de bienvenue et suggère d'en envoyer un",
    icon: "👋",
    color: "#FF6058",
    category: "skill_rh",
    triggerType: "event",
    triggerLabel: "Nouveau collaborateur détecté sans message de bienvenue",
    triggerConfig: { event: "new_employee", delayDays: 1 },
    infoDescription: "Collaborateur sans message de bienvenue envoyé",
    actions: [
      {
        id: 1, label: "Envoyer message de bienvenue", enabled: true,
        type: "email",
        detail: "Email de bienvenue personnalisé au nouveau collaborateur",
        preview: {
          to: "{{collaborateur.prenom}} {{collaborateur.nom}}",
          subject: "Bienvenue chez {{entreprise.nom}}, {{collaborateur.prenom}} !",
          body: "Bonjour {{collaborateur.prenom}},\n\nToute l'équipe {{collaborateur.departement}} est ravie de t'accueillir chez {{entreprise.nom}} !\n\nTon manager {{collaborateur.manager}} sera ton point de contact principal pour ton intégration. N'hésite pas à le/la contacter si tu as des questions.\n\nTu trouveras ci-dessous les informations utiles pour tes premiers jours :\n- Accès à ton espace collaborateur\n- Guide d'onboarding\n- Contacts de ton équipe\n\nÀ très bientôt,\nL'équipe RH",
        },
      },
      {
        id: 2, label: "Notifier le manager", enabled: true,
        type: "email",
        detail: "Informer le manager de l'arrivée imminente",
        preview: {
          to: "{{collaborateur.manager}}",
          subject: "Arrivée de {{collaborateur.prenom}} {{collaborateur.nom}} - Action requise",
          body: "Bonjour,\n\n{{collaborateur.prenom}} {{collaborateur.nom}} ({{collaborateur.poste}}) rejoint votre équipe {{collaborateur.departement}} le {{collaborateur.date_arrivee}}.\n\nMerci de vérifier que tout est prêt pour son arrivée :\n- Poste de travail configuré\n- Accès aux outils nécessaires\n- Premier planning de la semaine\n\nCordialement,\nL'équipe RH",
        },
      },
    ],
  },
  {
    templateId: "doc_incomplete",
    name: "Rappel documents incomplets",
    description: "Relance automatiquement les collaborateurs dont le dossier administratif est incomplet",
    icon: "📄",
    color: "#E9A23B",
    category: "skill_rh",
    triggerType: "event",
    triggerLabel: "Document(s) non complété(s) après N jours",
    triggerConfig: { event: "document_missing", delayDays: 7 },
    infoDescription: "Liste des pièces manquantes par collaborateur",
    actions: [
      {
        id: 1, label: "Relancer le collaborateur", enabled: true,
        type: "email",
        detail: "Email de relance pour documents manquants",
        preview: {
          to: "{{collaborateur.prenom}} {{collaborateur.nom}}",
          subject: "Rappel : documents en attente pour compléter votre dossier",
          body: "Bonjour {{collaborateur.prenom}},\n\nNous avons constaté que certains documents de votre dossier administratif sont encore en attente.\n\nMerci de bien vouloir les transmettre dès que possible afin de finaliser votre intégration.\n\nSi vous rencontrez des difficultés, n'hésitez pas à nous contacter.\n\nCordialement,\nL'équipe RH",
        },
      },
      {
        id: 2, label: "Notifier le RH référent", enabled: true,
        type: "notification",
        detail: "Alerte au RH référent sur les documents manquants",
        preview: {
          to: "RH référent",
          subject: "Documents manquants - {{collaborateur.prenom}} {{collaborateur.nom}}",
          body: "Le dossier de {{collaborateur.prenom}} {{collaborateur.nom}} ({{collaborateur.poste}}, {{collaborateur.departement}}) est incomplet. Merci de faire le suivi.",
        },
      },
    ],
  },
  {
    templateId: "onboarding_satisfaction",
    name: "Alerte satisfaction onboarding",
    description: "Détecte les scores de satisfaction bas pendant l'onboarding et alerte les RH",
    icon: "📊",
    color: "#DC2626",
    category: "skill_rh",
    triggerType: "event",
    triggerLabel: "Score de satisfaction bas détecté",
    triggerConfig: { event: "low_satisfaction", threshold: 5 },
    infoDescription: "Score NPS < seuil et verbatims négatifs",
    actions: [
      {
        id: 1, label: "Alerter le RH", enabled: true,
        type: "email",
        detail: "Alerte RH sur un score de satisfaction bas",
        preview: {
          to: "Équipe RH",
          subject: "⚠️ Score de satisfaction bas - {{collaborateur.prenom}} {{collaborateur.nom}}",
          body: "Bonjour,\n\nLe score de satisfaction de {{collaborateur.prenom}} {{collaborateur.nom}} ({{collaborateur.poste}}, {{collaborateur.departement}}) est en dessous du seuil défini.\n\nUne action rapide est recommandée pour identifier les causes et proposer un accompagnement adapté.\n\nCordialement,\nAgent IA - Alerte Satisfaction",
        },
      },
      {
        id: 2, label: "Suggérer un entretien", enabled: true,
        type: "meeting",
        detail: "Planifier un entretien de suivi avec le collaborateur",
        preview: {
          subject: "Entretien de suivi - {{collaborateur.prenom}} {{collaborateur.nom}}",
          date: "Dans les 48h",
          duration: "30 min",
          participants: ["{{collaborateur.prenom}} {{collaborateur.nom}}", "{{collaborateur.manager}}", "RH référent"],
          note: "Points à aborder : ressenti général, difficultés rencontrées, besoins d'accompagnement, plan d'action.",
        },
      },
    ],
  },
  {
    templateId: "manager_inactive",
    name: "Détection inactivité manager",
    description: "Identifie les managers n'ayant réalisé aucune action depuis N jours",
    icon: "👤",
    color: "#7C3AED",
    category: "skill_rh",
    triggerType: "event",
    triggerLabel: "Manager inactif depuis N jours",
    triggerConfig: { event: "manager_inactive", delayDays: 14 },
    infoDescription: "Manager n'ayant réalisé aucune action depuis X jours",
    actions: [
      {
        id: 1, label: "Notifier le manager", enabled: true,
        type: "email",
        detail: "Rappel au manager inactif",
        preview: {
          to: "{{collaborateur.manager}}",
          subject: "Rappel : actions en attente sur votre équipe",
          body: "Bonjour,\n\nNous avons remarqué qu'aucune action n'a été réalisée sur la plateforme depuis 14 jours.\n\nVos collaborateurs comptent sur votre suivi pour leur intégration. Voici quelques actions que vous pourriez réaliser :\n- Vérifier l'avancement de l'onboarding\n- Planifier un point d'équipe\n- Valider les tâches en attente\n\nCordialement,\nL'équipe RH",
        },
      },
      {
        id: 2, label: "Planifier un meeting", enabled: true,
        type: "meeting",
        detail: "Point de suivi avec le manager",
        preview: {
          subject: "Point de suivi activité managériale",
          date: "Cette semaine",
          duration: "30 min",
          participants: ["{{collaborateur.manager}}", "RH référent"],
          note: "Objectif : faire le point sur l'activité managériale et identifier les besoins de support.",
        },
      },
    ],
  },
  {
    templateId: "weekly_report",
    name: "Rapport hebdomadaire RH",
    description: "Génère et envoie une synthèse hebdomadaire de l'activité RH chaque lundi",
    icon: "📈",
    color: "#2563EB",
    category: "skill_rh",
    triggerType: "scheduled",
    triggerLabel: "Chaque lundi à 9h",
    triggerConfig: { schedule: "weekly", day: "monday", time: "09:00" },
    infoDescription: "Synthèse hebdomadaire de l'activité RH",
    actions: [
      { id: 1, label: "Générer le rapport", enabled: true, type: "task", detail: "Compilation automatique des métriques RH de la semaine", preview: { subject: "Rapport hebdomadaire RH", body: "Génération du rapport incluant :\n- Nouvelles arrivées\n- Documents complétés/en attente\n- Scores de satisfaction\n- Tâches d'onboarding en retard" } },
      { id: 2, label: "Envoyer au RH", enabled: true, type: "email", detail: "Envoi du rapport synthétique par email", preview: { to: "Équipe RH", subject: "📊 Synthèse hebdomadaire RH - Semaine en cours", body: "Bonjour,\n\nVoici la synthèse de l'activité RH de cette semaine.\n\nBonne lecture,\nAgent IA - Rapport Hebdomadaire" } },
    ],
  },
  {
    templateId: "pre_onboarding",
    name: "Vérification pré-onboarding",
    description: "Vérifie que tout est prêt avant l'arrivée d'un nouveau collaborateur (J-7)",
    icon: "✅",
    color: "#059669",
    category: "skill_rh",
    triggerType: "event",
    triggerLabel: "Onboarding dans < 7 jours",
    triggerConfig: { event: "upcoming_onboarding", delayDays: -7 },
    infoDescription: "Checklist des éléments manquants avant arrivée",
    actions: [
      { id: 1, label: "Vérifier les documents", enabled: true, type: "task", detail: "Vérification automatique de la checklist pré-onboarding", preview: { subject: "Vérification pré-onboarding - {{collaborateur.prenom}} {{collaborateur.nom}}", body: "Vérification de la checklist :\n- Contrat signé\n- Documents administratifs\n- Poste de travail\n- Accès informatiques\n- Planning première semaine" } },
      { id: 2, label: "Alerter si incomplet", enabled: true, type: "email", detail: "Alerte aux responsables si des éléments manquent", preview: { to: "{{collaborateur.manager}}, Équipe RH", subject: "⚠️ Éléments manquants avant arrivée de {{collaborateur.prenom}} {{collaborateur.nom}}", body: "Bonjour,\n\n{{collaborateur.prenom}} {{collaborateur.nom}} arrive le {{collaborateur.date_arrivee}} et certains éléments ne sont pas encore prêts.\n\nMerci de vérifier et compléter les éléments manquants dès que possible.\n\nCordialement,\nAgent IA - Pré-onboarding" } },
    ],
  },
  // --- Skills Managers (5) ---
  {
    templateId: "team_dashboard",
    name: "Dashboard équipe",
    description: "Synthèse quotidienne de l'état de l'équipe : onboarding, tâches, engagement",
    icon: "📊",
    color: "#2563EB",
    category: "skill_manager",
    triggerType: "scheduled",
    triggerLabel: "Quotidien à 8h",
    triggerConfig: { schedule: "daily", time: "08:00" },
    infoDescription: "État global de l'équipe (onboarding, tâches, engagement)",
    actions: [
      { id: 1, label: "Afficher métriques", enabled: true, type: "task", detail: "Compilation du dashboard quotidien", preview: { subject: "Dashboard équipe - Synthèse du jour", body: "Indicateurs clés :\n- Onboardings en cours\n- Tâches en retard\n- Scores d'engagement\n- Prochains check-ins" } },
      { id: 2, label: "Alerter si anomalie", enabled: true, type: "notification", detail: "Notification push en cas d'anomalie détectée", preview: { to: "{{collaborateur.manager}}", subject: "Anomalie détectée dans votre équipe", body: "Une anomalie a été détectée dans les indicateurs de votre équipe. Veuillez vérifier le dashboard pour plus de détails." } },
    ],
  },
  {
    templateId: "checkin_reminder",
    name: "Rappel check-in",
    description: "Rappelle au manager qu'un check-in approche (J-2) avec le contexte du collaborateur",
    icon: "🔔",
    color: "#E9A23B",
    category: "skill_manager",
    triggerType: "event",
    triggerLabel: "Check-in approche (J-2)",
    triggerConfig: { event: "upcoming_checkin", delayDays: -2 },
    infoDescription: "Prochain check-in planifié avec contexte",
    actions: [
      { id: 1, label: "Notifier le manager", enabled: true, type: "email", detail: "Rappel du prochain check-in avec contexte", preview: { to: "{{collaborateur.manager}}", subject: "Rappel : check-in prévu avec {{collaborateur.prenom}} {{collaborateur.nom}}", body: "Bonjour,\n\nVous avez un check-in prévu dans 2 jours avec {{collaborateur.prenom}} {{collaborateur.nom}} ({{collaborateur.poste}}).\n\nPoints suggérés :\n- Avancement de l'intégration\n- Difficultés rencontrées\n- Objectifs à court terme\n\nCordialement,\nAgent IA" } },
      { id: 2, label: "Proposer un créneau", enabled: true, type: "meeting", detail: "Proposition automatique d'un créneau de check-in", preview: { subject: "Check-in - {{collaborateur.prenom}} {{collaborateur.nom}}", date: "J+2", duration: "30 min", participants: ["{{collaborateur.manager}}", "{{collaborateur.prenom}} {{collaborateur.nom}}"], note: "Point de suivi d'intégration" } },
    ],
  },
  {
    templateId: "engagement_tracking",
    name: "Suivi engagement",
    description: "Analyse hebdomadaire de l'engagement par collaborateur avec alertes si baisse détectée",
    icon: "💚",
    color: "#059669",
    category: "skill_manager",
    triggerType: "scheduled",
    triggerLabel: "Hebdomadaire",
    triggerConfig: { schedule: "weekly", day: "friday", time: "17:00" },
    infoDescription: "Score d'engagement et tendance par collaborateur",
    actions: [
      { id: 1, label: "Analyser activité", enabled: true, type: "task", detail: "Analyse des indicateurs d'engagement par collaborateur", preview: { subject: "Analyse engagement équipe", body: "Analyse hebdomadaire :\n- Score d'engagement par collaborateur\n- Tendance vs semaine précédente\n- Identification des baisses significatives" } },
      { id: 2, label: "Envoyer rapport", enabled: true, type: "email", detail: "Rapport d'engagement hebdomadaire au manager", preview: { to: "{{collaborateur.manager}}", subject: "📊 Rapport engagement équipe - Semaine en cours", body: "Bonjour,\n\nVoici le rapport d'engagement de votre équipe pour cette semaine.\n\nLes points d'attention et les collaborateurs nécessitant un suivi particulier sont mis en évidence.\n\nCordialement,\nAgent IA - Suivi Engagement" } },
      { id: 3, label: "Alerter si engagement < seuil", enabled: true, type: "notification", detail: "Alerte immédiate si l'engagement passe sous le seuil", preview: { to: "{{collaborateur.manager}}", subject: "⚠️ Baisse d'engagement détectée", body: "L'engagement de {{collaborateur.prenom}} {{collaborateur.nom}} est passé en dessous du seuil défini. Un suivi rapide est recommandé." } },
    ],
  },
  {
    templateId: "task_overdue",
    name: "Nudge tâches en retard",
    description: "Détecte les tâches non complétées après leur deadline et rappelle les concernés",
    icon: "⚠️",
    color: "#DC2626",
    category: "skill_manager",
    triggerType: "event",
    triggerLabel: "Tâche en retard détectée",
    triggerConfig: { event: "task_overdue", delayDays: 1 },
    infoDescription: "Tâches non complétées après deadline",
    actions: [
      { id: 1, label: "Rappeler le collaborateur", enabled: true, type: "email", detail: "Email de rappel pour tâche en retard", preview: { to: "{{collaborateur.prenom}} {{collaborateur.nom}}", subject: "Rappel : tâche en retard", body: "Bonjour {{collaborateur.prenom}},\n\nUne tâche assignée est en retard. Merci de la compléter dès que possible ou de signaler toute difficulté à votre manager.\n\nCordialement,\nL'équipe RH" } },
      { id: 2, label: "Notifier le manager", enabled: true, type: "notification", detail: "Alerte manager sur tâche en retard", preview: { to: "{{collaborateur.manager}}", subject: "Tâche en retard - {{collaborateur.prenom}} {{collaborateur.nom}}", body: "{{collaborateur.prenom}} {{collaborateur.nom}} a une tâche d'onboarding en retard. Merci de faire le suivi." } },
    ],
  },
  {
    templateId: "buddy_inactive",
    name: "Alerte buddy inactif",
    description: "Détecte les buddies n'ayant pas interagi avec le nouveau collaborateur depuis N jours",
    icon: "🤝",
    color: "#7C3AED",
    category: "skill_manager",
    triggerType: "event",
    triggerLabel: "Buddy inactif depuis N jours",
    triggerConfig: { event: "buddy_inactive", delayDays: 5 },
    infoDescription: "Buddy n'ayant pas interagi avec le nouveau",
    actions: [
      { id: 1, label: "Alerter le buddy", enabled: true, type: "email", detail: "Rappel au buddy de prendre contact", preview: { to: "Buddy assigné", subject: "Rappel : votre filleul {{collaborateur.prenom}} attend de vos nouvelles", body: "Bonjour,\n\nVous êtes le buddy de {{collaborateur.prenom}} {{collaborateur.nom}} et il semble que vous n'ayez pas encore eu l'occasion d'échanger.\n\nUn simple message ou un café peut faire une grande différence pour son intégration !\n\nMerci,\nL'équipe RH" } },
      { id: 2, label: "Notifier le RH", enabled: true, type: "notification", detail: "Signaler l'inactivité du buddy au RH", preview: { to: "Équipe RH", subject: "Buddy inactif - {{collaborateur.prenom}} {{collaborateur.nom}}", body: "Le buddy assigné à {{collaborateur.prenom}} {{collaborateur.nom}} n'a pas eu d'interaction depuis 5 jours. Un suivi est peut-être nécessaire." } },
    ],
  },
];
