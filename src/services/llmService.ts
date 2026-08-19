import { LLMExplanation } from "@/types";
import { mockLLMExplanations } from "@/mock/clinical";
import { mockDelay, ApiError } from "./apiConfig";

// ----------------------------------------------------------------------------
// llmService
// Real endpoint (see BACKEND_INTEGRATION.md): POST /api/llm/explanation
// The LLM never produces raw measurements — it receives the structured
// MRIScanResult + evidence list and returns grounded prose only.
// ----------------------------------------------------------------------------

export const llmService = {
  async generateExplanation(scanId: string): Promise<LLMExplanation> {
    // TODO(backend): replace with `fetch(`${API_BASE_URL}/api/llm/explanation`, { method: "POST", body: JSON.stringify({ scan_id: scanId }) })`
    const explanation = mockLLMExplanations[scanId];
    if (!explanation) {
      throw new ApiError("LLM unavailable — explanation could not be generated", "LLM_UNAVAILABLE", true);
    }
    return mockDelay(explanation, 900);
  },
};
