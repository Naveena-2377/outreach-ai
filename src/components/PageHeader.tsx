export function PageHeader({
  eyebrow,
  title,
  demoMode,
}: {
  eyebrow: string;
  title: string;
  demoMode?: boolean;
}) {
  return (
    <div className="mb-8 flex items-start justify-between">
      <div>
        <div className="font-mono-label text-[11px] text-text-secondary">
          {eyebrow}
        </div>
        <h1 className="font-display mt-2 text-4xl font-bold text-text-primary">
          {title}
        </h1>
      </div>
      {demoMode && (
        <span className="rounded-md border border-accent-amber/40 bg-accent-amber/10 px-3 py-1.5 text-xs font-medium tracking-wide text-accent-amber">
          EMAIL DEMO MODE
        </span>
      )}
    </div>
  );
}
