import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Patient, MRIScanResult, LLMExplanation, EvidenceItem, MRIInferenceResult } from "@/types";
import { patientService } from "@/services/patientService";
import { mriService } from "@/services/mriService";
import { llmService } from "@/services/llmService";
import { evidenceService } from "@/services/evidenceService";
import { PatientHeader } from "@/components/PatientHeader";
import { PredictionCard } from "@/components/PredictionCard";
import { MRIViewer } from "@/components/MRIViewer";
import { LesionTable } from "@/components/LesionTable";
import { EvidenceGroup } from "@/components/EvidenceCard";
import { LLMExplanationCard } from "@/components/LLMExplanationCard";
import { LoadingState, ErrorState, EmptyState } from "@/components/States";
import { StepIndicator } from "./MRIUpload";
import { useState as useState2 } from "react";
import { USE_REAL_MRI_AI } from "@/services/mriService";

export function MRIResults() {
  return USE_REAL_MRI_AI ? <RealMRIResults /> : <MockMRIResults />;
}

function MockMRIResults() {
  const { patientId = "" } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [scan, setScan] = useState<MRIScanResult | null | "error">(null);
  const [explanation, setExplanation] = useState<LLMExplanation | null | "error">(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [note, setNote] = useState2("");
  const [approved, setApproved] = useState2(false);

  useEffect(() => {
    patientService.getPatient(patientId).then((p) => setPatient(p ?? null));
    evidenceService.getEvidence(patientId).then(setEvidence);
    mriService
      .analyzeMRI(patientId)
      .then((s) => {
        setScan(s);
        return llmService.generateExplanation(s.scan_id);
      })
      .then(setExplanation)
      .catch(() => {
        setScan((prev) => prev ?? "error");
        setExplanation("error");
      });
  }, [patientId]);

  if (!patient) return <LoadingState label="Loading patient…" />;
  if (scan === "error") return <ErrorState title="Analysis failed" description="The AI model could not process this scan. Try again or contact support." onRetry={() => window.location.reload()} />;
  if (scan === null) return <LoadingState label="Running lesion segmentation…" />;

  return (
    <div className="space-y-6">
      <StepIndicator active={5} />
      <PatientHeader patient={patient} />

      <div className="panel p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span className="text-ink-muted">Scan date: <span className="text-ink font-medium mono-num">{scan.scan_date}</span></span>
          {scan.comparison_scan_date && (
            <span className="text-ink-muted">Compared with: <span className="text-ink font-medium mono-num">{scan.comparison_scan_date}</span></span>
          )}
          <span className="text-ink-muted">Sequences: <span className="text-ink font-medium">{scan.sequences_used.join(", ")}</span></span>
        </div>
        <span className="text-xs text-ink-faint mono-num">Model: {scan.modelVersion}</span>
      </div>

      <PredictionCard scan={scan} />

      <div>
        <h2 className="text-base font-semibold text-ink mb-3">MRI viewer</h2>
        <MRIViewer hasComparison={!!scan.comparison_scan_date} />
      </div>

      <div>
        <h2 className="text-base font-semibold text-ink mb-3">MRI metrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCardInline label="Lesions" value={scan.lesion_count} />
          <MetricCardInline label="Total volume" value={`${scan.total_lesion_volume_ml.toFixed(1)} mL`} />
          <MetricCardInline label="New" value={scan.new_lesions} tone="warn" />
          <MetricCardInline label="Enlarging" value={scan.enlarging_lesions} tone="critical" />
          <MetricCardInline label="Stable" value={scan.stable_lesions} tone="stable" />
          <MetricCardInline label="Resolved" value={scan.resolved_lesions} />
          <MetricCardInline label="Mean volume" value={`${scan.mean_lesion_volume_ml.toFixed(2)} mL`} />
          <MetricCardInline label="Largest lesion" value={`${scan.largest_lesion_ml.toFixed(2)} mL`} />
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-ink mb-3">Detected lesions</h2>
        <LesionTable lesions={scan.lesions} />
      </div>

      <div>
        <h2 className="text-base font-semibold text-ink mb-3">Why the model said this</h2>
        {evidence.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <EvidenceGroup category="mri" items={evidence.filter((e) => e.category === "mri")} />
            <EvidenceGroup category="clinical" items={evidence.filter((e) => e.category === "clinical")} />
            <EvidenceGroup category="missing" items={evidence.filter((e) => e.category === "missing")} />
            <EvidenceGroup category="conflicting" items={evidence.filter((e) => e.category === "conflicting")} />
          </div>
        ) : (
          <EmptyState title="No evidence available" description="Evidence generation requires clinical history to be on file." />
        )}
      </div>

      <div>
        <h2 className="text-base font-semibold text-ink mb-3">LLM clinical summary</h2>
        {explanation === "error" ? (
          <ErrorState title="LLM unavailable" description="The explanation service could not be reached. MRI findings above are unaffected." />
        ) : explanation ? (
          <LLMExplanationCard explanation={explanation} />
        ) : (
          <LoadingState label="Generating evidence summary…" />
        )}
      </div>

      <div className="panel p-5">
        <h2 className="text-base font-semibold text-ink mb-3">Clinician review</h2>
        <label htmlFor="note" className="block text-sm font-medium text-ink-muted mb-1.5">Add note</label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Enter clinical observations or context for this review…"
          className="w-full border border-border rounded-sm px-3 py-2 text-sm mb-4"
        />
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setApproved(true)}
            disabled={approved}
            className="bg-clinical text-white text-sm font-medium px-5 py-2.5 rounded-sm hover:bg-clinical-dark disabled:opacity-50"
          >
            {approved ? "Report approved" : "Approve report"}
          </button>
          <button
            onClick={() => navigate("/reports")}
            className="text-sm font-medium text-clinical border border-clinical/30 bg-clinical-light px-5 py-2.5 rounded-sm hover:bg-clinical/10"
          >
            View full report
          </button>
        </div>
      </div>
    </div>
  );
}

