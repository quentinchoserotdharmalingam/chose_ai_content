"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FORMAT_META, type FormatSlug } from "@/types";
import { SyntheseRenderer } from "@/components/formats/SyntheseRenderer";
import { FlashcardsRenderer } from "@/components/formats/FlashcardsRenderer";
import { ModuleRenderer } from "@/components/formats/ModuleRenderer";
import { ScenariosRenderer } from "@/components/formats/ScenariosRenderer";
import { ContentEditor } from "@/components/creator/ContentEditor";
import {
  Pencil,
  Eye,
  RefreshCw,
  Check,
  Loader2,
  Save,
  CheckCircle2,
  Circle,
} from "lucide-react";

interface PreviewStepProps {
  resourceId: string;
  content: Record<string, object>;
  formats: FormatSlug[];
  onContentChange?: (content: Record<string, object>) => void;
  onBack?: () => void;
  onNext?: () => void;
}

type FormatValidation = Record<string, boolean>;

export function PreviewStep({
  resourceId,
  content,
  formats,
  onContentChange,
  onBack,
  onNext,
}: PreviewStepProps) {
  const previewableFormats = formats.filter((f) => f !== "chat" && content[f]);
  const [activeFormat, setActiveFormat] = useState<FormatSlug>(
    previewableFormats[0] || "synthese"
  );
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState<Record<string, object>>({ ...content });
  const [validation, setValidation] = useState<FormatValidation>({});
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenInstructions, setRegenInstructions] = useState("");

  const allValidated = previewableFormats.every((f) => validation[f]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/resources/${resourceId}/format-content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: activeFormat,
          content: editedContent[activeFormat],
        }),
      });
      // Invalidate validation on edit
      setValidation((v) => ({ ...v, [activeFormat]: false }));
      onContentChange?.({ ...editedContent });
      setEditMode(false);
    } catch {
      // Error handled silently for POC
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent((prev) => ({ ...prev, [activeFormat]: content[activeFormat] }));
    setEditMode(false);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setShowRegenModal(false);
    try {
      const res = await fetch(`/api/resources/${resourceId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: activeFormat,
          instructions: regenInstructions || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        setEditedContent((prev) => ({ ...prev, [activeFormat]: data.content }));
        onContentChange?.({ ...editedContent, [activeFormat]: data.content });
        setValidation((v) => ({ ...v, [activeFormat]: false }));
      }
    } catch {
      // Error handled silently for POC
    } finally {
      setRegenerating(false);
      setRegenInstructions("");
    }
  };

  const toggleValidation = () => {
    setValidation((v) => ({ ...v, [activeFormat]: !v[activeFormat] }));
  };

  const renderContent = () => {
    const data = editedContent[activeFormat];
    if (!data) return <p className="text-gray-500">Pas de contenu pour ce format</p>;

    if (editMode) {
      return (
        <ContentEditor
          format={activeFormat}
          content={data}
          onChange={(updated) =>
            setEditedContent((prev) => ({ ...prev, [activeFormat]: updated }))
          }
        />
      );
    }

    switch (activeFormat) {
      case "synthese":
        return <SyntheseRenderer content={data} />;
      case "flashcards":
        return <FlashcardsRenderer content={data} />;
      case "module":
        return <ModuleRenderer content={data} />;
      case "scenarios":
        return <ScenariosRenderer content={data} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold">Preview & Validation</h2>
      <p className="mb-6 text-sm text-gray-500">
        Prévisualisez, modifiez et validez le contenu généré par format
      </p>

      {/* Format tabs with validation badges */}
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {previewableFormats.map((format) => (
          <button
            key={format}
            onClick={() => {
              setActiveFormat(format);
              setEditMode(false);
            }}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeFormat === format
                ? "bg-coral text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>{FORMAT_META[format].icon}</span>
            {FORMAT_META[format].label}
            {validation[format] ? (
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            ) : (
              <Circle className="h-4 w-4 opacity-30" />
            )}
          </button>
        ))}
      </div>

      {/* Action bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
        {editMode ? (
          <>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1 h-4 w-4" />
              )}
              Sauvegarder
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
              Annuler
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
              <Pencil className="mr-1 h-4 w-4" />
              Modifier
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowRegenModal(true)}
              disabled={regenerating}
            >
              {regenerating ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-1 h-4 w-4" />
              )}
              Regénérer
            </Button>
            <Button
              size="sm"
              variant={validation[activeFormat] ? "default" : "outline"}
              onClick={toggleValidation}
              className={validation[activeFormat] ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {validation[activeFormat] ? (
                <Check className="mr-1 h-4 w-4" />
              ) : (
                <Eye className="mr-1 h-4 w-4" />
              )}
              {validation[activeFormat] ? "Validé" : "Valider ce format"}
            </Button>
          </>
        )}

        {/* Validation progress */}
        <span className="ml-auto text-xs text-gray-500">
          {previewableFormats.filter((f) => validation[f]).length} / {previewableFormats.length}{" "}
          formats validés
        </span>
      </div>

      {/* Regeneration modal */}
      {showRegenModal && (
        <div className="mb-4 rounded-lg border border-ht-primary/30 bg-coral-light p-4">
          <p className="mb-2 text-sm font-medium text-coral-dark">
            Regénérer {FORMAT_META[activeFormat].label}
          </p>
          <Textarea
            rows={2}
            placeholder="Instructions optionnelles (ex: Plus de détails sur le chapitre 3, Ton plus décontracté...)"
            value={regenInstructions}
            onChange={(e) => setRegenInstructions(e.target.value)}
            className="mb-3 bg-white"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleRegenerate}>
              <RefreshCw className="mr-1 h-4 w-4" />
              Regénérer
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowRegenModal(false);
                setRegenInstructions("");
              }}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mb-8">{renderContent()}</div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {onBack && (
          <Button variant="outline" size="lg" onClick={onBack}>
            Retour (modifier objectif)
          </Button>
        )}
        <Link href={`/consume/${resourceId}`}>
          <Button size="lg" variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Voir comme enrollee
          </Button>
        </Link>
        <Button
          size="lg"
          disabled={!allValidated}
          className={!allValidated ? "opacity-50" : ""}
          onClick={onNext}
        >
          {allValidated
            ? "Configurer les extensions"
            : `Validez tous les formats (${previewableFormats.filter((f) => validation[f]).length}/${previewableFormats.length})`}
        </Button>
      </div>
    </div>
  );
}
