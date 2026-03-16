"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronUp } from "lucide-react";
import type { SyntheseContent } from "@/types";

interface Props {
  content: object;
}

export function SyntheseRenderer({ content }: Props) {
  const data = content as SyntheseContent;
  const [readProgress, setReadProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Track scroll progress
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const totalHeight = container.scrollHeight - container.clientHeight;
    if (totalHeight <= 0) {
      setReadProgress(100);
      return;
    }

    // Use window scroll position relative to container
    const scrolled = Math.max(0, -rect.top);
    const progress = Math.min(100, (scrolled / (container.scrollHeight - window.innerHeight)) * 100);
    setReadProgress(Math.round(progress));

    // Detect active section
    sectionRefs.current.forEach((ref, i) => {
      if (ref) {
        const sRect = ref.getBoundingClientRect();
        if (sRect.top < window.innerHeight * 0.5 && sRect.bottom > 0) {
          setActiveSection(i);
        }
      }
    });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToSection = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div ref={containerRef}>
      {/* Progress bar — sticky */}
      <div className="sticky top-14 z-10 -mx-4 bg-white/90 px-4 pb-2 pt-2 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
            <motion.div
              className="h-full rounded-full bg-coral-light0"
              initial={{ width: 0 }}
              animate={{ width: `${readProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xs tabular-nums text-gray-400">{readProgress}%</span>
        </div>
      </div>

      {/* Title + duration */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 mt-2"
      >
        <h3 className="text-xl font-bold">{data.title}</h3>
        <p className="mt-1 text-sm text-gray-400">{data.duration} de lecture</p>
      </motion.div>

      {/* Introduction */}
      {data.introduction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <p className="text-base leading-relaxed text-gray-600">{data.introduction}</p>
        </motion.div>
      )}

      {/* Table of contents */}
      {data.sections?.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6 rounded-lg border border-gray-100 bg-gray-50 p-3"
        >
          <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Sommaire</p>
          <div className="space-y-1">
            {data.sections.map((section, i) => (
              <button
                key={i}
                onClick={() => scrollToSection(i)}
                className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm transition-colors ${
                  activeSection === i
                    ? "bg-coral-light text-coral font-medium"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <span className="w-5 text-center">{section.emoji || `${i + 1}.`}</span>
                <span className="truncate">{section.heading}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Sections */}
      <div className="space-y-5">
        {data.sections?.map((section, i) => (
          <motion.div
            key={i}
            ref={(el) => { sectionRefs.current[i] = el; }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {section.emoji && (
                    <span className="text-lg">{section.emoji}</span>
                  )}
                  {section.heading}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Content paragraphs */}
                <div className="space-y-2">
                  {section.content?.split("\n").filter(Boolean).map((paragraph, j) => (
                    <p key={j} className="text-sm leading-relaxed text-gray-700">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Highlight quote */}
                {section.highlight && (
                  <blockquote className="border-l-3 border-ht-primary/60 bg-coral-light/50 py-2 pl-4 pr-3">
                    <p className="text-sm font-medium italic text-coral-dark">
                      &ldquo;{section.highlight}&rdquo;
                    </p>
                  </blockquote>
                )}

                {/* Key points */}
                {section.keyPoints && section.keyPoints.length > 0 && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase text-gray-400">
                      Points clés
                    </p>
                    <div className="space-y-1.5">
                      {section.keyPoints.map((point, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm">
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-coral-light0" />
                          <span className="text-gray-700">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Takeaways */}
      {data.takeaways && data.takeaways.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + (data.sections?.length || 0) * 0.08 }}
          className="mt-6"
        >
          <Card className="border-ht-primary/30 bg-gradient-to-br from-ht-primary-warm to-ht-primary-warm/50">
            <CardHeader>
              <CardTitle className="text-base text-coral-dark">
                Ce qu&apos;il faut retenir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.takeaways.map((takeaway, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-ht-primary-warm text-xs font-bold text-coral-dark">
                      {i + 1}
                    </span>
                    <span className="text-coral-dark">{takeaway}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Back to top */}
      {readProgress > 30 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-20 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors z-40"
        >
          <ChevronUp className="h-5 w-5" />
        </motion.button>
      )}
    </div>
  );
}