function RealMRIResults() {
  const { patientId = "" } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [result, setResult] = useState<MRIInferenceResult | null>(null);

  useEffect(() => {
    patientService.getPatient(patientId).then((item) => setPatient(item ?? null));
    setResult(mriService.getRealResult(patientId) ?? null);
  }, [patientId]);

  if (!patient) return <LoadingState label="Loading patient..." />;
  if (!result) return <ErrorState title="Real analysis result unavailable" description="The result is retained only while this browser session remains open. Run the analysis again from the MRI upload page." onRetry={() => navigate(`/mri/upload?patientId=${encodeURIComponent(patientId)}`)} />;

  return <div className="space-y-6">
    <StepIndicator active={5} />
    <PatientHeader patient={patient} />
    <div className="panel p-4 flex flex-wrap items-center justify-between gap-3 text-sm"><span className="text-ink-muted">Source: <span className="text-ink font-medium">Real nnU-Net lesion inference</span></span><span className="text-xs text-ink-faint mono-num">T1 + FLAIR + T2</span></div>
    <div><h2 className="text-base font-semibold text-ink mb-3">MS lesion analysis</h2><div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><MetricCardInline label="Lesion count" value={result.lesion_count} /><MetricCardInline label="Total lesion volume" value={`${result.lesion_volume_ml.toFixed(2)} mL`} /><MetricCardInline label="Lesion voxels" value={result.lesion_voxels} /><MetricCardInline label="MRI dimensions" value={result.shape.join(" × ")} /></div></div>
    <div className="panel p-5"><h2 className="text-base font-semibold text-ink mb-2">Segmentation output</h2><p className="text-sm text-ink-muted">The inference service produced a real NIfTI segmentation mask. This browser viewer is not NIfTI-capable, so no synthetic overlay is shown.</p><p className="text-xs text-ink-faint mt-2">To visualize the real mask, the AI/application backend must provide a protected mask download or browser-renderable image slices and the frontend needs a NIfTI viewer such as Niivue.</p>{result.prediction_file && <p className="text-xs text-ink-faint mt-2 mono-num">Inference output: {result.prediction_file}</p>}</div>
  </div>;
}

function MetricCardInline({ label, value, tone }: { label: string; value: string | number; tone?: "warn" | "critical" | "stable" }) {
  const toneCls = tone === "warn" ? "text-warn" : tone === "critical" ? "text-critical" : tone === "stable" ? "text-stable" : "text-ink";
  return (
    <div className="panel p-4">
      <p className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-1">{label}</p>
      <p className={`mono-num text-xl font-semibold ${toneCls}`}>{value}</p>
    </div>
  );
}
