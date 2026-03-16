"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  BookOpen,
  HelpCircle,
  Trophy,
  RotateCcw,
  Lightbulb,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ModuleContent } from "@/types";

interface Props {
  content: object;
}

interface QuizResult {
  stepId: number;
  correct: boolean;
  selectedIndex: number;
}

export function ModuleRenderer({ content }: Props) {
  const data = content as ModuleContent;
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [direction, setDirection] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());

  const steps = data.steps || [];
  const step = steps[currentStep];
  const total = steps.length;
  const isFirst = currentStep === 0;
  const isLast = currentStep === total - 1;

  const quizSteps = useMemo(() => steps.filter((s) => s.type === "quiz"), [steps]);
  const lessonSteps = useMemo(() => steps.filter((s) => s.type === "lesson"), [steps]);
  const totalQuizzes = quizSteps.length;
  const correctCount = quizResults.filter((r) => r.correct).length;

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > currentStep ? 1 : -1);
      setCurrentStep(index);
      setSelectedOption(null);
      setShowExplanation(false);
    },
    [currentStep]
  );

  const handleNext = () => {
    if (step?.type === "lesson") {
      setCompletedLessons((prev) => new Set(prev).add(step.id));
    }
    if (isLast) {
      setShowResults(true);
    } else {
      goTo(currentStep + 1);
    }
  };

  const handleOptionSelect = (index: number) => {
    if (showExplanation || !step) return;
    setSelectedOption(index);
    setShowExplanation(true);

    const isCorrect = step.options?.[index]?.correct ?? false;
    setQuizResults((prev) => {
      const filtered = prev.filter((r) => r.stepId !== step.id);
      return [...filtered, { stepId: step.id, correct: isCorrect, selectedIndex: index }];
    });
  };

  const handleReset = () => {
    setCurrentStep(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setQuizResults([]);
    setShowResults(false);
    setCompletedLessons(new Set());
    setDirection(0);
  };

  if (!step) return <p className="text-gray-500">Pas de module disponible</p>;

  const progress = Math.round(((currentStep + 1) / total) * 100);
  const score = totalQuizzes > 0 ? Math.round((correctCount / totalQuizzes) * 100) : 0;

  // Check if current quiz already answered
  const existingResult = quizResults.find((r) => r.stepId === step.id);

  // Results screen
  if (showResults) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-coral-light">
            <Trophy className="h-8 w-8 text-coral" />
          </div>
          <h3 className="text-xl font-bold">{data.title}</h3>
          <p className="mt-1 text-sm text-gray-500">Module terminé !</p>
        </div>

        {/* Score */}
        <div className="rounded-xl border-2 border-ht-primary/30 bg-coral-light p-6 text-center">
          <p className="text-4xl font-bold text-coral">{score}%</p>
          <p className="mt-1 text-sm text-coral">
            {correctCount} / {totalQuizzes} quiz réussis
          </p>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{correctCount}</p>
            <p className="text-xs text-green-700">Bonnes réponses</p>
          </div>
          <div className="rounded-lg bg-red-50 p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{totalQuizzes - correctCount}</p>
            <p className="text-xs text-red-700">Erreurs</p>
          </div>
        </div>

        {/* Quiz review */}
        {quizResults.some((r) => !r.correct) && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Questions à revoir :</p>
            <div className="space-y-2">
              {quizResults
                .filter((r) => !r.correct)
                .map((r) => {
                  const s = steps.find((st) => st.id === r.stepId);
                  if (!s) return null;
                  const correctOpt = s.options?.find((o) => o.correct);
                  return (
                    <div key={r.stepId} className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
                      <p className="font-medium">{s.question}</p>
                      <p className="mt-1 text-green-700">✓ {correctOpt?.label}</p>
                      <p className="text-xs text-gray-500">{correctOpt?.explanation}</p>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
          <p>
            {lessonSteps.length} leçons complétées · {totalQuizzes} quiz passés
          </p>
        </div>

        <Button onClick={handleReset} variant="outline" className="w-full">
          <RotateCcw className="mr-2 h-4 w-4" />
          Recommencer le module
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold">{data.title}</h3>
        {data.description && <p className="mt-0.5 text-sm text-gray-500">{data.description}</p>}
      </div>

      {/* Objective badge */}
      {data.objective && (
        <div className="flex items-start gap-2 rounded-lg bg-coral-light px-3 py-2 text-sm text-coral">
          <Target className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{data.objective}</span>
        </div>
      )}

      {/* Progress bar with step indicators */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
            <motion.div
              className="h-full rounded-full bg-coral-light0"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xs tabular-nums text-gray-400">
            {currentStep + 1}/{total}
          </span>
        </div>

        {/* Step dots */}
        <div className="flex gap-1">
          {steps.map((s, i) => {
            const qResult = quizResults.find((r) => r.stepId === s.id);
            const isCompleted = s.type === "lesson" ? completedLessons.has(s.id) : !!qResult;
            const isCurrent = i === currentStep;
            return (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                className={`flex h-6 flex-1 items-center justify-center rounded-md text-xs transition-colors ${
                  isCurrent
                    ? "bg-coral text-white"
                    : qResult?.correct === false
                    ? "bg-red-100 text-red-600"
                    : isCompleted || qResult?.correct
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {s.type === "lesson" ? (
                  <BookOpen className="h-3 w-3" />
                ) : (
                  <HelpCircle className="h-3 w-3" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span>{data.estimatedDuration}</span>
        {quizResults.length > 0 && (
          <>
            <span>·</span>
            <span className="text-green-600">{correctCount}/{totalQuizzes} quiz réussis</span>
          </>
        )}
      </div>

      {/* Step content with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -30 }}
          transition={{ duration: 0.2 }}
        >
          {step.type === "lesson" ? (
            <LessonCard step={step} />
          ) : (
            <QuizCard
              step={step}
              selectedOption={existingResult ? existingResult.selectedIndex : selectedOption}
              showExplanation={!!existingResult || showExplanation}
              onSelect={existingResult ? () => {} : handleOptionSelect}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(currentStep - 1)}
          disabled={isFirst}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          <span className="hidden sm:inline">Précédent</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" />
        </Button>

        {isLast && quizResults.length > 0 ? (
          <Button size="sm" onClick={handleNext}>
            <Trophy className="mr-1 h-4 w-4" />
            Résultats
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleNext}
            disabled={step.type === "quiz" && !showExplanation && !existingResult}
          >
            <span className="hidden sm:inline">{isLast ? "Terminer" : "Continuer"}</span>
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// --- Lesson Card ---
function LessonCard({ step }: { step: ModuleContent["steps"][number] }) {
  return (
    <div className="rounded-xl border-2 border-ht-primary/30 bg-coral-light/50 p-5 sm:p-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral-light">
          <BookOpen className="h-3.5 w-3.5 text-coral" />
        </span>
        <span className="text-xs font-medium uppercase text-coral">Leçon</span>
      </div>

      {step.title && <h4 className="mb-3 text-base font-semibold text-gray-900">{step.title}</h4>}

      {/* Content paragraphs */}
      <div className="space-y-2">
        {step.content
          ?.split("\n")
          .filter(Boolean)
          .map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-gray-700">
              {p}
            </p>
          ))}
      </div>

      {/* Key points */}
      {step.keyPoints && step.keyPoints.length > 0 && (
        <div className="mt-4 rounded-lg bg-white p-3">
          <p className="mb-2 text-xs font-semibold uppercase text-gray-400">À retenir</p>
          <div className="space-y-1.5">
            {step.keyPoints.map((point, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-coral-light0" />
                <span className="text-gray-700">{point}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Example */}
      {step.example && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
          <div>
            <p className="text-xs font-medium text-amber-700">Exemple</p>
            <p className="mt-0.5 text-sm text-amber-800">{step.example}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Quiz Card ---
function QuizCard({
  step,
  selectedOption,
  showExplanation,
  onSelect,
}: {
  step: ModuleContent["steps"][number];
  selectedOption: number | null;
  showExplanation: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="rounded-xl border-2 border-purple-200 bg-purple-50/50 p-5 sm:p-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100">
          <HelpCircle className="h-3.5 w-3.5 text-purple-600" />
        </span>
        <span className="text-xs font-medium uppercase text-purple-600">Quiz</span>
      </div>

      <p className="mb-4 text-base font-medium text-gray-900">{step.question}</p>

      <div className="space-y-2">
        {step.options?.map((option, i) => {
          const isSelected = selectedOption === i;
          const isCorrect = option.correct;

          let borderClass = "border-gray-200 hover:border-purple-300 bg-white";
          if (showExplanation) {
            if (isCorrect) {
              borderClass = "border-green-400 bg-green-50";
            } else if (isSelected && !isCorrect) {
              borderClass = "border-red-400 bg-red-50";
            } else {
              borderClass = "border-gray-200 bg-white opacity-60";
            }
          } else if (isSelected) {
            borderClass = "border-purple-400 bg-purple-50";
          }

          return (
            <motion.button
              key={i}
              onClick={() => onSelect(i)}
              disabled={showExplanation}
              whileTap={!showExplanation ? { scale: 0.98 } : undefined}
              className={`flex w-full items-start gap-3 rounded-lg border-2 p-3 text-left text-sm transition-colors ${borderClass}`}
            >
              {/* Letter label */}
              <span
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  showExplanation && isCorrect
                    ? "bg-green-200 text-green-800"
                    : showExplanation && isSelected && !isCorrect
                    ? "bg-red-200 text-red-800"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>

              <div className="flex-1">
                <p className="font-medium">{option.label}</p>
                {showExplanation && (isSelected || isCorrect) && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-1 text-xs text-gray-600"
                  >
                    {option.explanation}
                  </motion.p>
                )}
              </div>

              {showExplanation && isCorrect && (
                <Check className="h-5 w-5 flex-shrink-0 text-green-600" />
              )}
              {showExplanation && isSelected && !isCorrect && (
                <X className="h-5 w-5 flex-shrink-0 text-red-600" />
              )}
            </motion.button>
          );
        })}
      </div>

      {showExplanation && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 rounded-lg p-3 text-sm ${
            selectedOption !== null && step.options?.[selectedOption]?.correct
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {selectedOption !== null && step.options?.[selectedOption]?.correct
            ? "✓ Bonne réponse !"
            : "✗ Ce n'est pas la bonne réponse."}
        </motion.div>
      )}
    </div>
  );
}
