"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Check, Sparkles } from "lucide-react";
import {
  INTERVIEW_THEME_META,
  INTERVIEW_TONE_META,
  DEFAULT_ANALYSIS_TEMPLATES,
  type InterviewTheme,
  type InterviewTone,
  type AnalysisTemplateDimension,
} from "@/types";

type Step = "config" | "scope" | "questions" | "analysis" | "publish";

const STEPS: { key: Step; label: string }[] = [
  { key: "config", label: "Configuration" },
  { key: "scope", label: "Périmètre" },
  { key: "questions", label: "Questions" },
  { key: "analysis", label: "Analyse" },
  { key: "publish", label: "Publication" },
];

export default function NewInterviewPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("config");
  const [saving, setSaving] = useState(false);
  const [interviewId, setInterviewId] = useState<string | null>(null);

  // Config
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState<InterviewTheme>("onboarding");
  const [customTheme, setCustomTheme] = useState("");
  const [tone, setTone] = useState<InterviewTone>("bienveillant");

  // Scope
  const [scopeIn, setScopeIn] = useState("");
  const [scopeOut, setScopeOut] = useState("");

  // Questions
  const [anchorQuestions, setAnchorQuestions] = useState<string[]>([""]);
  const [checkpointQuestions, setCheckpointQuestions] = useState<string[]>([""]);

  // Limits
  const [targetDuration, setTargetDuration] = useState(15);
  const [maxQuestions, setMaxQuestions] = useState(25);

  // Analysis
  const [analysisTemplate, setAnalysisTemplate] = useState<AnalysisTemplateDimension[]>(
    DEFAULT_ANALYSIS_TEMPLATES.onboarding
  );
  const [suggestingAnalysis, setSuggestingAnalysis] = useState(false);
  const [suggestingScope, setSuggestingScope] = useState(false);
  const [suggestingQuestions, setSuggestingQuestions] = useState(false);
  const [suggestingTitle, setSuggestingTitle] = useState(false);

  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  const handleThemeChange = (newTheme: InterviewTheme) => {
    setTheme(newTheme);
    if (newTheme !== "custom" && DEFAULT_ANALYSIS_TEMPLATES[newTheme]) {
      setAnalysisTemplate(DEFAULT_ANALYSIS_TEMPLATES[newTheme]);
    }
  };

  const addQuestion = (type: "anchor" | "checkpoint") => {
    if (type === "anchor") setAnchorQuestions([...anchorQuestions, ""]);
    else setCheckpointQuestions([...checkpointQuestions, ""]);
  };

  const updateQuestion = (type: "anchor" | "checkpoint", index: number, value: string) => {
    if (type === "anchor") {
      const updated = [...anchorQuestions];
      updated[index] = value;
      setAnchorQuestions(updated);
    } else {
      const updated = [...checkpointQuestions];
      updated[index] = value;
      setCheckpointQuestions(updated);
    }
  };

  const removeQuestion = (type: "anchor" | "checkpoint", index: number) => {
    if (type === "anchor") setAnchorQuestions(anchorQuestions.filter((_, i) => i !== index));
    else setCheckpointQuestions(checkpointQuestions.filter((_, i) => i !== index));
  };

  const saveInterview = async () => {
    const payload = {
      title: title || "Nouvelle interview",
      description: description || null,
      theme: theme === "custom" ? customTheme || "custom" : theme,
      tone,
      scopeIn: scopeIn || null,
      scopeOut: scopeOut || null,
      anchorQuestions: anchorQuestions.filter((q) => q.trim()),
      checkpointQuestions: checkpointQuestions.filter((q) => q.trim()),
      targetDurationMinutes: targetDuration,
      maxQuestions,
      analysisTemplate,
    };

    if (interviewId) {
      await fetch(`/api/interviews/${interviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return interviewId;
    } else {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setInterviewId(data.id);
      return data.id;
    }
  };

  const ensureSaved = async (): Promise<string> => {
    if (interviewId) {
      await saveInterview();
      return interviewId;
    }
    return await saveInterview();
  };

  const handleSuggestTitle = async () => {
    setSuggestingTitle(true);
    try {
      const id = await ensureSaved();
      const res = await fetch(`/api/interviews/${id}/suggest-title`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
      }
    } catch { /* Silent */ } finally {
      setSuggestingTitle(false);
    }
  };

  const handleSuggestScope = async () => {
    setSuggestingScope(true);
    try {
      const id = await ensureSaved();
      const res = await fetch(`/api/interviews/${id}/suggest-scope`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.scopeIn) setScopeIn(data.scopeIn);
        if (data.scopeOut) setScopeOut(data.scopeOut);
      }
    } catch { /* Silent */ } finally {
      setSuggestingScope(false);
    }
  };

  const handleSuggestQuestions = async () => {
    setSuggestingQuestions(true);
    try {
      const id = await ensureSaved();
      const res = await fetch(`/api/interviews/${id}/suggest-questions`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.anchorQuestions?.length) setAnchorQuestions(data.anchorQuestions);
        if (data.checkpointQuestions?.length) setCheckpointQuestions(data.checkpointQuestions);
      }
    } catch { /* Silent */ } finally {
      setSuggestingQuestions(false);
    }
  };

  const handleNext = async () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < STEPS.length) {
      setSaving(true);
      await ensureSaved();
      setSaving(false);
      setCurrentStep(STEPS[nextIndex].key);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      const id = await saveInterview();
      await fetch(`/api/interviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      router.push("/creator");
    } catch {
      // Silent for POC
    } finally {
      setSaving(false);
    }
  };

  const handleSuggestAnalysis = async () => {
    if (!interviewId) return;
    setSuggestingAnalysis(true);
    try {
      // Save current state first
      await saveInterview();
      const res = await fetch(`/api/interviews/${interviewId}/suggest-analysis`, { method: "POST" });
      if (res.ok) {
        const suggestions = await res.json();
        setAnalysisTemplate(suggestions);
      }
    } catch {
      // Silent for POC
    } finally {
      setSuggestingAnalysis(false);
    }
  };

  const addDimension = () => {
    setAnalysisTemplate([
      ...analysisTemplate,
      { key: `custom_${Date.now()}`, label: "", type: "text", description: "" },
    ]);
  };

  const updateDimension = (index: number, field: string, value: string) => {
    const updated = [...analysisTemplate];
    (updated[index] as unknown as Record<string, string>)[field] = value;
    if (field === "label") {
      updated[index].key = value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    }
    setAnalysisTemplate(updated);
  };

  const removeDimension = (index: number) => {
    setAnalysisTemplate(analysisTemplate.filter((_, i) => i !== index));
  };

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center justify-between gap-0 sm:gap-2">
          {STEPS.map((step, i) => (
            <div key={step.key} className="flex min-w-0 flex-1 items-center gap-0 sm:gap-2">
              <button
                onClick={() => i < currentIndex && setCurrentStep(STEPS[i].key)}
                disabled={i >= currentIndex}
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors sm:h-8 sm:w-8 sm:text-sm ${
                  i < currentIndex
                    ? "cursor-pointer bg-coral text-white hover:bg-coral-dark"
                    : i === currentIndex
                    ? "bg-coral-light text-coral ring-2 ring-coral"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {i < currentIndex ? <Check className="h-4 w-4" /> : i + 1}
              </button>
              <span
                className={`hidden text-sm md:inline ${
                  i === currentIndex ? "font-medium text-gray-900" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`mx-1 h-px flex-1 sm:mx-2 ${i < currentIndex ? "bg-coral" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      {currentStep === "config" && (
        <div>
          <h2 className="mb-2 text-xl font-semibold">Configuration de l&apos;interview</h2>
          <p className="mb-6 text-sm text-gray-500">Définissez le thème, le ton et les paramètres généraux.</p>

          <div className="space-y-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Titre de l&apos;interview</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Suivi d'intégration M+1"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="mb-1.5 block text-sm font-medium">Description (optionnel)</label>
                <button
                  onClick={handleSuggestTitle}
                  disabled={suggestingTitle}
                  className="mb-1 flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-100 disabled:opacity-50 transition-colors"
                >
                  {suggestingTitle ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Générer titre et description
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description interne pour les administrateurs"
                rows={2}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Thème de l&apos;interview</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(Object.entries(INTERVIEW_THEME_META) as [InterviewTheme, typeof INTERVIEW_THEME_META.onboarding][]).map(([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => handleThemeChange(key)}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      theme === key
                        ? "border-coral bg-coral/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl">{meta.icon}</span>
                    <p className="mt-1 text-sm font-medium">{meta.label}</p>
                    <p className="text-xs text-gray-500">{meta.description}</p>
                  </button>
                ))}
              </div>
              {theme === "custom" && (
                <input
                  type="text"
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                  placeholder="Décrivez votre thème personnalisé"
                  className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
                />
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Ton de l&apos;interview</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(Object.entries(INTERVIEW_TONE_META) as [InterviewTone, typeof INTERVIEW_TONE_META.bienveillant][]).map(([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => setTone(key)}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      tone === key
                        ? "border-coral bg-coral/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="text-sm font-medium">{meta.label}</p>
                    <p className="text-xs text-gray-500">{meta.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Durée cible (minutes)</label>
                <input
                  type="number"
                  value={targetDuration}
                  onChange={(e) => setTargetDuration(Number(e.target.value))}
                  min={5}
                  max={60}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Nombre max de questions</label>
                <input
                  type="number"
                  value={maxQuestions}
                  onChange={(e) => setMaxQuestions(Number(e.target.value))}
                  min={5}
                  max={50}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === "scope" && (
        <div>
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Périmètre de l&apos;interview</h2>
              <p className="mt-1 text-sm text-gray-500">Définissez les sujets à explorer et ceux à éviter.</p>
            </div>
            <button
              onClick={handleSuggestScope}
              disabled={suggestingScope}
              className="mt-1 flex shrink-0 items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-2 text-xs font-medium text-purple-600 hover:bg-purple-100 disabled:opacity-50 transition-colors"
            >
              {suggestingScope ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Générer via IA
            </button>
          </div>

          <div className="mt-6 space-y-6">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs">✓</span>
                <label className="text-sm font-medium text-green-700">Zone verte — Sujets à explorer</label>
              </div>
              <textarea
                value={scopeIn}
                onChange={(e) => setScopeIn(e.target.value)}
                placeholder="Ex: Intégration dans l'équipe, relation avec le manager, charge de travail, outils et processus, formation..."
                rows={4}
                className="w-full rounded-lg border border-green-200 bg-green-50/50 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs">✕</span>
                <label className="text-sm font-medium text-red-700">Zone rouge — Sujets hors périmètre</label>
              </div>
              <textarea
                value={scopeOut}
                onChange={(e) => setScopeOut(e.target.value)}
                placeholder="Ex: Rémunération, politique d'entreprise, noms de collègues spécifiques..."
                rows={4}
                className="w-full rounded-lg border border-red-200 bg-red-50/50 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
              />
            </div>
          </div>
        </div>
      )}

      {currentStep === "questions" && (
        <div>
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Questions structurantes</h2>
              <p className="mt-1 text-sm text-gray-500">Définissez les questions fixes et les points de passage de l&apos;interview.</p>
            </div>
            <button
              onClick={handleSuggestQuestions}
              disabled={suggestingQuestions}
              className="mt-1 flex shrink-0 items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-2 text-xs font-medium text-purple-600 hover:bg-purple-100 disabled:opacity-50 transition-colors"
            >
              {suggestingQuestions ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Générer via IA
            </button>
          </div>

          <div className="mt-6 space-y-8">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Questions d&apos;ancrage</h3>
                  <p className="text-xs text-gray-500">Posées au début de l&apos;interview, dans l&apos;ordre défini</p>
                </div>
                <button
                  onClick={() => addQuestion("anchor")}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  + Ajouter
                </button>
              </div>
              <div className="space-y-2">
                {anchorQuestions.map((q, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="mt-2.5 text-xs font-medium text-gray-400">{i + 1}.</span>
                    <input
                      type="text"
                      value={q}
                      onChange={(e) => updateQuestion("anchor", i, e.target.value)}
                      placeholder="Ex: Sur une échelle de 1 à 10, comment évaluez-vous votre intégration ?"
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
                    />
                    {anchorQuestions.length > 1 && (
                      <button
                        onClick={() => removeQuestion("anchor", i)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Questions de passage</h3>
                  <p className="text-xs text-gray-500">Intercalées au moment pertinent pendant l&apos;interview</p>
                </div>
                <button
                  onClick={() => addQuestion("checkpoint")}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  + Ajouter
                </button>
              </div>
              <div className="space-y-2">
                {checkpointQuestions.map((q, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="mt-2.5 text-xs text-gray-400">~</span>
                    <input
                      type="text"
                      value={q}
                      onChange={(e) => updateQuestion("checkpoint", i, e.target.value)}
                      placeholder="Ex: Avez-vous identifié un point bloquant dans vos premiers projets ?"
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
                    />
                    {checkpointQuestions.length > 1 && (
                      <button
                        onClick={() => removeQuestion("checkpoint", i)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === "analysis" && (
        <div>
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Structure d&apos;analyse</h2>
              <p className="mt-1 text-sm text-gray-500">
                Configurez les dimensions d&apos;analyse qui seront produites après chaque interview.
              </p>
            </div>
            <button
              onClick={handleSuggestAnalysis}
              disabled={suggestingAnalysis || !interviewId}
              className="mt-1 flex shrink-0 items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-2 text-xs font-medium text-purple-600 hover:bg-purple-100 disabled:opacity-50 transition-colors"
            >
              {suggestingAnalysis ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Générer via IA
            </button>
          </div>

          <div className="mb-4">
            <button
              onClick={addDimension}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              + Ajouter une dimension
            </button>
          </div>

          <div className="space-y-3">
            {analysisTemplate.map((dim, i) => (
              <div key={dim.key} className="rounded-xl border border-gray-200 p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">Libellé</label>
                      <input
                        type="text"
                        value={dim.label}
                        onChange={(e) => updateDimension(i, "label", e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-coral focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">Type</label>
                      <select
                        value={dim.type}
                        onChange={(e) => updateDimension(i, "type", e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-coral focus:outline-none"
                      >
                        <option value="score_1_10">Score 1-10</option>
                        <option value="score_low_med_high">Faible / Moyen / Élevé</option>
                        <option value="text">Texte libre</option>
                        <option value="list">Liste</option>
                        <option value="boolean">Oui / Non</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => removeDimension(i)}
                    className="ml-2 mt-5 text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Description</label>
                  <input
                    type="text"
                    value={dim.description || ""}
                    onChange={(e) => updateDimension(i, "description", e.target.value)}
                    placeholder="Que mesure cette dimension ?"
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-coral focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentStep === "publish" && (
        <div>
          <h2 className="mb-2 text-xl font-semibold">Récapitulatif</h2>
          <p className="mb-6 text-sm text-gray-500">Vérifiez la configuration avant de publier.</p>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="mb-3 text-sm font-medium text-gray-500">Configuration</h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-gray-500">Titre</span>
                <span className="font-medium">{title || "Non défini"}</span>
                <span className="text-gray-500">Thème</span>
                <span className="font-medium">
                  {theme === "custom" ? customTheme : INTERVIEW_THEME_META[theme].label}
                </span>
                <span className="text-gray-500">Ton</span>
                <span className="font-medium">{INTERVIEW_TONE_META[tone].label}</span>
                <span className="text-gray-500">Durée cible</span>
                <span className="font-medium">{targetDuration} min</span>
                <span className="text-gray-500">Max questions</span>
                <span className="font-medium">{maxQuestions}</span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="mb-3 text-sm font-medium text-gray-500">Périmètre</h3>
              {scopeIn && (
                <div className="mb-2">
                  <span className="text-xs font-medium text-green-600">Zone verte :</span>
                  <p className="text-sm text-gray-700">{scopeIn}</p>
                </div>
              )}
              {scopeOut && (
                <div>
                  <span className="text-xs font-medium text-red-600">Zone rouge :</span>
                  <p className="text-sm text-gray-700">{scopeOut}</p>
                </div>
              )}
              {!scopeIn && !scopeOut && <p className="text-sm text-gray-400">Non défini</p>}
            </div>

            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="mb-3 text-sm font-medium text-gray-500">Questions</h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-500">
                  {anchorQuestions.filter((q) => q.trim()).length} question(s) d&apos;ancrage
                </p>
                <p className="text-gray-500">
                  {checkpointQuestions.filter((q) => q.trim()).length} question(s) de passage
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="mb-3 text-sm font-medium text-gray-500">Analyse</h3>
              <div className="flex flex-wrap gap-2">
                {analysisTemplate.map((dim) => (
                  <span key={dim.key} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {dim.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => {
            if (currentIndex === 0) router.push("/creator");
            else setCurrentStep(STEPS[currentIndex - 1].key);
          }}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {currentIndex === 0 ? "Annuler" : "Précédent"}
        </button>

        {currentStep === "publish" ? (
          <button
            onClick={handlePublish}
            disabled={saving || !title.trim()}
            className="flex items-center gap-2 rounded-full bg-coral px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-coral-dark disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Publier l&apos;interview
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={saving || (currentStep === "config" && !title.trim())}
            className="flex items-center gap-2 rounded-full bg-coral px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-coral-dark disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Suivant
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
