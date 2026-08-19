// ============================================================================
// NeuroSync — API Configuration
// Central place that decides whether services hit mock data or a real backend.
// Flip VITE_USE_MOCK_API=false in .env once BACKEND_INTEGRATION.md endpoints exist.
// ============================================================================

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://api.neurosync.example.com";
export const USE_MOCK_API = (import.meta.env.VITE_USE_MOCK_API ?? "true") !== "false";

// Simulates realistic network latency for mock responses so loading states
// are exercised the same way they will be against a real backend.
export function mockDelay<T>(value: T, ms = 700): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class ApiError extends Error {
  constructor(message: string, public code: string, public retryable = true) {
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
    throw new ApiError(detail?.message ?? detail ?? "Request failed", detail?.code ?? "API_ERROR", detail?.retryable ?? response.status >= 500);
  }
  return response.json() as Promise<T>;
}
