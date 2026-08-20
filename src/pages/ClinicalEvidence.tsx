import { useEffect, useState } from "react";
import { Patient, EvidenceItem, VerifiedClaim } from "@/types";
import { patientService } from "@/services/patientService";
import { evidenceService } from "@/services/evidenceService";
import { EvidenceGroup, VerifiedClaimRow } from "@/components/EvidenceCard";
import { LoadingState, EmptyState, ErrorState } from "@/components/States";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";

export function ClinicalEvidence() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selected, setSelected] = useState("");
  const [evidence, setEvidence] = useState<EvidenceItem[] | null>(null);
  const [claims, setClaims] = useState<VerifiedClaim[]>([]);
  const [evidenceError, setEvidenceError] = useState("");
  const [claimsError, setClaimsError] = useState("");
  const [loadingClaims, setLoadingClaims] = useState(false);
  const verifiedCount = claims.filter((claim) => claim.status === "verified").length;
  const conflictCount = claims.filter((claim) => claim.status === "blocked").length;
  const reviewCount = claims.filter((claim) => claim.status === "unsupported" || claim.status === "requires_review").length;

  useEffect(() => {
    patientService.listPatients().then((list) => {
      setPatients(list);
      const withEvidence = list.find((p) => p.predictionStatus === "higher_likelihood") ?? list[0];
      if (withEvidence) setSelected(withEvidence.id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setEvidence(null);
    setEvidenceError("");
    setClaims([]);
    setClaimsError("");
    evidenceService.getEvidence(selected).then(setEvidence).catch((error) => {
      setEvidence([]);
      setEvidenceError(error instanceof Error ? error.message : "Could not load evidence");
    });
    setLoadingClaims(true);
    evidenceService
      .verifyExplanation(selected)
      .then(setClaims)
      .catch((error) => setClaimsError(error instanceof Error ? error.message : "Could not verify LLM statements"))
      .finally(() => setLoadingClaims(false));
  }, [selected]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Evidence Verification</h1>
          <p className="text-sm text-ink-faint mt-0.5">MRI model facts and report-claim checks for lesion count, volume, voxels, and conflicts.</p>
        </div>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="border border-border rounded-sm px-3 py-2 text-sm" aria-label="Select patient">
          {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
        </select>
      </div>

      <section>
        <h2 className="text-base font-semibold text-ink mb-3">Structured MRI evidence</h2>
        {evidenceError ? (
          <ErrorState title="Evidence unavailable" description={evidenceError} />
        ) : evidence === null ? (
          <LoadingState label="Assembling evidence…" />
        ) : evidence.length === 0 ? (
          <EmptyState title="No evidence available" description="Insufficient clinical information to generate an evidence summary." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <EvidenceGroup category="mri" items={evidence.filter((e) => e.category === "mri")} />
            <EvidenceGroup category="clinical" items={evidence.filter((e) => e.category === "clinical")} />
            <EvidenceGroup category="missing" items={evidence.filter((e) => e.category === "missing")} />
            <EvidenceGroup category="conflicting" items={evidence.filter((e) => e.category === "conflicting")} />
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-clinical" />
            <h2 className="text-base font-semibold text-ink">LLM report claim verification</h2>
          </div>
          {claims.length > 0 && (
            <div className="flex items-center gap-3 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-1"><CheckCircle2 size={14} className="text-stable" />{verifiedCount} verified</span>
              <span className="inline-flex items-center gap-1"><AlertTriangle size={14} className="text-critical" />{conflictCount} conflict</span>
              <span>{reviewCount} review</span>
            </div>
          )}
        </div>
        <p className="text-sm text-ink-faint mb-4 max-w-2xl">
          The verifier checks MRI-specific statements against structured output. Patient identifiers and generic header text are ignored.
        </p>
        {claimsError ? (
          <ErrorState title="Verification unavailable" description={claimsError} />
        ) : loadingClaims ? (
          <LoadingState label="Verifying AI explanation…" />
        ) : claims.length === 0 ? (
          <EmptyState title="No LLM statements to verify" description="Run MRI analysis to generate an AI explanation for verification." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {claims.map((c) => (
              <VerifiedClaimRow key={c.id} statement={c.statement} evidenceSource={c.evidenceSource} status={c.status} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
