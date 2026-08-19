import { MRIScanResult } from "@/types";
import { mriService } from "./mriService";

// ----------------------------------------------------------------------------
// predictionService
// Real endpoint (see BACKEND_INTEGRATION.md): POST /api/prediction
// Wraps the prediction fields already present on MRIScanResult so future
// changes to how the prediction model is invoked don't ripple into the UI.
// ----------------------------------------------------------------------------

export const predictionService = {
  async getPrediction(scanId: string) {
    // TODO(backend): replace with `fetch(`${API_BASE_URL}/api/prediction`, { method: "POST", body: JSON.stringify({ scan_id: scanId }) })`
    const scan = await mriService.getScanResult(scanId);
    if (!scan) return undefined;
    return {
      prediction: scan.prediction,
      confidence: scan.confidence,
    } as Pick<MRIScanResult, "prediction" | "confidence">;
  },
};
