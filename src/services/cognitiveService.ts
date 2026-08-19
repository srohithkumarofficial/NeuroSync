import { CognitiveExerciseDef, CognitiveResult, CognitiveSessionSummary } from "@/types";
import { apiFetch } from "./apiConfig";

// ----------------------------------------------------------------------------
// cognitiveService
// Real endpoints (see BACKEND_INTEGRATION.md):
//   POST /api/cognitive/session
//   GET  /api/cognitive/:patientId/history
// ----------------------------------------------------------------------------

export const cognitiveService = {
  async getExercises(): Promise<CognitiveExerciseDef[]> {
    return apiFetch<CognitiveExerciseDef[]>("/api/exercises");
  },

  async getHistory(patientId: string): Promise<CognitiveSessionSummary[]> {
    return apiFetch<CognitiveSessionSummary[]>(`/api/cognitive/${encodeURIComponent(patientId)}/history`);
  },

  async submitSession(patientId: string, results: CognitiveResult[]): Promise<CognitiveSessionSummary> {
    return apiFetch<CognitiveSessionSummary>("/api/cognitive/session", { method: "POST", body: JSON.stringify({ patient_id: patientId, results }) });
  },
};
