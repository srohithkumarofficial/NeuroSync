import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "@/services/apiConfig";
import { mriService } from "@/services/mriService";
import { StepIndicator } from "./MRIUpload";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

type AnalysisFiles = { t1: File; flair: File; t2: File };

export function MRIProcessing() {
  const { patientId = "" } = useParams();
  const { state } = useLocation() as { state: { files?: AnalysisFiles } | null };
  const navigate = useNavigate();
  const [status, setStatus] = useState<"running" | "complete" | "failed">("running");
  const [message, setMessage] = useState("Preparing MRI volumes for real AI lesion analysis...");

  useEffect(() => {
    const files = state?.files;
    if (!files) { setStatus("failed"); setMessage("MRI files were not available. Return to upload and select T1, FLAIR, and T2 again."); return; }
    let active = true;
    mriService.runRealAnalysis(patientId, files).then(() => {
      if (active) { setStatus("complete"); setMessage("Real lesion analysis complete."); }
    }).catch((error: unknown) => {
      if (active) { setStatus("failed"); setMessage(error instanceof ApiError ? error.message : "AI analysis service is currently unavailable."); }
    });
    return () => { active = false; };
  }, [patientId, state]);

  return <div className="max-w-2xl space-y-6">
    <div><h1 className="text-xl font-semibold text-ink">MRI Analysis</h1><p className="text-sm text-ink-faint mt-0.5">Patient {patientId}</p></div>
    <StepIndicator active={status === "complete" ? 4 : 3} />
    <div className="panel p-6">
      <div className="flex items-center gap-2 mb-3">{status === "running" ? <Loader2 size={18} className="animate-spin text-clinical" /> : status === "complete" ? <CheckCircle2 size={18} className="text-stable" /> : <AlertTriangle size={18} className="text-critical" />}<p className="text-sm font-medium text-ink">{status === "running" ? "Running real AI analysis" : status === "complete" ? "Analysis complete" : "Analysis failed"}</p></div>
      <p className="text-sm text-ink-muted">{message}</p>
      {status === "running" && <p className="text-xs text-ink-faint mt-4">The inference service may take several minutes. This screen will remain active until it returns a real result or error.</p>}
      {status === "complete" && <div className="mt-6 pt-5 border-t border-border flex justify-end"><button onClick={() => navigate(`/mri/results/${patientId}`)} className="bg-clinical text-white text-sm font-medium px-5 py-2.5 rounded-sm hover:bg-clinical-dark">Review real results</button></div>}
      {status === "failed" && <div className="mt-6 pt-5 border-t border-border flex justify-end"><button onClick={() => navigate(`/mri/upload?patientId=${encodeURIComponent(patientId)}`)} className="text-sm font-medium text-clinical border border-clinical/30 bg-clinical-light px-5 py-2.5 rounded-sm hover:bg-clinical/10">Return to upload</button></div>}
    </div>
  </div>;
}
