import { AlertCircle, HelpCircle } from "lucide-react";
import { PredictionLabel } from "@/types";

export function UncertaintyBanner({ prediction, missing }: { prediction: PredictionLabel; missing?: string[] }) {
  if (prediction !== "uncertain" && prediction !== "insufficient_data") return null;
  return (
    <div className="panel border-l-4 border-l-warn bg-warn-light/40 p-4 flex gap-3">
      <HelpCircle size={20} className="text-warn shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-ink">Insufficient evidence for a reliable prediction</p>
        <p className="text-sm text-ink-muted mt-1">
          The available MRI and clinical data do not currently support a confident likelihood estimate. A numeric confidence score is intentionally withheld.
        </p>
        {missing && missing.length > 0 && (
          <ul className="mt-2 space-y-1">
            {missing.map((m, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-ink-muted">
                <AlertCircle size={12} className="mt-0.5 text-warn shrink-0" /> {m}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
