"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Lightbulb, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FlashcardsContent } from "@/types";

interface Props {
  content: object;
}

export function FlashcardsRenderer({ content }: Props) {
  const data = content as FlashcardsContent;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const card = data.cards?.[currentIndex];
  if (!card) return <p className="text-gray-500">Pas de flashcards disponibles</p>;

  const total = data.cards.length;

  const goTo = (index: number) => {
    setCurrentIndex(index);
    setFlipped(false);
    setShowHint(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{data.title}</h3>
        <span className="text-sm text-gray-500">
          {currentIndex + 1} / {total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div
        className="relative cursor-pointer perspective-1000"
        onClick={() => setFlipped(!flipped)}
        style={{ minHeight: "200px" }}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.4 }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative"
        >
          {/* Front */}
          <div
            className={`rounded-xl border-2 p-8 text-center ${
              flipped ? "invisible" : ""
            } ${
              card.difficulty === "easy"
                ? "border-green-200 bg-green-50"
                : card.difficulty === "hard"
                ? "border-red-200 bg-red-50"
                : "border-blue-200 bg-blue-50"
            }`}
          >
            <span className="mb-2 inline-block rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-500">
              {card.difficulty === "easy" ? "Facile" : card.difficulty === "hard" ? "Difficile" : "Moyen"}
            </span>
            <p className="text-lg font-medium">{card.question}</p>
            <p className="mt-4 text-xs text-gray-400">Cliquez pour voir la réponse</p>
          </div>

          {/* Back */}
          {flipped && (
            <div className="rounded-xl border-2 border-gray-200 bg-white p-8 text-center">
              <p className="text-base leading-relaxed text-gray-700">{card.answer}</p>
              <p className="mt-4 text-xs text-gray-400">Cliquez pour revoir la question</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Hint */}
      {card.hint && !flipped && (
        <div className="text-center">
          {showHint ? (
            <p className="text-sm text-amber-600">
              <Lightbulb className="mr-1 inline h-4 w-4" />
              {card.hint}
            </p>
          ) : (
            <button
              onClick={() => setShowHint(true)}
              className="text-sm text-gray-400 hover:text-amber-600"
            >
              <Lightbulb className="mr-1 inline h-4 w-4" />
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
          <ChevronLeft className="h-4 w-4" />
          Précédent
        </Button>

        <Button variant="ghost" size="sm" onClick={() => goTo(0)}>
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(currentIndex + 1)}
          disabled={currentIndex === total - 1}
        >
          Suivant
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
