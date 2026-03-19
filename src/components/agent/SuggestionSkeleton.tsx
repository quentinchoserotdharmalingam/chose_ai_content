"use client";

function Bone({ className }: { className?: string }) {
  return <div className={`rounded-md bg-ht-fill-secondary animate-pulse ${className ?? ""}`} />;
}

export function SuggestionCardSkeleton() {
  return (
    <div className="rounded-xl border border-ht-border bg-white overflow-hidden border-l-[3px] border-l-ht-fill-secondary">
      <div className="p-4 md:p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Bone className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Bone className="h-4 w-14 rounded-full" />
              <Bone className="h-3 w-20" />
            </div>
            <Bone className="h-4 w-3/4" />
          </div>
        </div>

        {/* Employee */}
        <div className="flex items-center gap-2 mb-3 ml-0 md:ml-[52px]">
          <Bone className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Bone className="h-3 w-28" />
            <Bone className="h-2.5 w-36" />
          </div>
        </div>

        {/* Summary */}
        <div className="ml-0 md:ml-[52px] mb-4 space-y-2">
          <Bone className="h-3 w-full" />
          <Bone className="h-3 w-5/6" />
        </div>

        {/* Separator */}
        <div className="border-t border-ht-border mb-3 ml-0 md:ml-[52px]" />

        {/* Action plan */}
        <div className="ml-0 md:ml-[52px] mb-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Bone className="h-5 w-5 rounded-full" />
              <Bone className="h-3 w-40" />
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-0 md:ml-[52px]">
          <Bone className="h-10 w-28 rounded-lg" />
          <Bone className="h-10 w-28 rounded-lg" />
          <Bone className="h-10 w-20 rounded-lg ml-auto" />
        </div>
      </div>
    </div>
  );
}

export function StatsSidebarSkeleton() {
  return (
    <div className="space-y-4">
      {/* Impact card */}
      <div className="rounded-xl border border-ht-border bg-white p-5">
        <Bone className="h-4 w-24 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Bone className="h-9 w-9 rounded-lg" />
              <div className="space-y-1.5">
                <Bone className="h-5 w-16" />
                <Bone className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending card */}
      <div className="rounded-xl border border-ht-border bg-white p-5">
        <Bone className="h-4 w-20 mb-3" />
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bone className="h-2 w-2 rounded-full" />
                <Bone className="h-3 w-20" />
              </div>
              <Bone className="h-4 w-6" />
            </div>
          ))}
        </div>
      </div>

      {/* Week card */}
      <div className="rounded-xl border border-ht-border bg-white p-5">
        <Bone className="h-4 w-28 mb-3" />
        <div className="space-y-2">
          <Bone className="h-8 w-full rounded-lg" />
          <Bone className="h-8 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
