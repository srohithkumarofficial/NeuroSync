import { Clinician } from "@/types";
import { apiFetch, ApiError } from "./apiConfig";

// ----------------------------------------------------------------------------
// Authentication is owned by the backend; replace the prototype endpoint with institutional SSO when available.
// ----------------------------------------------------------------------------

export const authService = {
  async login(email: string, password: string): Promise<Clinician> {
    if (!email || !password) {
      throw new ApiError("Enter your email and password", "INVALID_CREDENTIALS", false);
    }
    return apiFetch<Clinician>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  },

  async logout(): Promise<void> {
    return Promise.resolve();
  },
};
