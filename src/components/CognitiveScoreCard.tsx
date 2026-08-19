import { CognitiveDomain } from "@/types";

const domainLabels: Record<CognitiveDomain, string> = {
  attention: "Attention",
  processing_speed: "Processing speed",
  memory: "Memory",
  cognitive_flexibility: "Cognitive flexibility",
};

export function CognitiveScoreCard({ scores }: { scores: Record<CognitiveDomain, number> }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {(Object.keys(scores) as CognitiveDomain[]).map((d) => (
        <div key={d} className="panel p-4 text-center">
          <p className="text-xs text-ink-faint uppercase tracking-wide mb-1">{domainLabels[d]}</p>
          <p className="mono-num text-2xl font-semibold text-ink">{scores[d]}</p>
        </div>
      ))}
    </div>
  );
}
