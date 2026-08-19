import { EvidenceItem, VerifiedClaim } from "@/types";
import { mockEvidence, mockVerifiedClaims } from "@/mock/clinical";
import { mockDelay } from "./apiConfig";

// ----------------------------------------------------------------------------
// evidenceService
// Real endpoint (see BACKEND_INTEGRATION.md): POST /api/evidence/verify
// getEvidence() surfaces the "why" behind a prediction. verifyExplanation()
// is the hallucination firewall: every LLM sentence must resolve to a
// deterministic status (VERIFIED / UNSUPPORTED / BLOCKED / REQUIRES_REVIEW).
// ----------------------------------------------------------------------------

export const evidenceService = {
  async getEvidence(patientId: string): Promise<EvidenceItem[]> {
    // TODO(backend): replace with `fetch(`${API_BASE_URL}/api/evidence/${patientId}`)`
    return mockDelay(mockEvidence[patientId] ?? [], 500);
  },

  async verifyExplanation(scanId: string): Promise<VerifiedClaim[]> {
    // TODO(backend): replace with `fetch(`${API_BASE_URL}/api/evidence/verify`, { method: "POST", body: JSON.stringify({ scan_id: scanId }) })`
    return mockDelay(mockVerifiedClaims[scanId] ?? [], 700);
  },
};
