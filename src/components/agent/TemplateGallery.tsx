"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Sparkles, Search } from "lucide-react";
import { AGENT_TEMPLATES, AGENT_CATEGORY_META, type AgentCategory, type AgentTemplate } from "@/types";
import { AgentCreationChat } from "./AgentCreationChat";
import { useToast } from "./Toast";

interface TemplateGalleryProps {
  onBack: () => void;
  onAgentCreated: (agentId?: string) => void;
}

export function TemplateGallery({ onBack, onAgentCreated }: TemplateGalleryProps) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<AgentCategory | "all">("all");
  const [showChat, setShowChat] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const { toast } = useToast();

  const addTemplate = async (template: AgentTemplate) => {
    setAdding(template.templateId);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          icon: template.icon,
          color: template.color,
          category: template.category,
          triggerType: template.triggerType,
          triggerLabel: template.triggerLabel,
          triggerConfig: template.triggerConfig,
          infoDescription: template.infoDescription,
          actions: template.actions,
          isTemplate: true,
          status: "active",
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      toast(`Agent "${template.name}" ajouté`, "success");
      onAgentCreated(created.id);
    } catch {
      toast("Erreur lors de l'ajout", "error");
    } finally {
      setAdding(null);
    }
  };

  if (showChat) {
    return (
      <AgentCreationChat
        onBack={() => setShowChat(false)}
        onCreated={(agentId) => {
          setShowChat(false);
          toast("Agent créé avec succès", "success");
          onAgentCreated(agentId);
        }}
      />
    );
  }

  const filtered = AGENT_TEMPLATES.filter((t) => {
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categories = Object.entries(AGENT_CATEGORY_META) as [AgentCategory, { label: string; description: string }][];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-ht-text-secondary hover:text-ht-text hover:bg-ht-fill-secondary transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Retour</span>
          </button>
          <div>
            <h2 className="text-[16px] font-semibold text-ht-text">Ajouter un agent</h2>
            <p className="text-[12px] text-ht-text-secondary">Choisissez un template ou créez un agent sur mesure</p>
          </div>
        </div>
      </div>

      {/* Custom creation card */}
      <button
        onClick={() => setShowChat(true)}
        className="w-full mb-6 rounded-xl border-2 border-dashed border-ht-primary/30 bg-ht-primary-warm/30 p-5 flex items-center gap-4 hover:border-ht-primary/50 hover:bg-ht-primary-warm/50 transition-all group text-left"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6058] to-[#FF8A65] text-white shadow-sm group-hover:shadow-md transition-all">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-ht-text mb-0.5">Créer un agent personnalisé</p>
          <p className="text-[12px] text-ht-text-secondary">
            Décrivez votre besoin et l&apos;IA configurera un agent sur mesure
          </p>
        </div>
      </button>

      {/* Search + filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ht-text-secondary" />
          <input
            type="text"
            placeholder="Rechercher un template..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-ht-border bg-white py-2.5 pl-10 pr-4 text-[13px] text-ht-text placeholder:text-ht-text-secondary focus:border-ht-primary focus:outline-none"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-ht-border p-0.5 shrink-0 overflow-x-auto">
          <button
            onClick={() => setFilterCategory("all")}
            className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-all whitespace-nowrap ${filterCategory === "all" ? "bg-ht-primary text-white" : "text-ht-text-secondary hover:text-ht-text"}`}
          >
            Tous ({AGENT_TEMPLATES.length})
          </button>
          {categories.map(([key, meta]) => {
            const count = AGENT_TEMPLATES.filter(t => t.category === key).length;
            if (count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setFilterCategory(key)}
                className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-all whitespace-nowrap ${filterCategory === key ? "bg-ht-primary text-white" : "text-ht-text-secondary hover:text-ht-text"}`}
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Template grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((template) => (
          <div
            key={template.templateId}
            className="rounded-xl border border-ht-border bg-white p-4 hover:border-ht-text-secondary hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-3 mb-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                style={{ backgroundColor: template.color + "15" }}
              >
                {template.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-semibold text-ht-text">{template.name}</h3>
                <span className="text-[11px] text-ht-text-secondary">
                  {AGENT_CATEGORY_META[template.category]?.label}
                </span>
              </div>
            </div>

            <p className="text-[12px] text-ht-text-secondary leading-relaxed mb-3 line-clamp-2">
              {template.description}
            </p>

            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  template.triggerType === "event"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-purple-50 text-purple-600"
                }`}
              >
                {template.triggerType === "event" ? "Événement" : "Planifié"}
              </span>
              <button
                onClick={() => addTemplate(template)}
                disabled={adding === template.templateId}
                className="flex items-center gap-1.5 rounded-lg bg-ht-primary/10 px-3 py-1.5 text-[12px] font-medium text-ht-primary hover:bg-ht-primary hover:text-white disabled:opacity-50 transition-all active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                {adding === template.templateId ? "Ajout..." : "Ajouter"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-[14px] font-medium text-ht-text">Aucun template trouvé</p>
          <p className="text-[13px] text-ht-text-secondary mt-1">Essayez un autre filtre ou créez un agent personnalisé</p>
        </div>
      )}
    </div>
  );
}
