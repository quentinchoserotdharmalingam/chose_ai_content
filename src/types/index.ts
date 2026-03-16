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

export interface RappelSettings {
  /** What content to show in reminder tasks */
  contentType: "synthese" | "points-cles" | "custom";
  /** Custom content if contentType is "custom" */
  customContent?: string;
  /** Which sections to include (indices) */
  selectedSections?: number[];
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
    contentType: "points-cles",
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
