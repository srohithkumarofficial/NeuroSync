import { AlertTriangle, CheckCircle2, HelpCircle, ShieldAlert, ShieldCheck, ShieldX, Clock, XCircle } from "lucide-react";
import { PredictionLabel, VerificationStatus } from "@/types";

type Tone = "stable" | "warn" | "critical" | "neutral" | "clinical";

const toneClasses: Record<Tone, string> = {
  stable: "bg-stable-light text-stable border-stable/30",
  warn: "bg-warn-light text-warn border-warn/30",
  critical: "bg-critical-light text-critical border-critical/30",
  neutral: "bg-surface-sunken text-ink-muted border-border-strong",
  clinical: "bg-clinical-light text-clinical-dark border-clinical/30",
};

export function Pill({ tone, icon, children }: { tone: Tone; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className={`badge ${toneClasses[tone]}`}>
      {icon}
      {children}
    </span>
  );
}

export function PredictionBadge({ label, size = "md" }: { label: PredictionLabel | "not_available"; size?: "sm" | "md" }) {
  const map: Record<string, { tone: Tone; text: string; icon: React.ReactNode }> = {
    ris: { tone: "clinical", text: "RIS", icon: <HelpCircle size={size === "sm" ? 12 : 14} /> },
    cis: { tone: "warn", text: "CIS", icon: <AlertTriangle size={size === "sm" ? 12 : 14} /> },
    ms: { tone: "critical", text: "MS", icon: <ShieldAlert size={size === "sm" ? 12 : 14} /> },
    higher_likelihood: { tone: "warn", text: "Higher likelihood", icon: <AlertTriangle size={size === "sm" ? 12 : 14} /> },
    lower_likelihood: { tone: "stable", text: "Lower likelihood", icon: <CheckCircle2 size={size === "sm" ? 12 : 14} /> },
    uncertain: { tone: "neutral", text: "Uncertain", icon: <HelpCircle size={size === "sm" ? 12 : 14} /> },
    insufficient_data: { tone: "neutral", text: "Insufficient data", icon: <HelpCircle size={size === "sm" ? 12 : 14} /> },
    not_available: { tone: "neutral", text: "Not available", icon: <Clock size={size === "sm" ? 12 : 14} /> },
  };
  const m = map[label] ?? map.not_available;
  return <Pill tone={m.tone} icon={m.icon}>{m.text}</Pill>;
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const map: Record<VerificationStatus, { tone: Tone; text: string; icon: React.ReactNode }> = {
    verified: { tone: "stable", text: "Verified", icon: <ShieldCheck size={13} /> },
    unsupported: { tone: "warn", text: "Unsupported", icon: <ShieldAlert size={13} /> },
    blocked: { tone: "critical", text: "Blocked", icon: <ShieldX size={13} /> },
    requires_review: { tone: "neutral", text: "Requires review", icon: <HelpCircle size={13} /> },
  };
  const m = map[status];
  return <Pill tone={m.tone} icon={m.icon}>{m.text}</Pill>;
}

export function MRIStatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: Tone; text: string }> = {
    not_started: { tone: "neutral", text: "Not started" },
    pending_review: { tone: "warn", text: "Pending review" },
    analyzed: { tone: "stable", text: "Analyzed" },
    requires_review: { tone: "critical", text: "Requires review" },
  };
  const m = map[status] ?? map.not_started;
  return <Pill tone={m.tone}>{m.text}</Pill>;
}

export function ReportStatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: Tone; text: string }> = {
    none: { tone: "neutral", text: "No report" },
    draft: { tone: "stable", text: "Available" },
    ai_draft: { tone: "stable", text: "Available" },
    clinician_review: { tone: "warn", text: "In review" },
    clinician_edited: { tone: "warn", text: "Edited" },
    awaiting_approval: { tone: "warn", text: "Awaiting approval" },
    approved: { tone: "stable", text: "Available" },
  };
  const m = map[status] ?? map.none;
  return <Pill tone={m.tone}>{m.text}</Pill>;
}

export function DataSourceTagBadge({ tag }: { tag: "ai_generated" | "model_output" | "clinician_note" | "patient_result" | "verified" }) {
  const map: Record<string, { tone: Tone; text: string }> = {
    ai_generated: { tone: "clinical", text: "AI GENERATED" },
    model_output: { tone: "clinical", text: "MODEL OUTPUT" },
    clinician_note: { tone: "neutral", text: "CLINICIAN NOTE" },
    patient_result: { tone: "neutral", text: "PATIENT RESULT" },
    verified: { tone: "stable", text: "VERIFIED" },
  };
  const m = map[tag];
  return <span className={`badge text-[10px] tracking-wide uppercase ${toneClasses[m.tone]}`}>{m.text}</span>;
}

export function LesionStatusBadge({ status }: { status: "new" | "enlarging" | "stable" | "resolved" }) {
  const map: Record<string, { tone: Tone; text: string }> = {
    new: { tone: "warn", text: "New" },
    enlarging: { tone: "critical", text: "Enlarging" },
    stable: { tone: "stable", text: "Stable" },
    resolved: { tone: "neutral", text: "Resolved" },
  };
  const m = map[status];
  return <Pill tone={m.tone}>{m.text}</Pill>;
}

export { XCircle };
