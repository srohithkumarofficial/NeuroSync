import { useEffect, useState } from "react";
import { Patient, EvidenceItem, VerifiedClaim } from "@/types";
import { patientService } from "@/services/patientService";
import { mriService } from "@/services/mriService";
import { evidenceService } from "@/services/evidenceService";
import { EvidenceGroup, VerifiedClaimRow } from "@/components/EvidenceCard";
import { LoadingState, EmptyState } from "@/components/States";
import { ShieldCheck } from "lucide-react";

export function ClinicalEvidence() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selected, setSelected] = useState("");
  const [evidence, setEvidence] = useState<EvidenceItem[] | null>(null);
  const [claims, setClaims] = useState<VerifiedClaim[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(false);

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
    setClaims([]);
    evidenceService.getEvidence(selected).then(setEvidence);
    setLoadingClaims(true);
    mriService
      .analyzeMRI(selected)
      .then((scan) => evidenceService.verifyExplanation(scan.scan_id))
      .then(setClaims)
      .catch(() => setClaims([]))
      .finally(() => setLoadingClaims(false));
  }, [selected]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Clinical Evidence</h1>
          <p className="text-sm text-ink-faint mt-0.5">The reasoning behind each AI prediction, and verification of every LLM statement</p>
        </div>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="border border-border rounded-sm px-3 py-2 text-sm" aria-label="Select patient">
          {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
        </select>
      </div>

      <section>
        <h2 className="text-base font-semibold text-ink mb-3">Evidence behind the prediction</h2>
        {evidence === null ? (
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
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={18} className="text-clinical" />
          <h2 className="text-base font-semibold text-ink">Evidence verification</h2>
        </div>
        <p className="text-sm text-ink-faint mb-4 max-w-2xl">
          Every statement produced by the LLM is checked against structured model output and the clinical record before it reaches a clinician.
          Statements that cannot be traced to verified evidence are blocked.
        </p>
        {loadingClaims ? (
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
