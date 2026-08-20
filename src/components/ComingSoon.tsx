export function ComingSoon({ phase, description }: { phase: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong bg-bg-card/50 px-8 py-20 text-center">
      <span className="font-mono-label rounded-full border border-accent-cyan/30 bg-accent-cyan-dim px-3 py-1 text-[10px] text-accent-cyan">
        {phase}
      </span>
      <p className="mx-auto mt-4 max-w-md text-sm text-text-secondary">{description}</p>
    </div>
  );
}
