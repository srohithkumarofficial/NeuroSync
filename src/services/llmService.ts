import { LLMExplanation } from "@/types";
import { apiFetch, ApiError } from "./apiConfig";

// ----------------------------------------------------------------------------
// llmService
// Real endpoint (see BACKEND_INTEGRATION.md): POST /api/llm/explanation
// The LLM never produces raw measurements — it receives the structured
// MRIScanResult + evidence list and returns grounded prose only.
// ----------------------------------------------------------------------------

export const llmService = {
  async generateExplanation(scanId: string): Promise<LLMExplanation> {
    try { return await apiFetch<LLMExplanation>("/api/llm/explanation", { method: "POST", body: JSON.stringify({ scan_id: scanId }) }); }
    catch (error) { throw error instanceof ApiError ? error : new ApiError("LLM unavailable — explanation could not be generated", "LLM_UNAVAILABLE", true); }
  },
};
