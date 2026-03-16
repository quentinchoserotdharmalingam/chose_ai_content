"use client";

import { useState } from "react";
import { UploadStep } from "@/components/creator/UploadStep";
import { AnalysisStep } from "@/components/creator/AnalysisStep";
import { ObjectiveStep } from "@/components/creator/ObjectiveStep";
import { GenerateStep } from "@/components/creator/GenerateStep";
import { PreviewStep } from "@/components/creator/PreviewStep";
import {
  ExtensionsStep,
  createDefaultExtensions,
} from "@/components/creator/ExtensionsStep";
import { ExtensionConfigStep } from "@/components/creator/ExtensionConfigStep";
import { PublishStep } from "@/components/creator/PublishStep";
import type { AnalysisResult, FormatSlug, ExtensionSlug, ExtensionConfig } from "@/types";

type Step = "upload" | "analysis" | "objective" | "generate" | "preview" | "extensions" | "extensions-config" | "publish";

const STEPS: { key: Step; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "analysis", label: "Analyse" },
  { key: "objective", label: "Objectif" },
  { key: "generate", label: "Génération" },
  { key: "preview", label: "Preview" },
  { key: "extensions", label: "Extensions" },
  { key: "extensions-config", label: "Configuration" },
  { key: "publish", label: "Publication" },
];

export default function NewResourcePage() {
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [resourceId, setResourceId] = useState<string | null>(null);
  const [resourceTitle, setResourceTitle] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [objective, setObjective] = useState("");
  const [tone, setTone] = useState("professional");
  const [language, setLanguage] = useState("fr");
  const [selectedFormats, setSelectedFormats] = useState<FormatSlug[]>([
    "synthese",
    "flashcards",
    "chat",
    "module",
    "scenarios",
  ]);
  const [generatedContent, setGeneratedContent] = useState<Record<string, object>>({});
  const [extensions, setExtensions] = useState<Record<ExtensionSlug, ExtensionConfig>>(
    createDefaultExtensions()
  );

  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex < currentIndex) {
      setCurrentStep(STEPS[stepIndex].key);
    }
  };

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center justify-between gap-0 sm:gap-2">
          {STEPS.map((step, i) => (
            <div key={step.key} className="flex min-w-0 flex-1 items-center gap-0 sm:gap-2">
              <button
                onClick={() => handleStepClick(i)}
                disabled={i >= currentIndex}
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors sm:h-8 sm:w-8 sm:text-sm ${
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
                className={`hidden text-sm md:inline ${
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
                <div className={`mx-0.5 h-px flex-1 sm:mx-0 ${i < currentIndex ? "bg-blue-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      {currentStep === "upload" && (
        <UploadStep
          onUploaded={(id, title) => {
            setResourceId(id);
            if (title) setResourceTitle(title);
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
          tone={tone}
          onToneChange={setTone}
          language={language}
          onLanguageChange={setLanguage}
          onNext={async () => {
            if (!resourceId) return;
            await fetch(`/api/resources/${resourceId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ objective, tone, language }),
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
          onNext={() => setCurrentStep("extensions")}
        />
      )}

      {currentStep === "extensions" && resourceId && (
        <ExtensionsStep
          extensions={extensions}
          onExtensionsChange={setExtensions}
          onBack={() => setCurrentStep("preview")}
          onNext={() => {
            const hasEnabled = Object.values(extensions).some((e) => e.enabled);
            setCurrentStep(hasEnabled ? "extensions-config" : "publish");
          }}
        />
      )}

      {currentStep === "extensions-config" && resourceId && (
        <ExtensionConfigStep
          extensions={extensions}
          onExtensionsChange={setExtensions}
          resourceId={resourceId}
          onBack={() => setCurrentStep("extensions")}
          onNext={() => setCurrentStep("publish")}
        />
      )}

      {currentStep === "publish" && resourceId && (
        <PublishStep
          resourceId={resourceId}
          initialTitle={resourceTitle}
          formats={selectedFormats}
          onBack={() => {
            const hasEnabled = Object.values(extensions).some((e) => e.enabled);
            setCurrentStep(hasEnabled ? "extensions-config" : "extensions");
          }}
        />
      )}
    </div>
  );
}
