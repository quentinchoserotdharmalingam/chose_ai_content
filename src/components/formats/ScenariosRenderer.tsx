"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScenariosContent } from "@/types";

interface Props {
  content: object;
}

export function ScenariosRenderer({ content }: Props) {
  const data = content as ScenariosContent;
  const [currentStepId, setCurrentStepId] = useState(data.steps?.[0]?.id || "");
  const [feedback, setFeedback] = useState<{ text: string; quality: string } | null>(null);
  const [showConclusion, setShowConclusion] = useState(false);
  const [path, setPath] = useState<string[]>([]);

  const currentStep = data.steps?.find((s) => s.id === currentStepId);

  const handleChoice = (choice: {
    label: string;
    nextStepId: string;
    feedback: string;
    quality: string;
  }) => {
    setFeedback({ text: choice.feedback, quality: choice.quality });
    setPath([...path, choice.label]);

    setTimeout(() => {
      setFeedback(null);
      if (choice.nextStepId === "conclusion" || !data.steps?.find((s) => s.id === choice.nextStepId)) {
        setShowConclusion(true);
      } else {
        setCurrentStepId(choice.nextStepId);
      }
    }, 3000);
  };

  if (showConclusion) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">{data.title}</h3>
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base text-blue-800">Conclusion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-blue-700">{data.conclusion}</p>
          </CardContent>
        </Card>
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Votre parcours :</p>
          <ol className="space-y-1">
            {path.map((choice, i) => (
              <li key={i} className="text-sm text-gray-600">
                {i + 1}. {choice}
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  if (!currentStep) return <p className="text-gray-500">Pas de scénario disponible</p>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{data.title}</h3>
        {currentStepId === data.steps[0]?.id && (
          <p className="mt-2 text-sm text-gray-600">{data.context}</p>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Card>
            <CardContent className="pt-6">
              <p className="mb-6 text-sm leading-relaxed">{currentStep.narrative}</p>

              {feedback ? (
                <div
                  className={`rounded-lg p-4 ${
                    feedback.quality === "optimal"
                      ? "bg-green-50 text-green-800"
                      : feedback.quality === "acceptable"
                      ? "bg-yellow-50 text-yellow-800"
                      : "bg-red-50 text-red-800"
                  }`}
                >
                  <p className="mb-1 text-xs font-medium uppercase">
                    {feedback.quality === "optimal"
                      ? "Excellent choix"
                      : feedback.quality === "acceptable"
                      ? "Choix acceptable"
                      : "Choix risqué"}
                  </p>
                  <p className="text-sm">{feedback.text}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="mb-3 text-xs font-medium uppercase text-gray-500">
                    Que faites-vous ?
                  </p>
                  {currentStep.choices.map((choice, i) => (
                    <button
                      key={i}
                      onClick={() => handleChoice(choice)}
                      className="block w-full rounded-lg border border-gray-200 p-3 text-left text-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
