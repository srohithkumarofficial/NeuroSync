import { MRIVisit } from "@/types";

export function VisitTimeline({ visits }: { visits: MRIVisit[] }) {
  return (
    <div className="panel divide-y divide-border">
      {visits.map((v) => (
        <div key={v.visitNumber} className="p-4 grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-2 sm:gap-4">
          <div>
            <p className="text-sm font-semibold text-ink">Visit {v.visitNumber}</p>
            <p className="text-xs text-ink-faint mono-num">{v.scanDate}</p>
          </div>
          <div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm mb-1.5">
              <span className="text-ink-muted">Lesions: <span className="mono-num text-ink font-medium">{v.lesionCount}</span></span>
              <span className="text-ink-muted">Volume: <span className="mono-num text-ink font-medium">{v.lesionVolumeML.toFixed(1)} mL</span></span>
              <span className="text-ink-muted">New: <span className="mono-num text-ink font-medium">{v.newLesions}</span></span>
              <span className="text-ink-muted">Enlarging: <span className="mono-num text-ink font-medium">{v.enlargingLesions}</span></span>
              {v.cognitiveScore !== null && (
                <span className="text-ink-muted">Cognitive: <span className="mono-num text-ink font-medium">{v.cognitiveScore}</span></span>
              )}
            </div>
            <p className="text-sm text-ink-muted">{v.clinicianNote}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
