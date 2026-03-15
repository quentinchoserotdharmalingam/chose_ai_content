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
