"use client";

import { useState } from "react";
import { Bot, BookOpen, LayoutDashboard, History } from "lucide-react";
import { AgentLibrary } from "@/components/agent/AgentLibrary";
import { SuggestionsCockpit } from "@/components/agent/SuggestionsCockpit";
import { SuggestionsHistory } from "@/components/agent/SuggestionsHistory";

type TabType = "cockpit" | "library" | "history";

const TABS: { id: TabType; label: string; icon: typeof Bot }[] = [
  { id: "cockpit", label: "Cockpit", icon: LayoutDashboard },
  { id: "library", label: "Bibliothèque", icon: BookOpen },
  { id: "history", label: "Historique", icon: History },
];

export default function AgentPage() {
  const [activeTab, setActiveTab] = useState<TabType>("cockpit");

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-ht-border bg-white px-4 py-4 md:px-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6058] to-[#FF8A65] text-white shadow-sm">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-[18px] font-semibold text-ht-text">Agent IA</h1>
            <p className="text-[13px] text-ht-text-secondary">
              Vos agents surveillent l&apos;activité RH et vous suggèrent des actions
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-ht-fill-secondary p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-[13px] font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-white text-ht-text shadow-sm"
                  : "text-ht-text-secondary hover:text-ht-text"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-8">
        {activeTab === "cockpit" && <SuggestionsCockpit />}
        {activeTab === "library" && <AgentLibrary />}
        {activeTab === "history" && <SuggestionsHistory />}
      </div>
    </div>
  );
}
