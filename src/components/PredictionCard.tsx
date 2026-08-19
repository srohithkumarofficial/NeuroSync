import { MRIScanResult } from "@/types";
import { PredictionBadge } from "./StatusBadge";
import { UncertaintyBanner } from "./UncertaintyBanner";

const predictionCopy: Record<string, string> = {
  higher_likelihood: "Higher likelihood of an MS-supporting imaging pattern",
  lower_likelihood: "Lower likelihood of an MS-supporting imaging pattern",
  uncertain: "Uncertain — imaging pattern does not clearly favor either interpretation",
  insufficient_data: "Insufficient evidence for a reliable prediction",
};

export function PredictionCard({ scan }: { scan: MRIScanResult }) {
  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-1">AI Assessment</p>
          <h2 className="text-lg font-semibold text-ink leading-snug max-w-md">{predictionCopy[scan.prediction]}</h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          <PredictionBadge label={scan.prediction} />
          {scan.confidence !== null && (
            <p className="mono-num text-2xl font-semibold text-ink">{Math.round(scan.confidence * 100)}%</p>
          )}
        </div>
      </div>
      <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-warn bg-warn-light px-2.5 py-1 rounded-sm border border-warn/30">
        Requires clinician review
      </div>
      <div className="mt-4">
        <UncertaintyBanner
          prediction={scan.prediction}
          missing={scan.prediction === "uncertain" || scan.prediction === "insufficient_data" ? ["Previous MRI not available for comparison", "Clinical history incomplete"] : undefined}
        />
      </div>
    </div>
  );
}
