import { Patient, MRIVisit } from "@/types";
import { apiFetch } from "./apiConfig";

// ----------------------------------------------------------------------------
// patientService
// Real endpoints (see BACKEND_INTEGRATION.md):
//   GET /api/patients
//   GET /api/patients/:patientId
//   GET /api/patients/:patientId/timeline
// ----------------------------------------------------------------------------

export const patientService = {
  async createPatient(input: { name: string; dateOfBirth: string; sex: Patient["sex"]; assignedClinician: string }): Promise<Patient> {
    const response = await apiFetch<BackendPatient>("/api/patients", { method: "POST", body: JSON.stringify({ name: input.name, date_of_birth: input.dateOfBirth, sex: input.sex, assigned_clinician: input.assignedClinician }) });
    return toPatient(response);
  },
  async listPatients(): Promise<Patient[]> {
    return (await apiFetch<BackendPatient[]>("/api/patients")).map(toPatient);
  },

  async getPatient(patientId: string): Promise<Patient | undefined> {
    const response = await apiFetch<BackendPatient>(`/api/patients/${encodeURIComponent(patientId)}`);
    return toPatient(response);
  },

  async getTimeline(patientId: string): Promise<MRIVisit[]> {
    return apiFetch<MRIVisit[]>(`/api/patients/${encodeURIComponent(patientId)}/timeline`);
  },
};

type BackendPatient = { id: string; name: string; age: number; date_of_birth: string; sex: Patient["sex"]; last_visit: string | null; assigned_clinician: string; mri_status: Patient["mriStatus"]; prediction_status: Patient["predictionStatus"]; prediction_score: number | null; cognitive_status: Patient["cognitiveStatus"]; last_report_status: Patient["lastReportStatus"]; flags: Patient["flags"] };

function toPatient(item: BackendPatient): Patient {
  return { id: item.id, name: item.name, age: item.age, sex: item.sex, dateOfBirth: item.date_of_birth, lastVisit: item.last_visit ?? "Not recorded", assignedClinician: item.assigned_clinician, mriStatus: item.mri_status, predictionStatus: item.prediction_status, predictionScore: item.prediction_score, cognitiveStatus: item.cognitive_status, lastReportStatus: item.last_report_status, flags: item.flags };
}
