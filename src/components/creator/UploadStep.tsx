"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface UploadStepProps {
  onUploaded: (resourceId: string, title?: string) => void;
}

export function UploadStep({ onUploaded }: UploadStepProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".pdf")) {
        setError("Seuls les fichiers PDF sont acceptés");
        return;
      }

      setFileName(file.name);
      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/resources", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Erreur upload");

        onUploaded(data.id, data.title || file.name.replace(".pdf", ""));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
        setUploading(false);
      }
    },
    [onUploaded]
  );

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold">Uploadez votre document</h2>
      <p className="mb-6 text-sm text-gray-500">
        Glissez-déposez un fichier PDF ou cliquez pour sélectionner
      </p>

      <Card
        className={`cursor-pointer border-2 border-dashed transition-colors ${
          dragging ? "border-blue-400 bg-coral-light" : "border-gray-200 hover:border-gray-300"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".pdf";
          input.onchange = () => {
            const file = input.files?.[0];
            if (file) handleFile(file);
          };
          input.click();
        }}
      >
        <CardContent className="flex flex-col items-center gap-4 py-12">
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-coral" />
              <p className="text-sm text-gray-500">Extraction du texte de {fileName}...</p>
            </>
          ) : fileName ? (
            <>
              <FileText className="h-10 w-10 text-coral" />
              <p className="text-sm font-medium">{fileName}</p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-400" />
              <p className="text-sm text-gray-500">PDF (max 50 Mo)</p>
            </>
          )}
        </CardContent>
      </Card>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
