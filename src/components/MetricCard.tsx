interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: { value: string; direction: "up" | "down" | "flat"; positive?: boolean };
  emphasis?: boolean;
}

export function MetricCard({ label, value, unit, delta, emphasis }: MetricCardProps) {
  return (
    <div className={`panel p-4 flex flex-col gap-1 ${emphasis ? "border-clinical/30" : ""}`}>
      <span className="text-xs font-medium text-ink-muted uppercase tracking-wide">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="mono-num text-2xl font-semibold text-ink">{value}</span>
        {unit && <span className="text-sm text-ink-faint">{unit}</span>}
      </div>
      {delta && (
        <span
          className={`text-xs mono-num ${
            delta.direction === "flat" ? "text-ink-faint" : delta.positive ? "text-stable" : "text-critical"
          }`}
        >
          {delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : "—"} {delta.value}
        </span>
      )}
    </div>
  );
}
