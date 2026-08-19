import { Patient, MRIVisit } from "@/types";
import { mockPatients, getPatientById } from "@/mock/patients";
import { mockLongitudinal } from "@/mock/mriScans";
import { mockDelay } from "./apiConfig";

// ----------------------------------------------------------------------------
// patientService
// Real endpoints (see BACKEND_INTEGRATION.md):
//   GET /api/patients
//   GET /api/patients/:patientId
//   GET /api/patients/:patientId/timeline
// ----------------------------------------------------------------------------

export const patientService = {
  async listPatients(): Promise<Patient[]> {
    // TODO(backend): replace with `fetch(`${API_BASE_URL}/api/patients`)`
    return mockDelay(mockPatients, 400);
  },

  async getPatient(patientId: string): Promise<Patient | undefined> {
    // TODO(backend): replace with `fetch(`${API_BASE_URL}/api/patients/${patientId}`)`
    return mockDelay(getPatientById(patientId), 300);
  },

  async getTimeline(patientId: string): Promise<MRIVisit[]> {
    // TODO(backend): replace with `fetch(`${API_BASE_URL}/api/patients/${patientId}/timeline`)`
    return mockDelay(mockLongitudinal[patientId] ?? [], 500);
  },
};
