"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Eye,
  Trash2,
  Copy,
  Clock,
  FileText,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FORMAT_META, type FormatSlug } from "@/types";

interface Resource {
  id: string;
  title: string | null;
  description: string | null;
  status: string;
  objective: string | null;
  tone: string;
  language: string;
  enabledFormats: string;
  createdAt: string;
  updatedAt: string;
  contents: Array<{ format: string }>;
  sessions: Array<{ completed: boolean }>;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-600" },
  analyzed: { label: "Analysé", color: "bg-yellow-50 text-yellow-700" },
  generated: { label: "Généré", color: "bg-blue-50 text-blue-700" },
  published: { label: "Publié", color: "bg-green-50 text-green-700" },
};

export default function CreatorDashboard() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/resources")
      .then((res) => res.json())
      .then((data) => {
        setResources(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette ressource ?")) return;
    await fetch(`/api/resources/${id}`, { method: "DELETE" });
    setResources((prev) => prev.filter((r) => r.id !== id));
    setOpenMenu(null);
  };

  const handleDuplicate = async (resource: Resource) => {
    setOpenMenu(null);
    try {
      const res = await fetch(`/api/resources/${resource.id}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        const newResource = await res.json();
        setResources((prev) => [newResource, ...prev]);
      }
    } catch {
      // Silent for POC
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const parseFormats = (json: string): FormatSlug[] => {
    try {
      return JSON.parse(json) as FormatSlug[];
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Stats
  const totalResources = resources.length;
  const publishedCount = resources.filter((r) => r.status === "published").length;
  const totalSessions = resources.reduce((sum, r) => sum + (r.sessions?.length || 0), 0);
  const completedSessions = resources.reduce(
    (sum, r) => sum + (r.sessions?.filter((s) => s.completed)?.length || 0),
    0
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes ressources</h1>
        <Link href="/creator/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle ressource
          </Button>
        </Link>
      </div>

      {/* Quick stats */}
      {totalResources > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-white p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{totalResources}</p>
            <p className="text-xs text-gray-500">Ressources</p>
          </div>
          <div className="rounded-lg border bg-white p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{publishedCount}</p>
            <p className="text-xs text-gray-500">Publiées</p>
          </div>
          <div className="rounded-lg border bg-white p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalSessions}</p>
            <p className="text-xs text-gray-500">Sessions</p>
          </div>
          <div className="rounded-lg border bg-white p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{completedSessions}</p>
            <p className="text-xs text-gray-500">Complétées</p>
          </div>
        </div>
      )}

      {resources.length === 0 ? (
        <div className="py-16 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">Aucune ressource pour le moment</p>
          <Link href="/creator/new">
            <Button className="mt-4" variant="outline">
              Créer ma première ressource
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => {
            const status = STATUS_LABELS[resource.status] || STATUS_LABELS.draft;
            const formats = parseFormats(resource.enabledFormats);
            const sessionCount = resource.sessions?.length || 0;

            return (
              <Card key={resource.id} className="transition-shadow hover:shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Main info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {resource.title || "Sans titre"}
                      </p>
                      {resource.description && (
                        <p className="mt-0.5 truncate text-sm text-gray-500">
                          {resource.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>

                        {/* Formats icons */}
                        {formats.length > 0 && (
                          <span className="text-sm">
                            {formats.map((f) => FORMAT_META[f]?.icon || "").join(" ")}
                          </span>
                        )}

                        {/* Sessions count */}
                        {sessionCount > 0 && (
                          <span className="text-xs text-gray-400">
                            {sessionCount} session(s)
                          </span>
                        )}

                        {/* Date */}
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {formatDate(resource.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {(resource.status === "generated" || resource.status === "published") && (
                        <Link href={`/consume/${resource.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}

                      {/* More menu */}
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setOpenMenu(openMenu === resource.id ? null : resource.id)
                          }
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>

                        {openMenu === resource.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenu(null)}
                            />
                            <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border bg-white py-1 shadow-lg">
                              {(resource.status === "generated" || resource.status === "published") && (
                                <button
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  onClick={() => handleDuplicate(resource)}
                                >
                                  <Copy className="h-4 w-4" />
                                  Dupliquer
                                </button>
                              )}
                              <button
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                onClick={() => handleDelete(resource.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Supprimer
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
