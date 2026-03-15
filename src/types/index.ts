export type FormatSlug = "synthese" | "flashcards" | "chat" | "module" | "scenarios";

export type ResourceStatus = "draft" | "analyzed" | "generated" | "published";

export interface SyntheseContent {
  title: string;
  duration: string;
  sections: Array<{
    heading: string;
    content: string;
    keyPoints?: string[];
  }>;
  takeaways: string[];
}

export interface FlashcardsContent {
  title: string;
  cards: Array<{
    id: number;
    question: string;
    answer: string;
    hint?: string;
    difficulty: "easy" | "medium" | "hard";
  }>;
}

export interface ModuleContent {
  title: string;
  estimatedDuration: string;
  steps: Array<{
    id: number;
    type: "lesson" | "quiz";
    title?: string;
    content?: string;
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
  context: string;
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

export interface ExtensionConfig {
  enabled: boolean;
  /** Delay in days after completion (null = immediate) */
  delayDays?: number | null;
  /** Extension-specific settings */
  settings?: Record<string, unknown>;
}

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
