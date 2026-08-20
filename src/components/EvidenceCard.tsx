import { Check, AlertTriangle, HelpCircle, XCircle } from "lucide-react";
import { EvidenceCategory, EvidenceItem } from "@/types";

const categoryMeta: Record<EvidenceCategory, { title: string; icon: React.ReactNode; iconColor: string; border: string }> = {
  mri: { title: "MRI Evidence", icon: <Check size={15} />, iconColor: "text-stable", border: "border-l-stable" },
  clinical: { title: "Clinical Evidence", icon: <Check size={15} />, iconColor: "text-clinical", border: "border-l-clinical" },
  missing: { title: "Missing Evidence", icon: <HelpCircle size={15} />, iconColor: "text-warn", border: "border-l-warn" },
  conflicting: { title: "Conflicting Evidence", icon: <AlertTriangle size={15} />, iconColor: "text-critical", border: "border-l-critical" },
};

export function EvidenceGroup({ category, items }: { category: EvidenceCategory; items: EvidenceItem[] }) {
  if (items.length === 0) return null;
  const meta = categoryMeta[category];
  return (
    <div className={`panel border-l-4 ${meta.border} p-4`}>
      <h4 className="text-sm font-semibold text-ink mb-3">{meta.title}</h4>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-sm text-ink-muted leading-snug">
            <span className={`mt-0.5 shrink-0 ${meta.iconColor}`}>{meta.icon}</span>
            <span>{item.statement}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function VerifiedClaimRow({ statement, evidenceSource, status }: { statement: string; evidenceSource: string; status: string }) {
  const isConflict = status === "blocked";
  const needsReview = status === "unsupported" || status === "requires_review";
  const tone = isConflict ? "border-critical bg-critical-light/30" : needsReview ? "border-warn bg-warn/10" : "border-stable bg-white";
  const label = isConflict ? "Conflict" : needsReview ? "Needs review" : "Verified";
  return (
    <div className={`panel p-4 border ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-1">Report claim</p>
          <p className="text-sm text-ink">{statement}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-ink-muted">{label}</span>
          {isConflict ? <XCircle size={18} className="text-critical" /> : needsReview ? <AlertTriangle size={18} className="text-warn" /> : <Check size={18} className="text-stable" />}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-1">Check result</p>
        <p className="text-sm text-ink-muted mono-num">{evidenceSource}</p>
      </div>
    </div>
  );
}
