"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Shuffle,
  RotateCcw,
  Check,
  X,
  Trophy,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FlashcardsContent } from "@/types";

interface Props {
  content: object;
}

type Rating = "knew" | "hesitated" | "missed";

interface CardResult {
  cardId: number;
  rating: Rating;
}

export function FlashcardsRenderer({ content }: Props) {
  const data = content as FlashcardsContent;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [results, setResults] = useState<CardResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [direction, setDirection] = useState(0); // -1 left, 1 right

  // Shuffle logic
  const cardOrder = useMemo(() => {
    const indices = data.cards?.map((_, i) => i) || [];
    if (shuffled) {
      // Fisher-Yates
      const arr = [...indices];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
    return indices;
  }, [shuffled, data.cards]);

  const card = data.cards?.[cardOrder[currentIndex]];
  const total = data.cards?.length || 0;
  const isRated = results.find((r) => r.cardId === card?.id);

  const goTo = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setFlipped(false);
    setShowHint(false);
  }, [currentIndex]);

  const handleShuffle = () => {
    setShuffled((s) => !s);
    setCurrentIndex(0);
    setFlipped(false);
    setShowHint(false);
    setResults([]);
    setShowResults(false);
  };

  const handleRate = (rating: Rating) => {
    if (!card) return;
    setResults((prev) => {
      const filtered = prev.filter((r) => r.cardId !== card.id);
      return [...filtered, { cardId: card.id, rating }];
    });
    // Auto-advance after rating
    if (currentIndex < total - 1) {
      setTimeout(() => goTo(currentIndex + 1), 300);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setFlipped(false);
    setShowHint(false);
    setResults([]);
    setShowResults(false);
  };

  const handleFinish = () => {
    setShowResults(true);
  };

  if (!card) return <p className="text-gray-500">Pas de flashcards disponibles</p>;

  // Categories
  const categories = [...new Set(data.cards.map((c) => c.category).filter(Boolean))];

  // Stats
  const knewCount = results.filter((r) => r.rating === "knew").length;
  const hesitatedCount = results.filter((r) => r.rating === "hesitated").length;
  const missedCount = results.filter((r) => r.rating === "missed").length;
  const score = total > 0 ? Math.round((knewCount / total) * 100) : 0;

  // Results screen
  if (showResults) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Trophy className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold">{data.title}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {results.length} / {total} cartes révisées
          </p>
        </div>

        {/* Score */}
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-6 text-center">
          <p className="text-4xl font-bold text-blue-600">{score}%</p>
          <p className="mt-1 text-sm text-blue-700">Score de maîtrise</p>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{knewCount}</p>
            <p className="text-xs text-green-700">Maîtrisées</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{hesitatedCount}</p>
            <p className="text-xs text-amber-700">Hésitations</p>
          </div>
          <div className="rounded-lg bg-red-50 p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{missedCount}</p>
            <p className="text-xs text-red-700">À revoir</p>
          </div>
        </div>

        {/* Cards to review */}
        {missedCount + hesitatedCount > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Cartes à retravailler :</p>
            <div className="space-y-2">
              {results
                .filter((r) => r.rating !== "knew")
                .map((r) => {
                  const c = data.cards.find((card) => card.id === r.cardId);
                  if (!c) return null;
                  return (
                    <div
                      key={r.cardId}
                      className={`rounded-lg border p-3 text-sm ${
                        r.rating === "missed"
                          ? "border-red-200 bg-red-50"
                          : "border-amber-200 bg-amber-50"
                      }`}
                    >
                      <p className="font-medium">{c.question}</p>
                      <p className="mt-1 text-gray-600">{c.answer}</p>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            <RotateCcw className="mr-2 h-4 w-4" />
            Recommencer
          </Button>
          {missedCount + hesitatedCount > 0 && (
            <Button
              onClick={() => {
                // Reset and shuffle to only show missed/hesitated
                setShowResults(false);
                setCurrentIndex(0);
                setFlipped(false);
              }}
              className="flex-1"
            >
              Réviser les erreurs
            </Button>
          )}
        </div>
      </div>
    );
  }

  const difficultyConfig = {
    easy: { label: "Facile", border: "border-green-200", bg: "bg-green-50", text: "text-green-700" },
    medium: { label: "Moyen", border: "border-blue-200", bg: "bg-blue-50", text: "text-blue-700" },
    hard: { label: "Difficile", border: "border-red-200", bg: "bg-red-50", text: "text-red-700" },
  };
  const diff = difficultyConfig[card.difficulty] || difficultyConfig.medium;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold">{data.title}</h3>
        {data.description && (
          <p className="mt-0.5 text-sm text-gray-500">{data.description}</p>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium tabular-nums text-gray-500">
          {currentIndex + 1} / {total}
        </span>

        {/* Category badge */}
        {card.category && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {card.category}
          </span>
        )}

        <div className="flex-1" />

        {/* Rated count */}
        {results.length > 0 && (
          <button
            onClick={handleFinish}
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <BarChart3 className="h-3 w-3" />
            {results.length}/{total}
          </button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleShuffle}
          className={shuffled ? "text-blue-600" : ""}
        >
          <Shuffle className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress bar with difficulty colors */}
      <div className="flex gap-0.5">
        {cardOrder.map((orderIdx, i) => {
          const c = data.cards[orderIdx];
          const result = results.find((r) => r.cardId === c.id);
          return (
            <button
              key={orderIdx}
              onClick={() => goTo(i)}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i === currentIndex
                  ? "bg-blue-600"
                  : result?.rating === "knew"
                  ? "bg-green-400"
                  : result?.rating === "hesitated"
                  ? "bg-amber-400"
                  : result?.rating === "missed"
                  ? "bg-red-400"
                  : "bg-gray-200"
              }`}
            />
          );
        })}
      </div>

      {/* Card with swipe animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${cardOrder[currentIndex]}-${flipped}`}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -30 }}
          transition={{ duration: 0.2 }}
          className="cursor-pointer"
          onClick={() => setFlipped(!flipped)}
          style={{ minHeight: "220px" }}
        >
          {!flipped ? (
            /* Front */
            <div className={`rounded-xl border-2 ${diff.border} ${diff.bg} p-6 sm:p-8`}>
              <div className="mb-4 flex items-center justify-between">
                <span className={`rounded-full bg-white px-2.5 py-0.5 text-xs font-medium ${diff.text}`}>
                  {diff.label}
                </span>
                {isRated && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    isRated.rating === "knew" ? "bg-green-100 text-green-700"
                    : isRated.rating === "hesitated" ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
                  }`}>
                    {isRated.rating === "knew" ? "✓" : isRated.rating === "hesitated" ? "~" : "✗"}
                  </span>
                )}
              </div>
              <p className="text-center text-lg font-medium leading-relaxed">
                {card.question}
              </p>
              <p className="mt-6 text-center text-xs text-gray-400">
                Touchez pour voir la réponse
              </p>
            </div>
          ) : (
            /* Back */
            <div className="rounded-xl border-2 border-gray-200 bg-white p-6 sm:p-8">
              <p className="mb-2 text-center text-xs font-medium uppercase text-gray-400">
                Réponse
              </p>
              <p className="text-center text-base leading-relaxed text-gray-800">
                {card.answer}
              </p>

              {/* Self-assessment buttons */}
              <div className="mt-6 flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleRate("missed"); }}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-50 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                >
                  <X className="h-4 w-4" />
                  À revoir
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRate("hesitated"); }}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-50 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
                >
                  ~
                  Hésité
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRate("knew"); }}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-50 py-2.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
                >
                  <Check className="h-4 w-4" />
                  Maîtrisé
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Hint */}
      {card.hint && !flipped && (
        <div className="text-center">
          {showHint ? (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700"
            >
              <Lightbulb className="h-4 w-4 flex-shrink-0" />
              {card.hint}
            </motion.p>
          ) : (
            <button
              onClick={() => setShowHint(true)}
              className="inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-amber-600"
            >
              <Lightbulb className="h-4 w-4" />
              Voir l&apos;indice
            </button>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          <span className="hidden sm:inline">Précédent</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" />
        </Button>

        {currentIndex === total - 1 && results.length > 0 ? (
          <Button size="sm" onClick={handleFinish}>
            <Trophy className="mr-1 h-4 w-4" />
            Résultats
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => goTo(currentIndex + 1)}
            disabled={currentIndex === total - 1}
          >
            <span className="hidden sm:inline">Suivant</span>
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
