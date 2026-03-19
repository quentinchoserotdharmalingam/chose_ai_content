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

export interface AgentAction {
  id: number;
  label: string;
  enabled: boolean;
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
      { id: 1, label: "Envoyer message de bienvenue", enabled: true },
      { id: 2, label: "Notifier le manager", enabled: true },
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
      { id: 1, label: "Relancer le collaborateur", enabled: true },
      { id: 2, label: "Notifier le RH référent", enabled: true },
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
      { id: 1, label: "Alerter le RH", enabled: true },
      { id: 2, label: "Suggérer un entretien", enabled: true },
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
      { id: 1, label: "Notifier le manager", enabled: true },
      { id: 2, label: "Planifier un meeting", enabled: true },
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
      { id: 1, label: "Générer le rapport", enabled: true },
      { id: 2, label: "Envoyer au RH", enabled: true },
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
      { id: 1, label: "Vérifier les documents", enabled: true },
      { id: 2, label: "Alerter si incomplet", enabled: true },
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
      { id: 1, label: "Afficher métriques", enabled: true },
      { id: 2, label: "Alerter si anomalie", enabled: true },
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
      { id: 1, label: "Notifier le manager", enabled: true },
      { id: 2, label: "Proposer un créneau", enabled: true },
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
      { id: 1, label: "Analyser activité", enabled: true },
      { id: 2, label: "Envoyer rapport", enabled: true },
      { id: 3, label: "Alerter si engagement < seuil", enabled: true },
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
      { id: 1, label: "Rappeler le collaborateur", enabled: true },
      { id: 2, label: "Notifier le manager", enabled: true },
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
      { id: 1, label: "Alerter le buddy", enabled: true },
      { id: 2, label: "Notifier le RH", enabled: true },
    ],
  },
];
