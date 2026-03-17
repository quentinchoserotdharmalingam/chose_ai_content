"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
  Sparkles,
  Hash,
  Activity,
  X,
} from "lucide-react";
import {
  INTERVIEW_THEME_META,
  INTERVIEW_TONE_META,
  PULSE_FREQUENCY_META,
  DEFAULT_ANALYSIS_TEMPLATES,
  type InterviewTheme,
  type InterviewTone,
  type PulseFrequency,
  type AnalysisTemplateDimension,
} from "@/types";

type InterviewStep = "config" | "scope" | "questions" | "analysis";
type PulseStep = "config";

const INTERVIEW_STEPS: { key: InterviewStep; label: string }[] = [
  { key: "config", label: "Configuration" },
  { key: "scope", label: "Périmètre" },
  { key: "questions", label: "Questions" },
  { key: "analysis", label: "Analyse" },
];

export default function EditInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPulse, setIsPulse] = useState(false);
  const [currentStep, setCurrentStep] = useState<InterviewStep | PulseStep>("config");

  // Shared fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState<InterviewTheme>("onboarding");
  const [customTheme, setCustomTheme] = useState("");
  const [tone, setTone] = useState<InterviewTone>("bienveillant");

  // Interview fields
  const [scopeIn, setScopeIn] = useState("");
  const [scopeOut, setScopeOut] = useState("");
  const [anchorQuestions, setAnchorQuestions] = useState<string[]>([""]);
  const [checkpointQuestions, setCheckpointQuestions] = useState<string[]>([""]);
  const [targetDuration, setTargetDuration] = useState(15);
  const [maxQuestions, setMaxQuestions] = useState(25);
  const [analysisTemplate, setAnalysisTemplate] = useState<AnalysisTemplateDimension[]>([]);

  // Pulse fields
  const [pulseQuestion, setPulseQuestion] = useState("");
  const [frequency, setFrequency] = useState<PulseFrequency>("weekly");
  const [maxFollowUps, setMaxFollowUps] = useState(3);

  // AI suggestion states
  const [suggestingScope, setSuggestingScope] = useState(false);
  const [suggestingQuestions, setSuggestingQuestions] = useState(false);
  const [suggestingAnalysis, setSuggestingAnalysis] = useState(false);
  const [suggestingTitle, setSuggestingTitle] = useState(false);
  const [suggestingContent, setSuggestingContent] = useState(false);

  useEffect(() => {
    fetch(`/api/interviews/${interviewId}`)
      .then((res) => res.json())
      .then((d) => {
        setIsPulse(d.type === "pulse");
        setTitle(d.title || "");
        setDescription(d.description || "");
        const knownThemes = Object.keys(INTERVIEW_THEME_META);
        if (knownThemes.includes(d.theme)) {
          setTheme(d.theme as InterviewTheme);
        } else {
          setTheme("custom");
          setCustomTheme(d.theme || "");
        }
        setTone((d.tone as InterviewTone) || "bienveillant");
        setScopeIn(d.scopeIn || "");
        setScopeOut(d.scopeOut || "");
        setAnchorQuestions(d.anchorQuestions?.length ? d.anchorQuestions : [""]);
        setCheckpointQuestions(d.checkpointQuestions?.length ? d.checkpointQuestions : [""]);
        setTargetDuration(d.targetDurationMinutes || 15);
        setMaxQuestions(d.maxQuestions || 25);
        const themeKey = d.theme as keyof typeof DEFAULT_ANALYSIS_TEMPLATES;
        setAnalysisTemplate(d.analysisTemplate || DEFAULT_ANALYSIS_TEMPLATES[themeKey] || []);
        setPulseQuestion(d.pulseQuestion || "");
        setFrequency((d.pulseFrequency as PulseFrequency) || "weekly");
        setMaxFollowUps(d.pulseMaxFollowUps || 3);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [interviewId]);

  const currentIndex = INTERVIEW_STEPS.findIndex((s) => s.key === currentStep);

  const saveInterview = async () => {
    setSaving(true);
    try {
      const payload = isPulse
        ? {
            title,
            theme,
            tone,
            pulseQuestion,
            pulseFrequency: frequency,
            pulseMaxFollowUps: maxFollowUps,
          }
        : {
            title,
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
      await fetch(`/api/interviews/${interviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    await saveInterview();
    router.push(`/creator/interview/${interviewId}`);
  };

  const handleNext = async () => {
    setSaving(true);
    await saveInterview();
    setSaving(false);
    const nextIndex = currentIndex + 1;
    if (nextIndex < INTERVIEW_STEPS.length) {
      setCurrentStep(INTERVIEW_STEPS[nextIndex].key);
    }
  };

  const handleThemeChange = (newTheme: InterviewTheme) => {
    setTheme(newTheme);
    if (!isPulse && newTheme !== "custom" && DEFAULT_ANALYSIS_TEMPLATES[newTheme]) {
      setAnalysisTemplate(DEFAULT_ANALYSIS_TEMPLATES[newTheme]);
    }
  };

  // Question helpers
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

  // Analysis dimension helpers
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

  // AI suggestion handlers
  const handleSuggestTitle = async () => {
    setSuggestingTitle(true);
    try {
      const res = await fetch(`/api/interviews/${interviewId}/suggest-title`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
      }
    } catch { /* Silent */ } finally { setSuggestingTitle(false); }
  };
  const handleSuggestScope = async () => {
    setSuggestingScope(true);
    try {
      await saveInterview();
      const res = await fetch(`/api/interviews/${interviewId}/suggest-scope`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.scopeIn) setScopeIn(data.scopeIn);
        if (data.scopeOut) setScopeOut(data.scopeOut);
      }
    } catch { /* Silent */ } finally { setSuggestingScope(false); }
  };
  const handleSuggestQuestions = async () => {
    setSuggestingQuestions(true);
    try {
      await saveInterview();
      const res = await fetch(`/api/interviews/${interviewId}/suggest-questions`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.anchorQuestions?.length) setAnchorQuestions(data.anchorQuestions);
        if (data.checkpointQuestions?.length) setCheckpointQuestions(data.checkpointQuestions);
      }
    } catch { /* Silent */ } finally { setSuggestingQuestions(false); }
  };
  const handleSuggestAnalysis = async () => {
    setSuggestingAnalysis(true);
    try {
      await saveInterview();
      const res = await fetch(`/api/interviews/${interviewId}/suggest-analysis`, { method: "POST" });
      if (res.ok) {
        const suggestions = await res.json();
        setAnalysisTemplate(suggestions);
      }
    } catch { /* Silent */ } finally { setSuggestingAnalysis(false); }
  };
  const handleSuggestContent = async () => {
    setSuggestingContent(true);
    try {
      await saveInterview();
      const res = await fetch(`/api/interviews/${interviewId}/suggest-pulse-content`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.title) setTitle(data.title);
        if (data.pulseQuestion) setPulseQuestion(data.pulseQuestion);
      }
    } catch { /* Silent */ } finally { setSuggestingContent(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-ht-primary" />
      </div>
    );
  }

  // ─── PULSE EDIT ──────────────────────────────────────
  if (isPulse) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/creator/interview/${interviewId}`}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ht-text-secondary hover:text-ht-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ht-primary/10">
            <Activity className="h-5 w-5 text-ht-primary" />
          </div>
          <div>
            <h1 className="text-[20px] font-medium text-ht-text">Modifier le Pulse</h1>
            <p className="text-[13px] text-ht-text-secondary">Modifiez la configuration du pulse</p>
          </div>
        </div>

        <div className="space-y-5 rounded-xl border border-ht-border bg-white p-6">
          <button
            onClick={handleSuggestContent}
            disabled={suggestingContent}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-purple-200 bg-purple-50 py-2.5 text-[13px] font-medium text-purple-600 transition-colors hover:bg-purple-100 disabled:opacity-50"
          >
            {suggestingContent ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Générer titre et question via IA
          </button>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ht-text">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Bien-être hebdomadaire"
              className="w-full rounded-lg border border-ht-border px-3 py-2.5 text-[13px] text-ht-text placeholder:text-ht-text-secondary focus:border-ht-border-secondary focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ht-text">Question score (1-10)</label>
            <textarea
              value={pulseQuestion}
              onChange={(e) => setPulseQuestion(e.target.value)}
              placeholder="Ex: Comment évaluez-vous votre bien-être au travail cette semaine ?"
              rows={2}
              className="w-full rounded-lg border border-ht-border px-3 py-2.5 text-[13px] text-ht-text placeholder:text-ht-text-secondary focus:border-ht-border-secondary focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ht-text">Thème</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(INTERVIEW_THEME_META) as [InterviewTheme, typeof INTERVIEW_THEME_META.onboarding][]).map(
                ([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-[13px] transition-all ${
                      theme === key
                        ? "border-ht-primary bg-ht-primary/5 text-ht-text"
                        : "border-ht-border text-ht-text-secondary hover:border-ht-border-secondary"
                    }`}
                  >
                    <span className="mr-1.5">{meta.icon}</span>
                    {meta.label}
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ht-text">Ton</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(INTERVIEW_TONE_META) as [InterviewTone, typeof INTERVIEW_TONE_META.bienveillant][]).map(
                ([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => setTone(key)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-[13px] transition-all ${
                      tone === key
                        ? "border-ht-primary bg-ht-primary/5 text-ht-text"
                        : "border-ht-border text-ht-text-secondary hover:border-ht-border-secondary"
                    }`}
                  >
                    {meta.label}
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ht-text">Fréquence</label>
            <div className="flex gap-2">
              {(Object.entries(PULSE_FREQUENCY_META) as [PulseFrequency, typeof PULSE_FREQUENCY_META.weekly][]).map(
                ([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => setFrequency(key)}
                    className={`flex-1 rounded-lg border px-3 py-2.5 text-center text-[13px] transition-all ${
                      frequency === key
                        ? "border-ht-primary bg-ht-primary/5 text-ht-text font-medium"
                        : "border-ht-border text-ht-text-secondary hover:border-ht-border-secondary"
                    }`}
                  >
                    {meta.label}
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ht-text">Questions de suivi IA (max)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setMaxFollowUps(n)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-[13px] font-medium transition-all ${
                    maxFollowUps === n
                      ? "border-ht-primary bg-ht-primary text-white"
                      : "border-ht-border text-ht-text-secondary hover:border-ht-border-secondary"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href={`/creator/interview/${interviewId}`}
              className="flex flex-1 items-center justify-center rounded-full border border-ht-border py-3 text-[13px] font-medium text-ht-text transition-all hover:bg-ht-fill-secondary"
            >
              Annuler
            </Link>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim() || !pulseQuestion.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ht-primary py-3 text-[13px] font-semibold text-white shadow-ht-1 transition-all hover:bg-ht-primary-dark disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── INTERVIEW EDIT ──────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/creator/interview/${interviewId}`}
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ht-text-secondary hover:text-ht-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </Link>

      <h1 className="mb-6 text-[20px] font-medium text-ht-text">Modifier la configuration</h1>

      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-2">
          {INTERVIEW_STEPS.map((step, i) => (
            <div key={step.key} className="flex min-w-0 flex-1 items-center gap-2">
              <button
                onClick={() => setCurrentStep(INTERVIEW_STEPS[i].key)}
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors sm:h-8 sm:w-8 sm:text-sm ${
                  i === currentIndex
                    ? "bg-ht-primary/10 text-ht-primary ring-2 ring-ht-primary"
                    : "bg-ht-fill-secondary text-ht-text-secondary hover:bg-ht-fill-container cursor-pointer"
                }`}
              >
                {i + 1}
              </button>
              <span className={`hidden text-sm md:inline ${i === currentIndex ? "font-medium text-ht-text" : "text-ht-text-secondary"}`}>
                {step.label}
              </span>
              {i < INTERVIEW_STEPS.length - 1 && <div className="mx-1 h-px flex-1 bg-ht-border sm:mx-2" />}
            </div>
          ))}
        </div>
      </div>

      {/* Config step */}
      {currentStep === "config" && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <label className="mb-1.5 block text-sm font-medium text-ht-text">Titre</label>
              <button
                onClick={handleSuggestTitle}
                disabled={suggestingTitle}
                className="mb-1 flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-100 disabled:opacity-50 transition-colors"
              >
                {suggestingTitle ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Générer via IA
              </button>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Suivi d'intégration M+1"
              className="w-full rounded-lg border border-ht-border px-3 py-2 text-sm text-ht-text focus:border-ht-primary focus:outline-none focus:ring-1 focus:ring-ht-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ht-text">Description (optionnel)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description interne"
              rows={2}
              className="w-full rounded-lg border border-ht-border px-3 py-2 text-sm text-ht-text focus:border-ht-primary focus:outline-none focus:ring-1 focus:ring-ht-primary"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ht-text">Thème</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(Object.entries(INTERVIEW_THEME_META) as [InterviewTheme, typeof INTERVIEW_THEME_META.onboarding][]).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => handleThemeChange(key)}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${
                    theme === key ? "border-ht-primary bg-ht-primary/5" : "border-ht-border hover:border-ht-border-secondary"
                  }`}
                >
                  <span className="text-xl">{meta.icon}</span>
                  <p className="mt-1 text-sm font-medium text-ht-text">{meta.label}</p>
                </button>
              ))}
            </div>
            {theme === "custom" && (
              <input
                type="text"
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                placeholder="Décrivez votre thème personnalisé"
                className="mt-3 w-full rounded-lg border border-ht-border px-3 py-2 text-sm focus:border-ht-primary focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ht-text">Ton</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(Object.entries(INTERVIEW_TONE_META) as [InterviewTone, typeof INTERVIEW_TONE_META.bienveillant][]).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => setTone(key)}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${
                    tone === key ? "border-ht-primary bg-ht-primary/5" : "border-ht-border hover:border-ht-border-secondary"
                  }`}
                >
                  <p className="text-sm font-medium text-ht-text">{meta.label}</p>
                  <p className="text-xs text-ht-text-secondary">{meta.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ht-text">Durée cible (minutes)</label>
              <input
                type="number"
                value={targetDuration}
                onChange={(e) => setTargetDuration(Number(e.target.value))}
                min={5}
                max={60}
                className="w-full rounded-lg border border-ht-border px-3 py-2 text-sm focus:border-ht-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ht-text">Max questions</label>
              <input
                type="number"
                value={maxQuestions}
                onChange={(e) => setMaxQuestions(Number(e.target.value))}
                min={5}
                max={50}
                className="w-full rounded-lg border border-ht-border px-3 py-2 text-sm focus:border-ht-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Scope step */}
      {currentStep === "scope" && (
        <div>
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ht-text">Périmètre</h2>
              <p className="mt-1 text-sm text-ht-text-secondary">Sujets à explorer et à éviter.</p>
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
          <div className="mt-4 space-y-5">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs">✓</span>
                <label className="text-sm font-medium text-green-700">Zone verte — Sujets à explorer</label>
              </div>
              <textarea
                value={scopeIn}
                onChange={(e) => setScopeIn(e.target.value)}
                placeholder="Ex: Intégration dans l'équipe, relation avec le manager..."
                rows={4}
                className="w-full rounded-lg border border-green-200 bg-green-50/50 px-3 py-2 text-sm focus:border-green-400 focus:outline-none"
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
                placeholder="Ex: Rémunération, politique d'entreprise..."
                rows={4}
                className="w-full rounded-lg border border-red-200 bg-red-50/50 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Questions step */}
      {currentStep === "questions" && (
        <div>
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ht-text">Questions structurantes</h2>
              <p className="mt-1 text-sm text-ht-text-secondary">Questions fixes et points de passage.</p>
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
          <div className="mt-4 space-y-8">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-ht-text">Questions d&apos;ancrage</h3>
                  <p className="text-xs text-ht-text-secondary">Posées au début, dans l&apos;ordre défini</p>
                </div>
                <button onClick={() => addQuestion("anchor")} className="rounded-lg border border-ht-border px-3 py-1.5 text-xs font-medium text-ht-text-secondary hover:bg-ht-fill-secondary">
                  + Ajouter
                </button>
              </div>
              <div className="space-y-2">
                {anchorQuestions.map((q, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="mt-2.5 text-xs font-medium text-ht-text-secondary">{i + 1}.</span>
                    <input
                      type="text"
                      value={q}
                      onChange={(e) => updateQuestion("anchor", i, e.target.value)}
                      placeholder="Ex: Sur une échelle de 1 à 10, comment évaluez-vous votre intégration ?"
                      className="flex-1 rounded-lg border border-ht-border px-3 py-2 text-sm text-ht-text focus:border-ht-primary focus:outline-none"
                    />
                    {anchorQuestions.length > 1 && (
                      <button onClick={() => removeQuestion("anchor", i)} className="text-ht-text-secondary hover:text-ht-error">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-ht-text">Questions de passage</h3>
                  <p className="text-xs text-ht-text-secondary">Intercalées au moment pertinent</p>
                </div>
                <button onClick={() => addQuestion("checkpoint")} className="rounded-lg border border-ht-border px-3 py-1.5 text-xs font-medium text-ht-text-secondary hover:bg-ht-fill-secondary">
                  + Ajouter
                </button>
              </div>
              <div className="space-y-2">
                {checkpointQuestions.map((q, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="mt-2.5 text-xs text-ht-text-secondary">~</span>
                    <input
                      type="text"
                      value={q}
                      onChange={(e) => updateQuestion("checkpoint", i, e.target.value)}
                      placeholder="Ex: Avez-vous identifié un point bloquant ?"
                      className="flex-1 rounded-lg border border-ht-border px-3 py-2 text-sm text-ht-text focus:border-ht-primary focus:outline-none"
                    />
                    {checkpointQuestions.length > 1 && (
                      <button onClick={() => removeQuestion("checkpoint", i)} className="text-ht-text-secondary hover:text-ht-error">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis step */}
      {currentStep === "analysis" && (
        <div>
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ht-text">Structure d&apos;analyse</h2>
              <p className="mt-1 text-sm text-ht-text-secondary">Dimensions produites après chaque interview.</p>
            </div>
            <button
              onClick={handleSuggestAnalysis}
              disabled={suggestingAnalysis}
              className="mt-1 flex shrink-0 items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-2 text-xs font-medium text-purple-600 hover:bg-purple-100 disabled:opacity-50 transition-colors"
            >
              {suggestingAnalysis ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Générer via IA
            </button>
          </div>
          <div className="mb-4 mt-4">
            <button onClick={addDimension} className="rounded-lg border border-ht-border px-4 py-2 text-sm font-medium text-ht-text-secondary hover:bg-ht-fill-secondary">
              + Ajouter une dimension
            </button>
          </div>
          <div className="space-y-3">
            {analysisTemplate.map((dim, i) => (
              <div key={dim.key} className="rounded-xl border border-ht-border p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-ht-text-secondary">Libellé</label>
                      <input
                        type="text"
                        value={dim.label}
                        onChange={(e) => updateDimension(i, "label", e.target.value)}
                        className="w-full rounded-lg border border-ht-border px-3 py-1.5 text-sm focus:border-ht-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-ht-text-secondary">Type</label>
                      <select
                        value={dim.type}
                        onChange={(e) => updateDimension(i, "type", e.target.value)}
                        className="w-full rounded-lg border border-ht-border px-3 py-1.5 text-sm focus:border-ht-primary focus:outline-none"
                      >
                        <option value="score_1_10">Score 1-10</option>
                        <option value="score_low_med_high">Faible / Moyen / Élevé</option>
                        <option value="text">Texte libre</option>
                        <option value="list">Liste</option>
                        <option value="boolean">Oui / Non</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={() => removeDimension(i)} className="ml-2 mt-5 text-ht-text-secondary hover:text-ht-error">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-ht-text-secondary">Description</label>
                  <input
                    type="text"
                    value={dim.description || ""}
                    onChange={(e) => updateDimension(i, "description", e.target.value)}
                    placeholder="Que mesure cette dimension ?"
                    className="w-full rounded-lg border border-ht-border px-3 py-1.5 text-sm focus:border-ht-primary focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => {
            if (currentIndex === 0) router.push(`/creator/interview/${interviewId}`);
            else setCurrentStep(INTERVIEW_STEPS[currentIndex - 1].key);
          }}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-ht-text-secondary hover:bg-ht-fill-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          {currentIndex === 0 ? "Annuler" : "Précédent"}
        </button>

        {currentIndex === INTERVIEW_STEPS.length - 1 ? (
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex items-center gap-2 rounded-full bg-ht-primary px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-ht-primary-dark disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Enregistrer
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={saving || !title.trim()}
            className="flex items-center gap-2 rounded-full bg-ht-primary px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-ht-primary-dark disabled:opacity-50"
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
