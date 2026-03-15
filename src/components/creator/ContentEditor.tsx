"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type {
  FormatSlug,
  SyntheseContent,
  FlashcardsContent,
  ModuleContent,
  ScenariosContent,
} from "@/types";

interface ContentEditorProps {
  format: FormatSlug;
  content: object;
  onChange: (content: object) => void;
}

export function ContentEditor({ format, content, onChange }: ContentEditorProps) {
  switch (format) {
    case "synthese":
      return <SyntheseEditor content={content as SyntheseContent} onChange={onChange} />;
    case "flashcards":
      return <FlashcardsEditor content={content as FlashcardsContent} onChange={onChange} />;
    case "module":
      return <ModuleEditor content={content as ModuleContent} onChange={onChange} />;
    case "scenarios":
      return <ScenariosEditor content={content as ScenariosContent} onChange={onChange} />;
    default:
      return null;
  }
}

// --- Synthèse Editor ---
function SyntheseEditor({
  content,
  onChange,
}: {
  content: SyntheseContent;
  onChange: (c: SyntheseContent) => void;
}) {
  const update = (partial: Partial<SyntheseContent>) => onChange({ ...content, ...partial });

  const moveSection = (from: number, to: number) => {
    const sections = [...content.sections];
    const [moved] = sections.splice(from, 1);
    sections.splice(to, 0, moved);
    update({ sections });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Titre</label>
        <Input value={content.title} onChange={(e) => update({ title: e.target.value })} />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Introduction</label>
        <Textarea
          rows={2}
          value={content.introduction || ""}
          onChange={(e) => update({ introduction: e.target.value })}
          placeholder="Phrase d'accroche contextualisant le sujet..."
        />
      </div>

      {content.sections?.map((section, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-gray-500">Section {i + 1}</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={i === 0}
                  onClick={() => moveSection(i, i - 1)}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={i === content.sections.length - 1}
                  onClick={() => moveSection(i, i + 1)}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
                {content.sections.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      update({ sections: content.sections.filter((_, j) => j !== i) })
                    }
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <div className="w-16">
                <label className="mb-1 block text-xs font-medium text-gray-500">Emoji</label>
                <Input
                  value={section.emoji || ""}
                  onChange={(e) => {
                    const sections = [...content.sections];
                    sections[i] = { ...sections[i], emoji: e.target.value };
                    update({ sections });
                  }}
                  className="text-center text-lg"
                  maxLength={2}
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-500">Titre de section</label>
                <Input
                  value={section.heading}
                  onChange={(e) => {
                    const sections = [...content.sections];
                    sections[i] = { ...sections[i], heading: e.target.value };
                    update({ sections });
                  }}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Contenu</label>
              <Textarea
                rows={4}
                value={section.content}
                onChange={(e) => {
                  const sections = [...content.sections];
                  sections[i] = { ...sections[i], content: e.target.value };
                  update({ sections });
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Citation / Highlight (optionnel)
              </label>
              <Input
                value={section.highlight || ""}
                onChange={(e) => {
                  const sections = [...content.sections];
                  sections[i] = { ...sections[i], highlight: e.target.value || undefined };
                  update({ sections });
                }}
                placeholder="Phrase clé marquante..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Points clés (un par ligne)
              </label>
              <Textarea
                rows={2}
                value={section.keyPoints?.join("\n") || ""}
                onChange={(e) => {
                  const sections = [...content.sections];
                  sections[i] = {
                    ...sections[i],
                    keyPoints: e.target.value.split("\n").filter(Boolean),
                  };
                  update({ sections });
                }}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          update({
            sections: [
              ...content.sections,
              { emoji: "", heading: "", content: "", keyPoints: [], highlight: undefined },
            ],
          })
        }
      >
        <Plus className="mr-1 h-3 w-3" /> Ajouter une section
      </Button>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">
          Points clés à retenir (un par ligne)
        </label>
        <Textarea
          rows={3}
          value={content.takeaways?.join("\n") || ""}
          onChange={(e) =>
            update({ takeaways: e.target.value.split("\n").filter(Boolean) })
          }
        />
      </div>
    </div>
  );
}

// --- Flashcards Editor ---
function FlashcardsEditor({
  content,
  onChange,
}: {
  content: FlashcardsContent;
  onChange: (c: FlashcardsContent) => void;
}) {
  const update = (partial: Partial<FlashcardsContent>) => onChange({ ...content, ...partial });

  const moveCard = (from: number, to: number) => {
    const cards = [...content.cards];
    const [moved] = cards.splice(from, 1);
    cards.splice(to, 0, moved);
    update({ cards });
  };

  // Existing categories for autocomplete
  const categories = [...new Set(content.cards.map((c) => c.category).filter(Boolean))];

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Titre</label>
        <Input value={content.title} onChange={(e) => update({ title: e.target.value })} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Description</label>
        <Input
          value={content.description || ""}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Décrivez le périmètre couvert par ces flashcards..."
        />
      </div>

      {/* Stats bar */}
      <div className="flex gap-3 rounded-lg bg-gray-50 p-2 text-xs text-gray-500">
        <span>{content.cards.length} cartes</span>
        <span>|</span>
        <span className="text-green-600">{content.cards.filter((c) => c.difficulty === "easy").length} faciles</span>
        <span className="text-blue-600">{content.cards.filter((c) => c.difficulty === "medium").length} moyennes</span>
        <span className="text-red-600">{content.cards.filter((c) => c.difficulty === "hard").length} difficiles</span>
        {categories.length > 0 && <span>| {categories.length} catégories</span>}
      </div>

      {content.cards?.map((card, i) => (
        <Card key={card.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-gray-500">Carte {i + 1}</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" disabled={i === 0} onClick={() => moveCard(i, i - 1)}>
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" disabled={i === content.cards.length - 1} onClick={() => moveCard(i, i + 1)}>
                  <ChevronDown className="h-3 w-3" />
                </Button>
                <select
                  className="rounded border px-2 py-1 text-xs"
                  value={card.difficulty}
                  onChange={(e) => {
                    const cards = [...content.cards];
                    cards[i] = { ...cards[i], difficulty: e.target.value as "easy" | "medium" | "hard" };
                    update({ cards });
                  }}
                >
                  <option value="easy">Facile</option>
                  <option value="medium">Moyen</option>
                  <option value="hard">Difficile</option>
                </select>
                {content.cards.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => update({ cards: content.cards.filter((_, j) => j !== i) })}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Catégorie</label>
              <Input
                value={card.category || ""}
                onChange={(e) => {
                  const cards = [...content.cards];
                  cards[i] = { ...cards[i], category: e.target.value || undefined };
                  update({ cards });
                }}
                placeholder="Thème de la carte"
                list={`categories-${i}`}
              />
              {categories.length > 0 && (
                <datalist id={`categories-${i}`}>
                  {categories.map((c) => <option key={c} value={c!} />)}
                </datalist>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Question</label>
              <Textarea
                rows={2}
                value={card.question}
                onChange={(e) => {
                  const cards = [...content.cards];
                  cards[i] = { ...cards[i], question: e.target.value };
                  update({ cards });
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Réponse</label>
              <Textarea
                rows={2}
                value={card.answer}
                onChange={(e) => {
                  const cards = [...content.cards];
                  cards[i] = { ...cards[i], answer: e.target.value };
                  update({ cards });
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Indice</label>
              <Input
                value={card.hint || ""}
                onChange={(e) => {
                  const cards = [...content.cards];
                  cards[i] = { ...cards[i], hint: e.target.value || undefined };
                  update({ cards });
                }}
                placeholder="Amorce orientant vers la réponse..."
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          update({
            cards: [
              ...content.cards,
              {
                id: Math.max(0, ...content.cards.map((c) => c.id)) + 1,
                question: "",
                answer: "",
                category: categories[0] || undefined,
                difficulty: "medium" as const,
              },
            ],
          })
        }
      >
        <Plus className="mr-1 h-3 w-3" /> Ajouter une carte
      </Button>
    </div>
  );
}

// --- Module Editor ---
function ModuleEditor({
  content,
  onChange,
}: {
  content: ModuleContent;
  onChange: (c: ModuleContent) => void;
}) {
  const update = (partial: Partial<ModuleContent>) => onChange({ ...content, ...partial });

  const moveStep = (from: number, to: number) => {
    const steps = [...content.steps];
    const [moved] = steps.splice(from, 1);
    steps.splice(to, 0, moved);
    update({ steps });
  };

  const lessonCount = content.steps.filter((s) => s.type === "lesson").length;
  const quizCount = content.steps.filter((s) => s.type === "quiz").length;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-500">Titre</label>
          <Input value={content.title} onChange={(e) => update({ title: e.target.value })} />
        </div>
        <div className="w-32">
          <label className="mb-1 block text-xs font-medium text-gray-500">Durée</label>
          <Input
            value={content.estimatedDuration}
            onChange={(e) => update({ estimatedDuration: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Description</label>
        <Input
          value={content.description || ""}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Ce que l'apprenant va maîtriser..."
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Objectif pédagogique</label>
        <Input
          value={content.objective || ""}
          onChange={(e) => update({ objective: e.target.value })}
          placeholder="Ce que l'apprenant saura faire à la fin..."
        />
      </div>

      {/* Stats bar */}
      <div className="flex gap-3 rounded-lg bg-gray-50 p-2 text-xs text-gray-500">
        <span>{content.steps.length} étapes</span>
        <span>|</span>
        <span className="text-blue-600">{lessonCount} leçons</span>
        <span className="text-purple-600">{quizCount} quiz</span>
      </div>

      {content.steps?.map((step, i) => (
        <Card key={step.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-gray-500">
                Étape {i + 1} — {step.type === "lesson" ? "📖 Leçon" : "❓ Quiz"}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" disabled={i === 0} onClick={() => moveStep(i, i - 1)}>
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" disabled={i === content.steps.length - 1} onClick={() => moveStep(i, i + 1)}>
                  <ChevronDown className="h-3 w-3" />
                </Button>
                {content.steps.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => update({ steps: content.steps.filter((_, j) => j !== i) })}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {step.type === "lesson" ? (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Titre</label>
                  <Input
                    value={step.title || ""}
                    onChange={(e) => {
                      const steps = [...content.steps];
                      steps[i] = { ...steps[i], title: e.target.value };
                      update({ steps });
                    }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Contenu</label>
                  <Textarea
                    rows={4}
                    value={step.content || ""}
                    onChange={(e) => {
                      const steps = [...content.steps];
                      steps[i] = { ...steps[i], content: e.target.value };
                      update({ steps });
                    }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Points clés (un par ligne)
                  </label>
                  <Textarea
                    rows={2}
                    value={step.keyPoints?.join("\n") || ""}
                    onChange={(e) => {
                      const steps = [...content.steps];
                      steps[i] = {
                        ...steps[i],
                        keyPoints: e.target.value.split("\n").filter(Boolean),
                      };
                      update({ steps });
                    }}
                    placeholder="Point clé 1&#10;Point clé 2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Exemple (optionnel)
                  </label>
                  <Textarea
                    rows={2}
                    value={step.example || ""}
                    onChange={(e) => {
                      const steps = [...content.steps];
                      steps[i] = { ...steps[i], example: e.target.value || undefined };
                      update({ steps });
                    }}
                    placeholder="Exemple concret ou mise en situation..."
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Question</label>
                  <Textarea
                    rows={2}
                    value={step.question || ""}
                    onChange={(e) => {
                      const steps = [...content.steps];
                      steps[i] = { ...steps[i], question: e.target.value };
                      update({ steps });
                    }}
                  />
                </div>
                {step.options?.map((option, j) => (
                  <div key={j} className={`ml-4 space-y-2 rounded border p-3 ${option.correct ? "border-green-300 bg-green-50/50" : ""}`}>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={option.correct}
                          onChange={(e) => {
                            const steps = [...content.steps];
                            const options = [...(steps[i].options || [])];
                            options[j] = { ...options[j], correct: e.target.checked };
                            steps[i] = { ...steps[i], options };
                            update({ steps });
                          }}
                        />
                        Correcte
                      </label>
                      <Input
                        className="flex-1"
                        value={option.label}
                        placeholder="Libellé"
                        onChange={(e) => {
                          const steps = [...content.steps];
                          const options = [...(steps[i].options || [])];
                          options[j] = { ...options[j], label: e.target.value };
                          steps[i] = { ...steps[i], options };
                          update({ steps });
                        }}
                      />
                      {(step.options?.length || 0) > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const steps = [...content.steps];
                            const options = [...(steps[i].options || [])];
                            options.splice(j, 1);
                            steps[i] = { ...steps[i], options };
                            update({ steps });
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <Input
                      value={option.explanation}
                      placeholder="Explication"
                      onChange={(e) => {
                        const steps = [...content.steps];
                        const options = [...(steps[i].options || [])];
                        options[j] = { ...options[j], explanation: e.target.value };
                        steps[i] = { ...steps[i], options };
                        update({ steps });
                      }}
                    />
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const steps = [...content.steps];
                    const options = [...(steps[i].options || [])];
                    options.push({ label: "", correct: false, explanation: "" });
                    steps[i] = { ...steps[i], options };
                    update({ steps });
                  }}
                >
                  <Plus className="mr-1 h-3 w-3" /> Ajouter une option
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            update({
              steps: [
                ...content.steps,
                {
                  id: Math.max(0, ...content.steps.map((s) => s.id)) + 1,
                  type: "lesson",
                  title: "",
                  content: "",
                  keyPoints: [],
                },
              ],
            })
          }
        >
          <Plus className="mr-1 h-3 w-3" /> Leçon
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            update({
              steps: [
                ...content.steps,
                {
                  id: Math.max(0, ...content.steps.map((s) => s.id)) + 1,
                  type: "quiz",
                  question: "",
                  options: [
                    { label: "", correct: true, explanation: "" },
                    { label: "", correct: false, explanation: "" },
                    { label: "", correct: false, explanation: "" },
                  ],
                },
              ],
            })
          }
        >
          <Plus className="mr-1 h-3 w-3" /> Quiz
        </Button>
      </div>
    </div>
  );
}

// --- Scenarios Editor ---
function ScenariosEditor({
  content,
  onChange,
}: {
  content: ScenariosContent;
  onChange: (c: ScenariosContent) => void;
}) {
  const update = (partial: Partial<ScenariosContent>) => onChange({ ...content, ...partial });

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Titre</label>
        <Input value={content.title} onChange={(e) => update({ title: e.target.value })} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Contexte</label>
        <Textarea
          rows={2}
          value={content.context}
          onChange={(e) => update({ context: e.target.value })}
        />
      </div>

      {content.steps?.map((step, i) => (
        <Card key={step.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">
              Étape : {step.id}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Narratif</label>
              <Textarea
                rows={3}
                value={step.narrative}
                onChange={(e) => {
                  const steps = [...content.steps];
                  steps[i] = { ...steps[i], narrative: e.target.value };
                  update({ steps });
                }}
              />
            </div>
            {step.choices?.map((choice, j) => (
              <div key={j} className="ml-4 space-y-2 rounded border p-3">
                <div className="flex items-center gap-2">
                  <select
                    className="rounded border px-2 py-1 text-xs"
                    value={choice.quality}
                    onChange={(e) => {
                      const steps = [...content.steps];
                      const choices = [...steps[i].choices];
                      choices[j] = {
                        ...choices[j],
                        quality: e.target.value as "optimal" | "acceptable" | "poor",
                      };
                      steps[i] = { ...steps[i], choices };
                      update({ steps });
                    }}
                  >
                    <option value="optimal">Optimal</option>
                    <option value="acceptable">Acceptable</option>
                    <option value="poor">Mauvais</option>
                  </select>
                  <Input
                    className="flex-1"
                    value={choice.label}
                    placeholder="Choix"
                    onChange={(e) => {
                      const steps = [...content.steps];
                      const choices = [...steps[i].choices];
                      choices[j] = { ...choices[j], label: e.target.value };
                      steps[i] = { ...steps[i], choices };
                      update({ steps });
                    }}
                  />
                </div>
                <Input
                  value={choice.feedback}
                  placeholder="Feedback"
                  onChange={(e) => {
                    const steps = [...content.steps];
                    const choices = [...steps[i].choices];
                    choices[j] = { ...choices[j], feedback: e.target.value };
                    steps[i] = { ...steps[i], choices };
                    update({ steps });
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Conclusion</label>
        <Textarea
          rows={3}
          value={content.conclusion}
          onChange={(e) => update({ conclusion: e.target.value })}
        />
      </div>
    </div>
  );
}
