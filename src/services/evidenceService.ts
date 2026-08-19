import { EvidenceItem, VerifiedClaim } from "@/types";
import { apiFetch } from "./apiConfig";

// ----------------------------------------------------------------------------
// evidenceService
// Real endpoint (see BACKEND_INTEGRATION.md): POST /api/evidence/verify
// getEvidence() surfaces the "why" behind a prediction. verifyExplanation()
// is the hallucination firewall: every LLM sentence must resolve to a
// deterministic status (VERIFIED / UNSUPPORTED / BLOCKED / REQUIRES_REVIEW).
// ----------------------------------------------------------------------------

export const evidenceService = {
  async getEvidence(patientId: string): Promise<EvidenceItem[]> {
    return apiFetch<EvidenceItem[]>(`/api/evidence/${encodeURIComponent(patientId)}`);
  },

  async verifyExplanation(scanId: string): Promise<VerifiedClaim[]> {
    return apiFetch<VerifiedClaim[]>(`/api/evidence/${encodeURIComponent(scanId)}/claims`);
  },
};
