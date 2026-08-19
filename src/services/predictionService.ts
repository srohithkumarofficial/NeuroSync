import { apiFetch } from "./apiConfig";

export const predictionService = {
  async getPrediction(patientId: string) {
    const result = await apiFetch<{ lesion_count: number }>(`/api/mri/results/${encodeURIComponent(patientId)}`).catch(() => undefined);
    if (!result) return undefined;
    return { lesion_count: result.lesion_count };
  },
};
