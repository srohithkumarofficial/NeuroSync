import { MRIInferenceResult, MRIScanResult, MRISequence, ProcessingStep } from "@/types";
import { mockScanResults } from "@/mock/mriScans";
import { mockDelay, ApiError } from "./apiConfig";

export const MRI_AI_SERVICE_URL = (import.meta.env.VITE_MRI_AI_SERVICE_URL || import.meta.env.VITE_MRI_AI_API_URL || "").replace(/\/$/, "");
export const USE_REAL_MRI_AI = Boolean(MRI_AI_SERVICE_URL);
const REAL_INFERENCE_TIMEOUT_MS = 10 * 60 * 1000;
const realResults = new Map<string, MRIInferenceResult>();

// ----------------------------------------------------------------------------
// mriService
// Real endpoints (see BACKEND_INTEGRATION.md):
//   POST /api/mri/upload
//   POST /api/mri/analyze
//   GET  /api/mri/:scanId
// This module owns every place the frontend touches raw MRI files, so the
// real integration only has to change the bodies of these three functions.
// ----------------------------------------------------------------------------

const REQUIRED_SEQUENCES: MRISequence[] = ["FLAIR", "T1", "T2"];

export function validateSequences(uploaded: MRISequence[]): { valid: boolean; missing: MRISequence[] } {
  const missing = REQUIRED_SEQUENCES.filter((s) => !uploaded.includes(s));
  return { valid: missing.length === 0, missing };
}

export function isNiftiFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".nii") || name.endsWith(".nii.gz");
}

function parseInferenceResult(patientId: string, value: unknown): MRIInferenceResult {
  const response = value as Record<string, unknown>;
  const shape = response.shape;
  if (response.success !== true || !Number.isFinite(response.lesion_count) || !Number.isFinite(response.lesion_voxels) || !Number.isFinite(response.lesion_volume_ml) || !Array.isArray(shape) || shape.length !== 3 || !shape.every(Number.isFinite)) {
    throw new ApiError("The AI service returned an invalid analysis result.", "INVALID_AI_RESPONSE", true);
  }
  return {
    patientId,
    lesion_count: Number(response.lesion_count),
    lesion_voxels: Number(response.lesion_voxels),
    lesion_volume_ml: Number(response.lesion_volume_ml),
    shape: [Number(shape[0]), Number(shape[1]), Number(shape[2])],
    prediction_file: typeof response.prediction_file === "string" ? response.prediction_file : "",
  };
}

export const mriService = {
  /** Sends the three real NIfTI volumes to the independently deployed nnU-Net service. */
  async runRealAnalysis(patientId: string, files: { t1: File; flair: File; t2: File }): Promise<MRIInferenceResult> {
    if (!MRI_AI_SERVICE_URL) throw new ApiError("MRI AI service URL is not configured.", "AI_SERVICE_NOT_CONFIGURED", false);
    if (!files.t1 || !files.flair || !files.t2) throw new ApiError("Missing T1, FLAIR, or T2 MRI input.", "MISSING_MRI_MODALITY", false);
    if (!Object.values(files).every(isNiftiFile)) throw new ApiError("Upload valid .nii or .nii.gz files for T1, FLAIR, and T2.", "INVALID_MRI_FILE", false);
    const formData = new FormData();
    formData.append("t1", files.t1);
    formData.append("flair", files.flair);
    formData.append("t2", files.t2);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REAL_INFERENCE_TIMEOUT_MS);
    try {
      const response = await fetch(`${MRI_AI_SERVICE_URL}/predict`, { method: "POST", body: formData, signal: controller.signal });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        if (import.meta.env.DEV) console.error("MRI AI service error", { status: response.status, body });
        const message = response.status >= 500 ? "MRI AI service returned an error." : body?.detail || body?.message || "Invalid MRI files or request.";
        throw new ApiError(message, "AI_SERVICE_ERROR", response.status >= 500);
      }
      const result = parseInferenceResult(patientId, body);
      realResults.set(patientId, result);
      return result;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (import.meta.env.DEV) console.error("MRI AI request failed", error);
      if (error instanceof DOMException && error.name === "AbortError") throw new ApiError("AI analysis timed out. The service may still be processing; try again shortly.", "AI_TIMEOUT", true);
      throw new ApiError("Unable to connect to MRI AI service. Check that the ngrok URL is current and CORS is enabled.", "AI_SERVICE_UNAVAILABLE", true);
    } finally {
      window.clearTimeout(timeout);
    }
  },

  getRealResult(patientId: string): MRIInferenceResult | undefined {
    return realResults.get(patientId);
  },
  /**
   * Uploads MRI files for a patient. In production this streams multipart
   * form data (NIfTI: .nii / .nii.gz) to POST /api/mri/upload and returns an
   * uploadId used by analyzeMRI(). Here we simulate the round trip.
   */
  async uploadMRI(_patientId: string, fileNames: string[]): Promise<{ uploadId: string }> {
    // TODO(backend): replace with multipart POST to `${API_BASE_URL}/api/mri/upload`
    if (fileNames.length === 0) {
      throw new ApiError("No files provided", "NO_FILES", false);
    }
    return mockDelay({ uploadId: `upload-${Date.now()}` }, 900);
  },

  /**
   * Kicks off the AI analysis pipeline (preprocessing → segmentation →
   * feature extraction → prediction). Real implementation should call
   * POST /api/mri/analyze and then poll/subscribe to processing status via
   * VITE_MRI_STATUS_STREAM_URL (WebSocket/SSE) rather than a flat promise.
   */
  async analyzeMRI(patientId: string): Promise<MRIScanResult> {
    // TODO(backend): replace with `fetch(`${API_BASE_URL}/api/mri/analyze`, { method: "POST", body: ... })`
    const result = mockScanResults[patientId];
    if (!result) {
      throw new ApiError("AI model unavailable for this scan", "MODEL_UNAVAILABLE", true);
    }
    return mockDelay(result, 1200);
  },

  async getScanResult(scanId: string): Promise<MRIScanResult | undefined> {
    // TODO(backend): replace with `fetch(`${API_BASE_URL}/api/mri/${scanId}`)`
    const result = Object.values(mockScanResults).find((r) => r.scan_id === scanId);
    return mockDelay(result, 400);
  },

  /**
   * Mock step-by-step processing simulation for the MRI Processing screen.
   * The real system should replace this with a WebSocket/SSE subscription
   * or short-interval polling against the backend job status endpoint.
   */
  getProcessingSteps(): ProcessingStep[] {
    return [
      { id: "upload", label: "MRI uploaded", status: "pending" },
      { id: "preprocess", label: "Preprocessing", status: "pending" },
      { id: "extraction", label: "Brain extraction", status: "pending" },
      { id: "registration", label: "Registration", status: "pending" },
      { id: "segmentation", label: "Lesion segmentation", status: "pending" },
      { id: "features", label: "Feature extraction", status: "pending" },
      { id: "prediction", label: "Prediction", status: "pending" },
      { id: "report", label: "Report preparation", status: "pending" },
    ];
  },
};
