import { ClinicalReport } from "@/types";
import { mockReports } from "@/mock/clinical";
import { mockDelay } from "./apiConfig";

// ----------------------------------------------------------------------------
// reportService
// Real endpoints (see BACKEND_INTEGRATION.md):
//   POST /api/reports/generate
//   POST /api/reports/:id/approve
// ----------------------------------------------------------------------------

export const reportService = {
  async getReport(patientId: string): Promise<ClinicalReport | undefined> {
    // TODO(backend): replace with `fetch(`${API_BASE_URL}/api/reports/${patientId}`)`
    return mockDelay(mockReports[patientId], 500);
  },

  async generateReport(patientId: string): Promise<ClinicalReport> {
    // TODO(backend): replace with `fetch(`${API_BASE_URL}/api/reports/generate`, { method: "POST", body: JSON.stringify({ patient_id: patientId }) })`
    const existing = mockReports[patientId];
    if (existing) return mockDelay(existing, 800);
    throw new Error("Report generation failed — no scan data available for this patient");
  },

  async approveReport(reportId: string, clinicianName: string): Promise<ClinicalReport> {
    // TODO(backend): replace with `fetch(`${API_BASE_URL}/api/reports/${reportId}/approve`, { method: "POST", body: JSON.stringify({ approved_by: clinicianName }) })`
    const report = Object.values(mockReports).find((r) => r.id === reportId);
    if (!report) throw new Error("Report not found");
    const updated: ClinicalReport = {
      ...report,
      status: "approved",
      approvedAt: new Date().toISOString(),
      approvedBy: clinicianName,
    };
    mockReports[report.patientId] = updated;
    return mockDelay(updated, 600);
  },
};
