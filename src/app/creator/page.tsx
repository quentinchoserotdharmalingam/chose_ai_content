"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
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

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "text-ht-text-secondary" },
  analyzed: { label: "Analysé", color: "text-ht-warning" },
  generated: { label: "Généré", color: "text-ht-primary" },
  published: { label: "Publié", color: "text-ht-success" },
};

const ITEMS_PER_PAGE = 10;

export default function CreatorDashboard() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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

  const totalPages = Math.max(1, Math.ceil(filteredResources.length / ITEMS_PER_PAGE));
  const paginatedResources = filteredResources.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-ht-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-medium tracking-[-0.02em] text-ht-text">
            Contenu IA
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ht-text-secondary" />
            <input
              type="text"
              placeholder="Rechercher"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-[200px] rounded-lg border border-ht-border bg-white pl-9 pr-3 text-[13px] text-ht-text placeholder:text-ht-text-secondary transition-all duration-200 focus:border-ht-border-secondary focus:outline-none focus:shadow-[var(--focus-ring)]"
            />
          </div>
          {/* Filter */}
          <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-ht-border text-ht-text-secondary transition-all duration-200 hover:bg-ht-fill-secondary hover:text-ht-text">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          {/* Add button — pill shape per spec */}
          <div className="relative" ref={addMenuRef}>
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="h-10 rounded-full bg-ht-primary px-6 text-[13px] font-semibold text-white shadow-ht-1 transition-all duration-200 hover:bg-ht-primary-dark"
            >
              Ajouter
            </button>
            {showAddMenu && (
              <div className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-ht-border bg-white py-2 shadow-ht-3">
                <p className="px-4 py-1.5 text-[12px] font-medium text-ht-text-secondary uppercase tracking-wide">
                  Type de ressource
                </p>
                <Link
                  href="/creator/new"
                  className="flex items-center gap-3 px-4 py-2.5 transition-all duration-200 hover:bg-ht-fill-secondary"
                  onClick={() => setShowAddMenu(false)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ht-primary-warm">
                    <Sparkles className="h-4 w-4 text-ht-primary" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-ht-text">Ressource IA</p>
                    <p className="text-[12px] text-ht-text-secondary">Générer du contenu depuis un PDF</p>
                  </div>
                </Link>
                <button
                  className="flex w-full items-center gap-3 px-4 py-2.5 opacity-40 cursor-not-allowed"
                  disabled
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ht-fill-secondary">
                    <FileText className="h-4 w-4 text-ht-text-secondary" />
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-medium text-ht-text">Fichier</p>
                    <p className="text-[12px] text-ht-text-secondary">Uploader un document classique</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result count */}
      <p className="mb-5 text-[13px] font-medium text-ht-text-secondary">
        {filteredResources.length} résultat{filteredResources.length !== 1 ? "s" : ""}
      </p>

      {/* Table */}
      {filteredResources.length === 0 ? (
        <div className="py-16 text-center">
          <Sparkles className="mx-auto mb-4 h-12 w-12 text-ht-text-inactive" />
          <p className="text-[13px] text-ht-text-secondary">
            {search ? "Aucun résultat pour cette recherche" : "Aucun contenu IA pour le moment"}
          </p>
          {!search && (
            <button
              onClick={() => setShowAddMenu(true)}
              className="mt-4 rounded-lg border border-ht-border-secondary px-4 py-2 text-[13px] font-medium text-ht-text transition-all duration-200 hover:bg-ht-fill-secondary"
            >
              Créer mon premier contenu IA
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-ht-border bg-white">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-ht-border">
                  <th className="border-r border-ht-border px-5 py-3 text-left">
                    <button className="flex items-center gap-1.5 text-[12px] font-medium text-ht-text-secondary hover:text-ht-text transition-colors">
                      Nom
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="border-r border-ht-border px-5 py-3 text-left text-[12px] font-medium text-ht-text-secondary">
                    Formats
                  </th>
                  <th className="border-r border-ht-border px-5 py-3 text-left text-[12px] font-medium text-ht-text-secondary">
                    Filtres
                  </th>
                  <th className="border-r border-ht-border px-5 py-3 text-left text-[12px] font-medium text-ht-text-secondary">
                    Type
                  </th>
                  <th className="border-r border-ht-border px-5 py-3 text-left text-[12px] font-medium text-ht-text-secondary">
                    Statut
                  </th>
                  <th className="w-14 px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedResources.map((resource, idx) => {
                  const status = STATUS_STYLES[resource.status] || STATUS_STYLES.draft;
                  const formats = parseFormats(resource.enabledFormats);
                  const isLast = idx === paginatedResources.length - 1;

                  return (
                    <tr
                      key={resource.id}
                      className={`transition-all duration-200 hover:bg-ht-fill-container ${
                        !isLast ? "border-b border-ht-border" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-[13px] font-medium text-ht-text">
                          {resource.title || "Sans titre"}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        {formats.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            {formats.map((f) => (
                              <span
                                key={f}
                                className="text-[16px] leading-none"
                                title={FORMAT_META[f]?.label}
                              >
                                {FORMAT_META[f]?.icon}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[12px] text-ht-text-inactive">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-block rounded-full bg-ht-fill-secondary px-3 py-0.5 text-[12px] text-ht-text">
                          Tous les filtres
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[13px] text-ht-text">Ressource IA</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[13px] font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() =>
                              setOpenMenu(openMenu === resource.id ? null : resource.id)
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-ht-text-secondary transition-all duration-200 hover:bg-ht-fill-secondary hover:text-ht-text"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {openMenu === resource.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenu(null)}
                              />
                              <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-ht-border bg-white py-1 shadow-ht-3">
                                {(resource.status === "generated" || resource.status === "published") && (
                                  <Link
                                    href={`/consume/${resource.id}`}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-ht-text transition-colors hover:bg-ht-fill-secondary"
                                    onClick={() => setOpenMenu(null)}
                                  >
                                    <Eye className="h-4 w-4 text-ht-text-secondary" />
                                    Voir comme enrollee
                                  </Link>
                                )}
                                {(resource.status === "generated" || resource.status === "published") && (
                                  <button
                                    className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-ht-text transition-colors hover:bg-ht-fill-secondary"
                                    onClick={() => handleDuplicate(resource)}
                                  >
                                    <Copy className="h-4 w-4 text-ht-text-secondary" />
                                    Dupliquer
                                  </button>
                                )}
                                <button
                                  className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-ht-error transition-colors hover:bg-ht-error-warm"
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

          {/* Pagination — matches HeyTeam: < 1 2 3 > */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-ht-border text-ht-text transition-all duration-200 hover:bg-ht-fill-secondary disabled:opacity-30 disabled:border-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-medium transition-all duration-200 ${
                    currentPage === page
                      ? "border border-ht-text bg-white text-ht-text"
                      : "text-ht-text hover:bg-ht-fill-secondary"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-ht-border text-ht-text transition-all duration-200 hover:bg-ht-fill-secondary disabled:opacity-30 disabled:border-transparent"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
