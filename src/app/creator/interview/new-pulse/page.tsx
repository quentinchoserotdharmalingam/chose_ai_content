"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Check, Activity } from "lucide-react";
import {
  INTERVIEW_THEME_META,
  INTERVIEW_TONE_META,
  PULSE_FREQUENCY_META,
  type InterviewTheme,
  type InterviewTone,
  type PulseFrequency,
} from "@/types";

type Step = "config" | "publish";

export default function NewPulsePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("config");
  const [saving, setSaving] = useState(false);
  const [pulseId, setPulseId] = useState<string | null>(null);

  // Config
  const [title, setTitle] = useState("");
  const [pulseQuestion, setPulseQuestion] = useState("");
  const [theme, setTheme] = useState<InterviewTheme>("satisfaction");
  const [tone, setTone] = useState<InterviewTone>("bienveillant");
  const [frequency, setFrequency] = useState<PulseFrequency>("weekly");
  const [maxFollowUps, setMaxFollowUps] = useState(3);

  const saveOrCreate = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      if (pulseId) {
        await fetch(`/api/interviews/${pulseId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        const res = await fetch("/api/interviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, type: "pulse" }),
        });
        const created = await res.json();
        setPulseId(created.id);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    await saveOrCreate({
      title: title || "Nouveau pulse",
      theme,
      tone,
      pulseQuestion,
      pulseFrequency: frequency,
      pulseMaxFollowUps: maxFollowUps,
    });
    setCurrentStep("publish");
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      await saveOrCreate({
        title: title || "Nouveau pulse",
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

      {/* Steps indicator */}
      <div className="mb-6 flex items-center gap-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold ${
          currentStep === "config" ? "bg-ht-primary text-white" : "bg-green-100 text-green-600"
        }`}>
          {currentStep === "config" ? "1" : <Check className="h-3.5 w-3.5" />}
        </div>
        <div className="h-px flex-1 bg-ht-border" />
        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold ${
          currentStep === "publish" ? "bg-ht-primary text-white" : "bg-ht-fill-secondary text-ht-text-secondary"
        }`}>
          2
        </div>
      </div>

      {currentStep === "config" ? (
        <div className="space-y-5 rounded-xl border border-ht-border bg-white p-6">
          {/* Title */}
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

          {/* Pulse question */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ht-text">
              Question score (1-10)
            </label>
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

          {/* Max follow-ups */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ht-text">
              Questions de suivi IA (max)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => (
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
