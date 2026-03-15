"use client";

import { EXTENSION_META, type GeneratedAction } from "@/types";

interface ActionsPreviewProps {
  actions: GeneratedAction[];
}

export function ActionsPreview({ actions }: ActionsPreviewProps) {
  // Sort by delay
  const sorted = [...actions].sort((a, b) => (a.delayDays ?? 0) - (b.delayDays ?? 0));

  // Group by timing
  const immediate = sorted.filter((a) => a.delayDays === 0 || a.delayDays === null);
  const delayed = sorted.filter((a) => a.delayDays !== null && a.delayDays > 0);

  // Group delayed by day
  const delayGroups: Record<number, GeneratedAction[]> = {};
  for (const action of delayed) {
    const day = action.delayDays!;
    if (!delayGroups[day]) delayGroups[day] = [];
    delayGroups[day].push(action);
  }

  const sortedDays = Object.keys(delayGroups)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h4 className="mb-4 text-sm font-semibold text-gray-700">
        Actions créées dans HeyTeam après complétion de l&apos;enrollee
      </h4>

      <div className="relative ml-4 border-l-2 border-gray-200 pl-6">
        {/* Completion event */}
        <TimelineNode
          color="blue"
          title="Complétion de la ressource"
          subtitle="L'enrollee clique « J'ai terminé »"
          isFirst
        />

        {/* Immediate actions */}
        {immediate.length > 0 && (
          <TimelineGroup label="Immédiatement" actions={immediate} />
        )}

        {/* Delayed action groups */}
        {sortedDays.map((day) => (
          <TimelineGroup
            key={day}
            label={`J+${day}`}
            actions={delayGroups[day]}
          />
        ))}

        {/* End */}
        <TimelineNode
          color="gray"
          title="Fin du parcours d'actions"
          subtitle={`${actions.length} objet(s) créé(s) au total dans HeyTeam`}
        />
      </div>
    </div>
  );
}

function TimelineNode({
  color,
  title,
  subtitle,
  isFirst,
}: {
  color: "blue" | "gray" | "green" | "amber";
  title: string;
  subtitle?: string;
  isFirst?: boolean;
}) {
  const dotColors = {
    blue: "bg-blue-500",
    gray: "bg-gray-400",
    green: "bg-green-500",
    amber: "bg-amber-500",
  };

  return (
    <div className={`relative pb-4 ${isFirst ? "" : ""}`}>
      <div
        className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full ${dotColors[color]} ring-2 ring-white`}
      />
      <p className="text-sm font-medium text-gray-800">{title}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
}

function TimelineGroup({
  label,
  actions,
}: {
  label: string;
  actions: GeneratedAction[];
}) {
  return (
    <div className="relative pb-4">
      <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
      <p className="mb-2 text-xs font-semibold uppercase text-green-700">
        {label}
      </p>
      <div className="space-y-2">
        {actions.map((action, i) => {
          const meta = EXTENSION_META[action.extensionSlug];
          return (
            <div
              key={`${action.extensionSlug}-${i}`}
              className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <span className="text-base">{meta.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{action.label}</span>
                  <span className="rounded bg-white px-1.5 py-0.5 text-xs text-gray-500 shadow-sm">
                    {action.heyteamObject}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{action.triggerLabel}</p>
              </div>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                POC — non créé
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
