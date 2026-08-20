import { apiFetch, ApiError } from "./apiConfig";

export const predictionService = {
  async getPrediction(patientId: string) {
    const result = await apiFetch<{ lesion_count: number }>(`/api/mri/results/${encodeURIComponent(patientId)}`).catch((error) => {
      if (error instanceof ApiError && error.status === 404) return undefined;
      throw error;
    });
    if (!result) return undefined;
    return { lesion_count: result.lesion_count };
  },
};
