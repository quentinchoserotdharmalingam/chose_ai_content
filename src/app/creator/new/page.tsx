"use client";

import { useState } from "react";
import { UploadStep } from "@/components/creator/UploadStep";
import { AnalysisStep } from "@/components/creator/AnalysisStep";
import { ObjectiveStep } from "@/components/creator/ObjectiveStep";
import { GenerateStep } from "@/components/creator/GenerateStep";
import { PreviewStep } from "@/components/creator/PreviewStep";
import type { AnalysisResult, FormatSlug } from "@/types";

type Step = "upload" | "analysis" | "objective" | "generate" | "preview";

const STEPS: { key: Step; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "analysis", label: "Analyse" },
  { key: "objective", label: "Objectif" },
  { key: "generate", label: "Génération" },
  { key: "preview", label: "Preview" },
];

export default function NewResourcePage() {
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [resourceId, setResourceId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [objective, setObjective] = useState("");
  const [selectedFormats, setSelectedFormats] = useState<FormatSlug[]>([
    "synthese",
    "flashcards",
    "chat",
    "module",
    "scenarios",
  ]);
  const [generatedContent, setGeneratedContent] = useState<Record<string, object>>({});

  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  // Allow navigating back to completed steps
  const handleStepClick = (stepIndex: number) => {
    if (stepIndex < currentIndex) {
      setCurrentStep(STEPS[stepIndex].key);
    }
  };

  return (
    <div>
      {/* Step indicator — clickable for completed steps */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center gap-2">
            <button
              onClick={() => handleStepClick(i)}
              disabled={i >= currentIndex}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                i < currentIndex
                  ? "cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
                  : i === currentIndex
                  ? "bg-blue-100 text-blue-600 ring-2 ring-blue-600"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {i < currentIndex ? "✓" : i + 1}
            </button>
            <span
              className={`hidden text-sm sm:inline ${
                i === currentIndex
                  ? "font-medium text-gray-900"
                  : i < currentIndex
                  ? "cursor-pointer text-gray-600 hover:text-gray-900"
                  : "text-gray-400"
              }`}
              onClick={() => handleStepClick(i)}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-6 ${i < currentIndex ? "bg-blue-600" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      {currentStep === "upload" && (
        <UploadStep
          onUploaded={(id) => {
            setResourceId(id);
            setCurrentStep("analysis");
          }}
        />
      )}

      {currentStep === "analysis" && resourceId && (
        <AnalysisStep
          resourceId={resourceId}
          onAnalyzed={(result) => {
            setAnalysis(result);
            setCurrentStep("objective");
          }}
        />
      )}

      {currentStep === "objective" && analysis && (
        <ObjectiveStep
          analysis={analysis}
          objective={objective}
          onObjectiveChange={setObjective}
          selectedFormats={selectedFormats}
          onFormatsChange={setSelectedFormats}
          onNext={async () => {
            if (!resourceId) return;
            await fetch(`/api/resources/${resourceId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ objective }),
            });
            setCurrentStep("generate");
          }}
        />
      )}

      {currentStep === "generate" && resourceId && (
        <GenerateStep
          resourceId={resourceId}
          formats={selectedFormats}
          onGenerated={(content) => {
            setGeneratedContent(content);
            setCurrentStep("preview");
          }}
        />
      )}

      {currentStep === "preview" && resourceId && (
        <PreviewStep
          resourceId={resourceId}
          content={generatedContent}
          formats={selectedFormats}
          onContentChange={setGeneratedContent}
          onBack={() => setCurrentStep("objective")}
        />
      )}
    </div>
  );
}
