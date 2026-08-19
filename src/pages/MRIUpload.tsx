import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Patient, MRISequence, MRIUploadFile } from "@/types";
import { patientService } from "@/services/patientService";
import { validateSequences } from "@/services/mriService";
import { UploadCloud, FileWarning, CheckCircle2, ChevronRight } from "lucide-react";

const steps = ["Patient", "MRI Upload", "Preprocessing", "AI Analysis", "Review Results", "Generate Report"];
const REQUIRED: MRISequence[] = ["T1", "FLAIR", "T2"];

export function MRIUpload() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [params] = useSearchParams();
  const [selectedPatient, setSelectedPatient] = useState(params.get("patientId") ?? "");
  const [files, setFiles] = useState<MRIUploadFile[]>([]);
  const navigate = useNavigate();
  useEffect(() => { patientService.listPatients().then(setPatients); }, []);

  function selectFile(sequence: MRISequence, selected: File | undefined) {
    setFiles((previous) => {
      const withoutSequence = previous.filter((file) => file.sequence !== sequence);
      if (!selected) return withoutSequence;
      const valid = selected.name.toLowerCase().endsWith(".nii") || selected.name.toLowerCase().endsWith(".nii.gz");
      return [...withoutSequence, { id: `${sequence}-${selected.name}-${selected.lastModified}`, fileName: selected.name, sequence, sizeMB: Math.round((selected.size / 1024 / 1024) * 10) / 10, status: valid ? "valid" : "invalid", error: valid ? undefined : "Use a .nii or .nii.gz file.", file: selected }];
    });
  }

  const { valid, missing } = validateSequences(files.map((file) => file.sequence));
  function handleAnalyse() {
    const bySequence = Object.fromEntries(files.map((file) => [file.sequence, file.file]));
    if (!selectedPatient || !bySequence.T1 || !bySequence.FLAIR || !bySequence.T2) return;
    navigate(`/mri/processing/${selectedPatient}`, { state: { files: { t1: bySequence.T1, flair: bySequence.FLAIR, t2: bySequence.T2 } } });
  }

  return <div className="space-y-6 max-w-4xl">
    <div><h1 className="text-xl font-semibold text-ink">MRI Analysis</h1><p className="text-sm text-ink-faint mt-0.5">Upload a brain MRI to run real AI-assisted lesion segmentation</p></div>
    <StepIndicator active={1} />
    <div className="panel p-5 space-y-5">
      <div><label htmlFor="patient" className="block text-sm font-medium text-ink-muted mb-1.5">Patient</label><select id="patient" value={selectedPatient} onChange={(event) => setSelectedPatient(event.target.value)} className="w-full sm:w-96 border border-border rounded-sm px-3 py-2 text-sm"><option value="">Select a patient...</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} ({patient.id})</option>)}</select></div>
      <div><p className="block text-sm font-medium text-ink-muted mb-2">Brain MRI files</p><div className="border-2 border-dashed border-border rounded-md p-6 text-center"><UploadCloud size={28} className="mx-auto text-ink-faint mb-2" /><p className="text-sm text-ink-muted mb-1">Select the three NIfTI volumes required for real AI analysis</p><p className="text-xs text-ink-faint mb-4">Brain MRI only. Accepted files: .nii and .nii.gz.</p><div className="grid sm:grid-cols-3 gap-3 text-left">{REQUIRED.map((sequence) => <label key={sequence} className="border border-border rounded-sm p-3 cursor-pointer hover:bg-surface-muted"><span className="block text-xs font-medium text-ink mb-2">{sequence}</span><input type="file" accept=".nii,.nii.gz" onChange={(event) => selectFile(sequence, event.target.files?.[0])} className="block w-full text-xs text-ink-muted file:mr-2 file:border-0 file:bg-clinical-light file:px-2 file:py-1 file:text-clinical" /></label>)}</div></div></div>
      {files.length > 0 && <div><p className="text-sm font-medium text-ink-muted mb-2">File metadata</p><div className="panel divide-y divide-border">{files.map((file) => <div key={file.id} className="flex items-center justify-between px-4 py-2.5 text-sm"><div><p className="text-ink mono-num">{file.fileName}</p><p className="text-xs text-ink-faint">{file.sequence} sequence · {file.sizeMB} MB</p></div>{file.status === "valid" ? <span className="flex items-center gap-1.5 text-xs text-stable font-medium"><CheckCircle2 size={14} /> Valid</span> : <span className="text-xs text-critical">{file.error}</span>}</div>)}</div></div>}
      {files.length > 0 && !valid && <div className="flex items-start gap-2.5 bg-critical-light border border-critical/30 rounded-sm p-3.5"><FileWarning size={17} className="text-critical shrink-0 mt-0.5" /><div><p className="text-sm font-medium text-critical">Required MRI sequence unavailable</p><p className="text-xs text-ink-muted mt-0.5">Missing: {missing.join(", ")}. Analysis requires T1, FLAIR, and T2.</p></div></div>}
      <div className="flex justify-end pt-2 border-t border-border"><button onClick={handleAnalyse} disabled={!selectedPatient || files.length !== 3 || !valid || files.some((file) => file.status !== "valid")} className="inline-flex items-center gap-1.5 bg-clinical text-white text-sm font-medium px-5 py-2.5 rounded-sm hover:bg-clinical-dark disabled:opacity-40 disabled:cursor-not-allowed">Run real AI analysis <ChevronRight size={16} /></button></div>
    </div>
  </div>;
}

export function StepIndicator({ active }: { active: number }) {
  return <ol className="flex items-center flex-wrap gap-y-2" aria-label="MRI analysis workflow steps">{steps.map((step, index) => { const stepNum = index + 1; const state = stepNum < active ? "done" : stepNum === active ? "current" : "upcoming"; return <li key={step} className="flex items-center"><div className="flex items-center gap-2"><span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${state === "done" ? "bg-stable text-white" : state === "current" ? "bg-clinical text-white" : "bg-surface-sunken text-ink-faint"}`}>{state === "done" ? "✓" : stepNum}</span><span className={`text-xs font-medium ${state === "upcoming" ? "text-ink-faint" : "text-ink"}`}>{step}</span></div>{index < steps.length - 1 && <span className="w-6 sm:w-10 h-px bg-border mx-2" />}</li>; })}</ol>;
}
