"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  RotateCcw,
  UserCircle,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScenariosContent } from "@/types";

interface Props {
  content: object;
}

interface ChoiceRecord {
  stepId: string;
  choiceLabel: string;
  quality: "optimal" | "acceptable" | "poor";
  feedback: string;
}

export function ScenariosRenderer({ content }: Props) {
  const data = content as ScenariosContent;
  const [currentStepId, setCurrentStepId] = useState(data.steps?.[0]?.id || "");
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [choices, setChoices] = useState<ChoiceRecord[]>([]);
  const [showConclusion, setShowConclusion] = useState(false);

  const steps = data.steps || [];
  const currentStep = steps.find((s) => s.id === currentStepId);
  const currentStepIndex = steps.findIndex((s) => s.id === currentStepId);
  const total = steps.length;

  const stats = useMemo(() => {
    const optimal = choices.filter((c) => c.quality === "optimal").length;
    const acceptable = choices.filter((c) => c.quality === "acceptable").length;
    const poor = choices.filter((c) => c.quality === "poor").length;
    const score = choices.length > 0
      ? Math.round(((optimal * 2 + acceptable) / (choices.length * 2)) * 100)
      : 0;
    return { optimal, acceptable, poor, score };
  }, [choices]);

  const handleChoiceSelect = (index: number) => {
    if (showFeedback || !currentStep) return;
    setSelectedChoice(index);
    setShowFeedback(true);

    const choice = currentStep.choices[index];
    setChoices((prev) => [
      ...prev.filter((c) => c.stepId !== currentStep.id),
      {
        stepId: currentStep.id,
        choiceLabel: choice.label,
        quality: choice.quality,
        feedback: choice.feedback,
      },
    ]);
  };

  const handleContinue = useCallback(() => {
    if (!currentStep || selectedChoice === null) return;
    const choice = currentStep.choices[selectedChoice];

    setShowFeedback(false);
    setSelectedChoice(null);

    if (choice.nextStepId === "conclusion" || !steps.find((s) => s.id === choice.nextStepId)) {
      setShowConclusion(true);
    } else {
      setCurrentStepId(choice.nextStepId);
    }
  }, [currentStep, selectedChoice, steps]);

  const handleReset = () => {
    setCurrentStepId(data.steps?.[0]?.id || "");
    setSelectedChoice(null);
    setShowFeedback(false);
    setChoices([]);
    setShowConclusion(false);
  };

  if (!currentStep && !showConclusion) {
    return <p className="text-gray-500">Pas de scénario disponible</p>;
  }

  const qualityConfig = {
    optimal: {
      label: "Excellent choix",
      icon: CheckCircle2,
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      iconColor: "text-green-600",
    },
    acceptable: {
      label: "Choix acceptable",
      icon: AlertCircle,
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-800",
      iconColor: "text-amber-600",
    },
    poor: {
      label: "Choix risqué",
      icon: XCircle,
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      iconColor: "text-red-600",
    },
  };

  // Conclusion screen
  if (showConclusion) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-coral-light">
            <Trophy className="h-8 w-8 text-coral" />
          </div>
          <h3 className="text-xl font-bold">{data.title}</h3>
          <p className="mt-1 text-sm text-gray-500">Scénario terminé</p>
        </div>

        {/* Score */}
        <div className="rounded-xl border-2 border-ht-primary/30 bg-coral-light p-6 text-center">
          <p className="text-4xl font-bold text-coral">{stats.score}%</p>
          <p className="mt-1 text-sm text-coral">Score de pertinence</p>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.optimal}</p>
            <p className="text-xs text-green-700">Optimaux</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.acceptable}</p>
            <p className="text-xs text-amber-700">Acceptables</p>
          </div>
          <div className="rounded-lg bg-red-50 p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.poor}</p>
            <p className="text-xs text-red-700">À éviter</p>
          </div>
        </div>

        {/* Path review */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Votre parcours :</p>
          <div className="space-y-2">
            {choices.map((choice, i) => {
              const cfg = qualityConfig[choice.quality];
              const Icon = cfg.icon;
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 rounded-lg border p-3 ${cfg.border} ${cfg.bg}`}
                >
                  <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${cfg.iconColor}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{choice.choiceLabel}</p>
                    <p className="mt-0.5 text-xs text-gray-600">{choice.feedback}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conclusion */}
        <div className="rounded-xl border-2 border-ht-primary/30 bg-gradient-to-br from-ht-primary-warm to-ht-primary-warm/50 p-5">
          <p className="mb-2 text-xs font-semibold uppercase text-coral">Conclusion</p>
          <p className="text-sm leading-relaxed text-coral-dark">{data.conclusion}</p>
        </div>

        <Button onClick={handleReset} variant="outline" className="w-full">
          <RotateCcw className="mr-2 h-4 w-4" />
          Recommencer le scénario
        </Button>
      </div>
    );
  }

  const progress = total > 0 ? Math.round(((currentStepIndex + 1) / total) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold">{data.title}</h3>
        {data.description && <p className="mt-0.5 text-sm text-gray-500">{data.description}</p>}
      </div>

      {/* Role badge */}
      {data.role && (
        <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2 text-sm text-purple-700">
          <UserCircle className="h-4 w-4 flex-shrink-0" />
          <span>Vous incarnez : <strong>{data.role}</strong></span>
        </div>
      )}

      {/* Context (only on first step) */}
      {currentStepIndex === 0 && !showFeedback && choices.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700"
        >
          {data.context}
        </motion.div>
      )}

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
            <motion.div
              className="h-full rounded-full bg-purple-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xs tabular-nums text-gray-400">
            {currentStepIndex + 1}/{total}
          </span>
        </div>

        {/* Step dots */}
        <div className="flex gap-1">
          {steps.map((s, i) => {
            const record = choices.find((c) => c.stepId === s.id);
            const isCurrent = i === currentStepIndex;
            return (
              <div
                key={s.id}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  isCurrent
                    ? "bg-purple-600"
                    : record?.quality === "optimal"
                    ? "bg-green-400"
                    : record?.quality === "acceptable"
                    ? "bg-amber-400"
                    : record?.quality === "poor"
                    ? "bg-red-400"
                    : "bg-gray-200"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Choices made counter */}
      {choices.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>{choices.length} décision{choices.length > 1 ? "s" : ""} prise{choices.length > 1 ? "s" : ""}</span>
          <span>·</span>
          <span className="text-green-600">{stats.optimal} optimal{stats.optimal > 1 ? "es" : ""}</span>
        </div>
      )}

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25 }}
        >
          {/* Narrative */}
          <div className="rounded-xl border-2 border-gray-200 bg-white p-5 sm:p-6">
            <p className="text-sm leading-relaxed text-gray-800">{currentStep!.narrative}</p>
          </div>

          {/* Choices or feedback */}
          <div className="mt-4">
            {showFeedback && selectedChoice !== null ? (
              <FeedbackPanel
                choice={currentStep!.choices[selectedChoice]}
                config={qualityConfig}
                onContinue={handleContinue}
              />
            ) : (
              <div className="space-y-2">
                <p className="mb-1 text-xs font-medium uppercase text-gray-400">
                  Que faites-vous ?
                </p>
                {currentStep!.choices.map((choice, i) => (
                  <motion.button
                    key={i}
                    onClick={() => handleChoiceSelect(i)}
                    whileTap={{ scale: 0.98 }}
                    className="flex w-full items-center gap-3 rounded-lg border-2 border-gray-200 bg-white p-4 text-left text-sm transition-colors hover:border-purple-300 hover:bg-purple-50"
                  >
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1 font-medium">{choice.label}</span>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Reset */}
      <div className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RotateCcw className="mr-1 h-4 w-4" />
          Recommencer
        </Button>
      </div>
    </div>
  );
}

// --- Feedback Panel ---
function FeedbackPanel({
  choice,
  config,
  onContinue,
}: {
  choice: ScenariosContent["steps"][number]["choices"][number];
  config: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; bg: string; border: string; text: string; iconColor: string }>;
  onContinue: () => void;
}) {
  const cfg = config[choice.quality];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className={`rounded-xl border-2 ${cfg.border} ${cfg.bg} p-4`}>
        <div className="mb-2 flex items-center gap-2">
          <Icon className={`h-5 w-5 ${cfg.iconColor}`} />
          <span className={`text-sm font-semibold ${cfg.text}`}>{cfg.label}</span>
        </div>
        <p className={`text-sm leading-relaxed ${cfg.text}`}>{choice.feedback}</p>
      </div>

      <Button onClick={onContinue} className="w-full">
        {choice.nextStepId === "conclusion" ? "Voir la conclusion" : "Continuer"}
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </motion.div>
  );
}
