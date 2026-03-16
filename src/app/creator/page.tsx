"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  Trash2,
  Copy,
  Eye,
  FileText,
  Sparkles,
} from "lucide-react";
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

const TYPE_LABELS: Record<string, string> = {
  draft: "Ressource IA",
  analyzed: "Ressource IA",
  generated: "Ressource IA",
  published: "Ressource IA",
};

export default function CreatorDashboard() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/resources")
      .then((res) => res.json())
      .then((data) => {
        setResources(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
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

  const parseFormats = (json: string): FormatSlug[] => {
    try {
      return JSON.parse(json) as FormatSlug[];
    } catch {
      return [];
    }
  };

  const filteredResources = resources.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.title?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-coral" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Formations</h1>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-52 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
          {/* Filter icon */}
          <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          {/* Add button */}
          <div className="relative" ref={addMenuRef}>
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="h-10 rounded-lg bg-coral px-5 text-sm font-semibold text-white transition-colors hover:bg-coral-dark"
            >
              Ajouter
            </button>
            {showAddMenu && (
              <div className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-gray-200 bg-white py-2 shadow-xl">
                <p className="px-4 py-1.5 text-xs font-medium uppercase text-gray-400">
                  Type de ressource
                </p>
                <Link
                  href="/creator/new"
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50"
                  onClick={() => setShowAddMenu(false)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-coral/10">
                    <Sparkles className="h-4 w-4 text-coral" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Ressource IA</p>
                    <p className="text-xs text-gray-500">Générer du contenu depuis un PDF</p>
                  </div>
                </Link>
                <button
                  className="flex w-full items-center gap-3 px-4 py-2.5 opacity-50 cursor-not-allowed"
                  disabled
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                    <FileText className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Fichier</p>
                    <p className="text-xs text-gray-500">Uploader un document classique</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result count */}
      <p className="mb-4 text-sm font-medium text-gray-500">
        {filteredResources.length} résultat{filteredResources.length !== 1 ? "s" : ""}
      </p>

      {/* Table */}
      {filteredResources.length === 0 ? (
        <div className="py-16 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">
            {search ? "Aucun résultat pour cette recherche" : "Aucune formation pour le moment"}
          </p>
          {!search && (
            <button
              onClick={() => setShowAddMenu(true)}
              className="mt-4 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Créer ma première ressource
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Formats</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Sessions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Type</th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map((resource) => {
                const status = STATUS_LABELS[resource.status] || STATUS_LABELS.draft;
                const formats = parseFormats(resource.enabledFormats);
                const sessionCount = resource.sessions?.length || 0;

                return (
                  <tr
                    key={resource.id}
                    className="border-b border-gray-50 transition-colors hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-gray-900">
                        {resource.title || "Sans titre"}
                      </p>
                      {resource.description && (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-gray-500">
                          {resource.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {formats.length > 0 ? (
                        <span className="text-sm">
                          {formats.map((f) => FORMAT_META[f]?.icon || "").join(" ")}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-600">
                        {sessionCount > 0 ? sessionCount : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-600">
                        {TYPE_LABELS[resource.status] || "Ressource IA"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenu(openMenu === resource.id ? null : resource.id)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {openMenu === resource.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenu(null)}
                            />
                            <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                              {(resource.status === "generated" || resource.status === "published") && (
                                <Link
                                  href={`/consume/${resource.id}`}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  onClick={() => setOpenMenu(null)}
                                >
                                  <Eye className="h-4 w-4" />
                                  Voir comme enrollee
                                </Link>
                              )}
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
