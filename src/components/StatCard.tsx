import { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono-label text-[10px] text-text-secondary">
          {label}
        </span>
        <Icon size={16} className="text-text-muted" strokeWidth={1.75} />
      </div>
      <div className="font-display mt-4 text-4xl font-bold text-text-primary">
        {value}
        {suffix && <span className="text-2xl text-text-secondary">{suffix}</span>}
      </div>
    </div>
  );
}
