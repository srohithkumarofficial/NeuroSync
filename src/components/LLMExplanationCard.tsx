import { LLMExplanation } from "@/types";
import { DataSourceTagBadge } from "./StatusBadge";
import { Sparkles } from "lucide-react";

export function LLMExplanationCard({ explanation }: { explanation: LLMExplanation }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-clinical" />
          <h3 className="text-sm font-semibold text-ink">AI-generated clinical summary</h3>
        </div>
        <DataSourceTagBadge tag="ai_generated" />
      </div>
      <p className="text-sm text-ink-muted leading-relaxed">{explanation.summary}</p>
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-ink-faint">
        <span>Generated from structured model evidence</span>
        <span className="font-medium text-warn">Clinician verification required</span>
      </div>
    </div>
  );
}
