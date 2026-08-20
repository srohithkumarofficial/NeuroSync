import { MRIInferenceResult, MRISequence } from "@/types";
import { apiFetch, ApiError } from "./apiConfig";

export const MRI_AI_SERVICE_URL = (import.meta.env.VITE_MRI_AI_URL || import.meta.env.VITE_MRI_AI_SERVICE_URL || import.meta.env.VITE_MRI_AI_API_URL || "").replace(/\/$/, "");
export const MRI_AI_URL = MRI_AI_SERVICE_URL;
export const USE_REAL_MRI_AI = true;
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
  if (response.success === false) {
    const detail = typeof response.error === "string" ? response.error : "The MRI model rejected the analysis.";
    throw new ApiError(detail, "AI_MODEL_ERROR", true);
  }
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
    edss_score: null,
    edss_band: null,
    edss_note: null,
  };
}

export async function checkMRIHealth(): Promise<boolean> {
  if (!MRI_AI_SERVICE_URL) return false;
  try {
    const response = await fetch(`${MRI_AI_SERVICE_URL}/`, {
      method: "GET",
      headers: { "ngrok-skip-browser-warning": "true" },
    });
    const body = await response.json().catch(() => null);
    if (import.meta.env.DEV) console.log("MRI AI health status:", response.status, body);
    return response.ok && body?.status === "online";
  } catch (error) {
    if (import.meta.env.DEV) console.error("MRI AI health check failed", error);
    return false;
  }
}

export async function persistMRIResult(patientId: string, result: MRIInferenceResult): Promise<void> {
  await apiFetch("/api/mri/results", {
    method: "POST",
    body: JSON.stringify({ patient_id: patientId, lesion_count: result.lesion_count, lesion_voxels: result.lesion_voxels, lesion_volume_ml: result.lesion_volume_ml, shape: result.shape, prediction_file: result.prediction_file }),
  });
}

export async function getPersistedMRIResult(patientId: string): Promise<MRIInferenceResult | undefined> {
  try {
    const response = await apiFetch<BackendMRIResult>(`/api/mri/results/${encodeURIComponent(patientId)}`);
    return {
      patientId: response.patient_id,
      lesion_count: response.lesion_count,
      lesion_voxels: response.lesion_voxels,
      lesion_volume_ml: response.lesion_volume_ml,
      shape: response.shape,
      prediction_file: response.prediction_file,
      edss_score: response.edss_score ?? null,
      edss_band: response.edss_band ?? null,
      edss_note: response.edss_note ?? null,
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}

type BackendMRIResult = {
  patient_id: string;
  lesion_count: number;
  lesion_voxels: number;
  lesion_volume_ml: number;
  shape: [number, number, number];
  prediction_file: string;
  edss_score?: number | null;
  edss_band?: string | null;
  edss_note?: string | null;
  updated_at: string;
};

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
    const predictionUrl = `${MRI_AI_SERVICE_URL}/predict`;
    if (import.meta.env.DEV) {
      console.log("MRI AI URL:", MRI_AI_URL);
      console.log("MRI prediction URL:", predictionUrl);
      console.log("T1:", files.t1);
      console.log("FLAIR:", files.flair);
      console.log("T2:", files.t2);
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REAL_INFERENCE_TIMEOUT_MS);
    try {
      const response = await fetch(predictionUrl, { method: "POST", headers: { "ngrok-skip-browser-warning": "true" }, body: formData, signal: controller.signal });
      const body = await response.json().catch(() => null);
      if (import.meta.env.DEV) {
        console.log("MRI API status:", response.status);
        console.log("MRI API response:", body);
      }
      if (!response.ok) {
        if (import.meta.env.DEV) console.error("MRI AI service error", { status: response.status, body });
        const message = response.status === 404 ? "MRI AI service does not expose /predict." : response.status === 405 ? "MRI AI service rejected the prediction method." : response.status === 422 ? body?.detail || "MRI files were rejected by the AI service." : response.status >= 500 ? "MRI AI service returned an error." : body?.detail || body?.message || "Invalid MRI files or request.";
        throw new ApiError(message, "AI_SERVICE_ERROR", response.status >= 500);
      }
      const result = parseInferenceResult(patientId, body);
      realResults.set(patientId, result);
      await persistMRIResult(patientId, result);
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

};
