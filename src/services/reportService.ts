import { ClinicalReport } from "@/types";
import { apiFetch } from "./apiConfig";

// ----------------------------------------------------------------------------
// reportService
// Real endpoints (see BACKEND_INTEGRATION.md):
//   POST /api/reports/generate
//   POST /api/reports/:id/approve
// ----------------------------------------------------------------------------

export const reportService = {
  async getReport(patientId: string): Promise<ClinicalReport | undefined> {
    const response = await apiFetch<BackendReport | null>(`/api/reports/${encodeURIComponent(patientId)}`);
    return response ? toClinicalReport(response) : undefined;
  },

  async generateReport(patientId: string): Promise<ClinicalReport> {
    const response = await apiFetch<BackendReport>("/api/reports/generate", { method: "POST", body: JSON.stringify({ patient_id: patientId, clinician_id: "clin-001" }) });
    return toClinicalReport(response);
  },

  async editReport(reportId: string, content: string): Promise<ClinicalReport> {
    const response = await apiFetch<BackendReport>(`/api/reports/${encodeURIComponent(reportId)}/edit`, { method: "POST", body: JSON.stringify({ report: content, clinician_id: "clin-001" }) });
    return toClinicalReport(response);
  },

  async approveReport(reportId: string, clinicianName: string): Promise<ClinicalReport> {
    const response = await apiFetch<BackendReport>(`/api/reports/${encodeURIComponent(reportId)}/approve`, { method: "POST", body: JSON.stringify({ clinician_id: "clin-001", clinician_name: clinicianName }) });
    return toClinicalReport(response);
  },
};

type BackendReport = {
  id: string;
  patient_id: string;
  scan_id: string;
  status: ClinicalReport["status"];
  created_at: string;
  findings: string;
  impression: string;
  report: string;
  doctor_edit?: string;
  approved_at?: string;
  approved_by?: string;
  verification_claims?: Array<{ text: string; status: string; reason: string }>;
};

function toClinicalReport(report: BackendReport): ClinicalReport {
  return {
    id: report.id,
    patientId: report.patient_id,
    scanId: report.scan_id,
    status: report.status,
    createdAt: report.created_at,
    approvedAt: report.approved_at,
    approvedBy: report.approved_by,
    sections: {
      patientInfo: "Patient context retrieved by the NeuroSync backend.",
      scanInfo: "MRI analysis generated from the persisted T1, FLAIR, and T2 model result.",
      mriFindings: report.findings,
      lesionMeasurements: "Structured lesion measurements are retained as MRI model output and are not rewritten by the LLM.",
      longitudinalComparison: "No longitudinal comparison was supplied to this report generation request.",
      aiPrediction: report.impression,
      supportingEvidence: `${report.report}${report.verification_claims?.length ? `\n\nVerification firewall: ${report.verification_claims.map((claim) => `${claim.status}: ${claim.text}`).join("; ")}` : ""}`,
      uncertaintyLimitations: "AI-assisted draft. MRI segmentation alone does not establish a definitive diagnosis.",
      cognitiveSummary: "No cognitive assessment data was supplied.",
      clinicalConsiderations: "Clinician review and correlation with the complete clinical and imaging context are required.",
      clinicianNotes: report.doctor_edit ?? "",
    },
  };
}
