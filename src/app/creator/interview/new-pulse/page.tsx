"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Check, Activity, Sparkles } from "lucide-react";
import {
  INTERVIEW_THEME_META,
  INTERVIEW_TONE_META,
  PULSE_FREQUENCY_META,
  type InterviewTheme,
  type InterviewTone,
  type PulseFrequency,
} from "@/types";

type Step = "config" | "publish";

const STEPS: { key: Step; label: string }[] = [
  { key: "config", label: "Configuration" },
  { key: "publish", label: "Publication" },
];

export default function NewPulsePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("config");
  const [saving, setSaving] = useState(false);
  const [pulseId, setPulseId] = useState<string | null>(null);

  // Config
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pulseQuestion, setPulseQuestion] = useState("");
  const [theme, setTheme] = useState<InterviewTheme>("satisfaction");
  const [tone, setTone] = useState<InterviewTone>("bienveillant");
  const [frequency, setFrequency] = useState<PulseFrequency>("weekly");
  const [maxFollowUps, setMaxFollowUps] = useState(3);

  // AI suggestion states
  const [suggestingTitle, setSuggestingTitle] = useState(false);
  const [suggestingQuestion, setSuggestingQuestion] = useState(false);

  const saveOrCreate = async (data: Record<string, unknown>): Promise<string> => {
    if (pulseId) {
      await fetch(`/api/interviews/${pulseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return pulseId;
    } else {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type: "pulse" }),
      });
      const created = await res.json();
      setPulseId(created.id);
      return created.id;
    }
  };

  const ensureSaved = async (): Promise<string> => {
    return await saveOrCreate({
      title: title || "Nouveau pulse",
      description: description || null,
      theme,
      tone,
      pulseQuestion,
      pulseFrequency: frequency,
      pulseMaxFollowUps: maxFollowUps,
    });
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

  const handleSuggestQuestion = async () => {
    setSuggestingQuestion(true);
    try {
      const id = await ensureSaved();
      const res = await fetch(`/api/interviews/${id}/suggest-pulse-question`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.question) setPulseQuestion(data.question);
      }
    } catch { /* Silent */ } finally {
      setSuggestingQuestion(false);
    }
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      await ensureSaved();
      setCurrentStep("publish");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      await saveOrCreate({
        title: title || "Nouveau pulse",
        description: description || null,
        theme,
        tone,
        pulseQuestion,
        pulseFrequency: frequency,
        pulseMaxFollowUps: maxFollowUps,
        status: "published",
      });
      router.push("/creator/interview");
    } finally {
      setSaving(false);
    }
  };

  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Back link */}
      <Link
        href="/creator/interview"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ht-text-secondary hover:text-ht-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ht-primary/10">
          <Activity className="h-5 w-5 text-ht-primary" />
        </div>
        <div>
          <h1 className="text-[20px] font-medium text-ht-text">Nouveau Pulse</h1>
          <p className="text-[13px] text-ht-text-secondary">
            Micro-interview récurrente pour suivre le ressenti
          </p>
        </div>
      </div>

      {/* Steps indicator — compact centered with labels */}
      <div className="mb-6 flex items-center justify-center gap-3">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center gap-3">
            <button
              onClick={() => i < currentIndex && setCurrentStep(STEPS[i].key)}
              disabled={i > currentIndex}
              className="flex items-center gap-2"
            >
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold transition-colors ${
                i < currentIndex
                  ? "bg-green-100 text-green-600"
                  : i === currentIndex
                  ? "bg-ht-primary text-white"
                  : "bg-ht-fill-secondary text-ht-text-secondary"
              }`}>
                {i < currentIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-[13px] ${
                i === currentIndex ? "font-medium text-ht-text" : "text-ht-text-secondary"
              }`}>
                {step.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-12 ${i < currentIndex ? "bg-green-300" : "bg-ht-border"}`} />
            )}
          </div>
        ))}
      </div>

      {currentStep === "config" ? (
        <div className="space-y-5 rounded-xl border border-ht-border bg-white p-6">
          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[13px] font-medium text-ht-text">Titre</label>
              <button
                onClick={handleSuggestTitle}
                disabled={suggestingTitle}
                className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1 text-[11px] font-medium text-purple-600 hover:bg-purple-100 disabled:opacity-50 transition-colors"
              >
                {suggestingTitle ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Générer titre
              </button>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Bien-être hebdomadaire"
              className="w-full rounded-lg border border-ht-border px-3 py-2.5 text-[13px] text-ht-text placeholder:text-ht-text-secondary focus:border-ht-border-secondary focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ht-text">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description interne pour les administrateurs"
              rows={2}
              className="w-full rounded-lg border border-ht-border px-3 py-2.5 text-[13px] text-ht-text placeholder:text-ht-text-secondary focus:border-ht-border-secondary focus:outline-none resize-none"
            />
          </div>

          {/* Pulse question */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[13px] font-medium text-ht-text">
                Question score (1-10)
              </label>
              <button
                onClick={handleSuggestQuestion}
                disabled={suggestingQuestion}
                className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1 text-[11px] font-medium text-purple-600 hover:bg-purple-100 disabled:opacity-50 transition-colors"
              >
                {suggestingQuestion ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Générer question
              </button>
            </div>
            <textarea
              value={pulseQuestion}
              onChange={(e) => setPulseQuestion(e.target.value)}
              placeholder="Ex: Comment évaluez-vous votre bien-être au travail cette semaine ?"
              rows={2}
              className="w-full rounded-lg border border-ht-border px-3 py-2.5 text-[13px] text-ht-text placeholder:text-ht-text-secondary focus:border-ht-border-secondary focus:outline-none resize-none"
            />
            <p className="mt-1 text-[11px] text-ht-text-secondary">
              Le collaborateur verra cette question avec une échelle de 1 à 10
            </p>
          </div>

          {/* Theme */}
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

          {/* Tone */}
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

          {/* Frequency */}
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

          {/* Max follow-ups — now 1 to 5 */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ht-text">
              Questions de suivi IA (max)
            </label>
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
            <p className="mt-1 text-[11px] text-ht-text-secondary">
              L&apos;IA posera entre 1 et {maxFollowUps} questions selon le score
            </p>
          </div>

          {/* Next button */}
          <button
            onClick={handleNext}
            disabled={!title.trim() || !pulseQuestion.trim() || saving}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ht-primary py-3 text-[13px] font-semibold text-white shadow-ht-1 transition-all hover:bg-ht-primary-dark disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Suivant
          </button>
        </div>
      ) : (
        /* Publish step */
        <div className="space-y-5 rounded-xl border border-ht-border bg-white p-6">
          <h2 className="text-[15px] font-semibold text-ht-text">Récapitulatif</h2>

          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <span className="text-[13px] text-ht-text-secondary">Titre</span>
              <span className="text-[13px] font-medium text-ht-text text-right max-w-[60%]">{title}</span>
            </div>
            {description && (
              <div className="flex items-start justify-between">
                <span className="text-[13px] text-ht-text-secondary">Description</span>
                <span className="text-[13px] text-ht-text text-right max-w-[60%]">{description}</span>
              </div>
            )}
            <div className="flex items-start justify-between">
              <span className="text-[13px] text-ht-text-secondary">Question</span>
              <span className="text-[13px] text-ht-text text-right max-w-[60%]">{pulseQuestion}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-ht-text-secondary">Thème</span>
              <span className="text-[13px] text-ht-text">
                {INTERVIEW_THEME_META[theme].icon} {INTERVIEW_THEME_META[theme].label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-ht-text-secondary">Ton</span>
              <span className="text-[13px] text-ht-text">{INTERVIEW_TONE_META[tone].label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-ht-text-secondary">Fréquence</span>
              <span className="text-[13px] text-ht-text">{PULSE_FREQUENCY_META[frequency].label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-ht-text-secondary">Follow-ups IA</span>
              <span className="text-[13px] text-ht-text">Max {maxFollowUps}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep("config")}
              className="flex-1 rounded-full border border-ht-border py-3 text-[13px] font-medium text-ht-text transition-all hover:bg-ht-fill-secondary"
            >
              Modifier
            </button>
            <button
              onClick={handlePublish}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ht-primary py-3 text-[13px] font-semibold text-white shadow-ht-1 transition-all hover:bg-ht-primary-dark disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Publier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
