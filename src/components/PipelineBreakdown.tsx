const STAGES = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "replied", label: "Replied" },
  { key: "meeting_scheduled", label: "Meeting\nScheduled" },
  { key: "client", label: "Client" },
  { key: "lost", label: "Lost" },
] as const;

export function PipelineBreakdown({
  counts,
}: {
  counts: Record<string, number>;
}) {
  const max = Math.max(4, ...Object.values(counts));

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
      <div className="font-mono-label mb-6 text-[10px] text-text-secondary">
        PIPELINE BREAKDOWN
      </div>
      <div className="space-y-5">
        {STAGES.map((stage) => {
          const value = counts[stage.key] ?? 0;
          const widthPct = (value / max) * 100;
          return (
            <div key={stage.key} className="flex items-center gap-4">
              <div className="w-28 shrink-0 whitespace-pre-line text-right text-sm text-text-secondary">
                {stage.label}
              </div>
              <div className="h-6 flex-1">
                {value > 0 && (
                  <div
                    className="h-6 rounded-sm bg-accent-cyan transition-all"
                    style={{ width: `${Math.max(widthPct, 6)}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-end gap-6 pr-1 text-xs text-text-muted">
        {[0, 1, 2, 3, 4].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </div>
  );
}
