"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FORMAT_META, type FormatSlug } from "@/types";
import { Loader2, Rocket, CheckCircle2 } from "lucide-react";

interface PublishStepProps {
  resourceId: string;
  initialTitle: string;
  formats: FormatSlug[];
  onBack: () => void;
}

export function PublishStep({
  resourceId,
  initialTitle,
  formats,
  onBack,
}: PublishStepProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState("");
  const [defaultFormat, setDefaultFormat] = useState<FormatSlug>(formats[0] || "synthese");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await fetch(`/api/resources/${resourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          status: "published",
        }),
      });
      setPublished(true);
    } catch {
      // Error handled silently for POC
    } finally {
      setPublishing(false);
    }
  };

  if (published) {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Ressource publiée !</h2>
          <p className="mt-1 text-sm text-gray-500">
            &laquo; {title} &raquo; est maintenant disponible pour les enrollees
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push(`/consume/${resourceId}`)}>
            Voir comme enrollee
          </Button>
          <Button onClick={() => router.push("/creator")}>
            Retour au dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold">Publication</h2>
      <p className="mb-6 text-sm text-gray-500">
        Finalisez les détails de votre ressource avant publication
      </p>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Titre de la ressource
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Introduction au management agile"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez brièvement le contenu de cette ressource pour les enrollees..."
            rows={3}
          />
          <p className="mt-1 text-xs text-gray-400">
            Visible par les enrollees avant de commencer la consommation
          </p>
        </div>

        {/* Default format */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Format par défaut</CardTitle>
            <p className="text-xs text-gray-500">
              Le format proposé en premier à l&apos;enrollee (il pourra changer librement)
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {formats
                .filter((f) => f !== "chat")
                .map((format) => {
                  const meta = FORMAT_META[format];
                  return (
                    <button
                      key={format}
                      onClick={() => setDefaultFormat(format)}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                        defaultFormat === format
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-xl">{meta.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{meta.label}</p>
                        <p className="text-xs text-gray-500">{meta.duration}</p>
                      </div>
                    </button>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="py-4">
            <p className="mb-2 text-sm font-medium text-gray-700">Récapitulatif</p>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <span className="text-gray-400">Titre :</span> {title || "—"}
              </p>
              <p>
                <span className="text-gray-400">Formats :</span>{" "}
                {formats.map((f) => FORMAT_META[f].icon).join(" ")} ({formats.length} formats)
              </p>
              <p>
                <span className="text-gray-400">Format par défaut :</span>{" "}
                {FORMAT_META[defaultFormat].icon} {FORMAT_META[defaultFormat].label}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" size="lg" onClick={onBack}>
            Retour
          </Button>
          <Button
            size="lg"
            onClick={handlePublish}
            disabled={!title.trim() || publishing}
          >
            {publishing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="mr-2 h-4 w-4" />
            )}
            Publier la ressource
          </Button>
        </div>
      </div>
    </div>
  );
}
