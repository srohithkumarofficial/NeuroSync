import { CognitiveExerciseDef, CognitiveResult, CognitiveSessionSummary } from "@/types";
import { cognitiveExercises, mockCognitiveHistory } from "@/mock/clinical";
import { apiFetch, mockDelay, USE_MOCK_API } from "./apiConfig";

// ----------------------------------------------------------------------------
// cognitiveService
// Real endpoints (see BACKEND_INTEGRATION.md):
//   POST /api/cognitive/session
//   GET  /api/cognitive/:patientId/history
// ----------------------------------------------------------------------------

export const cognitiveService = {
  async getExercises(): Promise<CognitiveExerciseDef[]> {
    if (!USE_MOCK_API) return apiFetch<CognitiveExerciseDef[]>("/api/exercises");
    return cognitiveExercises;
  },

  async getHistory(patientId: string): Promise<CognitiveSessionSummary[]> {
    if (!USE_MOCK_API) return apiFetch<CognitiveSessionSummary[]>(`/api/cognitive/${encodeURIComponent(patientId)}/history`);
    return mockDelay(mockCognitiveHistory[patientId] ?? [], 500);
  },

  async submitSession(patientId: string, results: CognitiveResult[]): Promise<CognitiveSessionSummary> {
    if (!USE_MOCK_API) {
      return apiFetch<CognitiveSessionSummary>("/api/cognitive/session", {
        method: "POST",
        body: JSON.stringify({ patient_id: patientId, results }),
      });
    }
    const domainScores: CognitiveSessionSummary["domainScores"] = {
      attention: 0,
      processing_speed: 0,
      memory: 0,
      cognitive_flexibility: 0,
    };
    results.forEach((r) => {
      domainScores[r.domain] = r.score;
    });
    const summary: CognitiveSessionSummary = {
      id: `cs-${Date.now()}`,
      patientId,
      date: new Date().toISOString(),
      domainScores,
      results,
    };
    return mockDelay(summary, 400);
  },
};
