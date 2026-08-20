import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MRIInferenceResult, Patient } from "@/types";
import { patientService } from "@/services/patientService";
import { getPersistedMRIResult } from "@/services/mriService";
import { PatientHeader } from "@/components/PatientHeader";
import { LoadingState, ErrorState } from "@/components/States";
import { StepIndicator } from "./MRIUpload";

export function MRIResults() {
  const { patientId = "" } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [result, setResult] = useState<MRIInferenceResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    patientService.getPatient(patientId).then((item) => setPatient(item ?? null)).catch((err) => {
      setPatient(null);
      setError(err instanceof Error ? err.message : "Could not load patient");
    });
    getPersistedMRIResult(patientId).then((item) => setResult(item ?? null)).catch((err) => setError(err instanceof Error ? err.message : "Could not load MRI result"));
  }, [patientId]);

  if (error) return <ErrorState title="MRI result unavailable" description={error} onRetry={() => window.location.reload()} />;
  if (!patient) return <LoadingState label="Loading patient..." />;
  if (!result) return <ErrorState title="MRI result unavailable" description="Run the real MRI analysis again to load the database-backed result." onRetry={() => navigate(`/mri/upload?patientId=${encodeURIComponent(patientId)}`)} />;

  return <div className="space-y-6">
    <StepIndicator active={5} />
    <PatientHeader patient={patient} />
    <div className="panel p-4 flex flex-wrap items-center justify-between gap-3 text-sm"><span className="text-ink-muted">Source: <span className="text-ink font-medium">Real nnU-Net lesion inference</span></span><span className="text-xs text-ink-faint mono-num">T1 + FLAIR + T2</span></div>
    <div><h2 className="text-base font-semibold text-ink mb-3">MS lesion analysis</h2><div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><MetricCard label="Lesion count" value={result.lesion_count} /><MetricCard label="Total lesion volume" value={`${result.lesion_volume_ml.toFixed(2)} mL`} /><MetricCard label="Lesion voxels" value={result.lesion_voxels} /><MetricCard label="MRI dimensions" value={result.shape.join(" × ")} /></div></div>
    <div className="panel p-5"><h2 className="text-base font-semibold text-ink mb-2">Segmentation output</h2><p className="text-sm text-ink-muted">The real inference service produced a NIfTI segmentation mask. A browser-renderable mask endpoint is not yet available.</p>{result.prediction_file && <p className="text-xs text-ink-faint mt-2 mono-num">Inference output: {result.prediction_file}</p>}</div>
    <div className="flex justify-end"><Link to={`/reports?patientId=${encodeURIComponent(patientId)}`} className="bg-clinical text-white text-sm font-medium px-5 py-2.5 rounded-sm hover:bg-clinical-dark">Generate clinical report</Link></div>
  </div>;
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return <div className="panel p-4"><p className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-1">{label}</p><p className="mono-num text-xl font-semibold text-ink">{value}</p></div>;
}
