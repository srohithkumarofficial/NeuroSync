// ============================================================================
// NeuroSync — API Configuration
// Central API configuration. Clinical data is always read from the backend database.
// ============================================================================

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://api.neurosync.example.com";

export class ApiError extends Error {
  constructor(message: string, public code: string, public retryable = true, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

/** Fetch helper shared by real API-backed services. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.error ?? body?.detail;
    throw new ApiError(detail?.message ?? detail ?? "Request failed", detail?.code ?? "API_ERROR", detail?.retryable ?? response.status >= 500, response.status);
  }
  return response.json() as Promise<T>;
}
