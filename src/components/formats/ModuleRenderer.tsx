"use client";

import { useState } from "react";
import { ChevronRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ModuleContent } from "@/types";

interface Props {
  content: object;
}

export function ModuleRenderer({ content }: Props) {
  const data = content as ModuleContent;
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const step = data.steps?.[currentStep];
  if (!step) return <p className="text-gray-500">Pas de module disponible</p>;

  const total = data.steps.length;
  const isLast = currentStep === total - 1;

  const handleNext = () => {
    if (!isLast) {
      setCurrentStep(currentStep + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    }
  };

  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);
    setShowExplanation(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{data.title}</h3>
        <span className="text-sm text-gray-500">{data.estimatedDuration}</span>
      </div>

      {/* Progress */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${((currentStep + 1) / total) * 100}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">
        Étape {currentStep + 1} / {total}
      </p>

      {/* Step content */}
      {step.type === "lesson" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{step.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-gray-700">
              {step.content?.split("\n").map((p, i) => (
                <p key={i} className="mb-2">
                  {p}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 font-medium">{step.question}</p>
            <div className="space-y-2">
              {step.options?.map((option, i) => {
                const isSelected = selectedOption === i;
                const showResult = showExplanation && isSelected;

                return (
                  <button
                    key={i}
                    onClick={() => !showExplanation && handleOptionSelect(i)}
                    disabled={showExplanation}
                    className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                      showResult
                        ? option.correct
                          ? "border-green-500 bg-green-50"
                          : "border-red-500 bg-red-50"
                        : showExplanation && option.correct
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{option.label}</p>
                      {showExplanation && (isSelected || option.correct) && (
                        <p className="mt-1 text-xs text-gray-600">{option.explanation}</p>
                      )}
                    </div>
                    {showResult && (
                      option.correct ? (
                        <Check className="h-5 w-5 flex-shrink-0 text-green-600" />
                      ) : (
                        <X className="h-5 w-5 flex-shrink-0 text-red-600" />
                      )
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          disabled={step.type === "quiz" && !showExplanation}
        >
          {isLast ? "Terminé" : "Continuer"}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
