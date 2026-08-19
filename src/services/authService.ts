import { Clinician } from "@/types";
import { apiFetch, mockDelay, ApiError, USE_MOCK_API } from "./apiConfig";

// ----------------------------------------------------------------------------
// authService — mock session handling only. A real deployment should use
// the hospital's identity provider (SSO/SAML/OIDC) rather than a bespoke
// username/password flow. Endpoint placeholder: POST /api/auth/login
// ----------------------------------------------------------------------------

const DEMO_CLINICIAN: Clinician = {
  id: "clin-001",
  name: "Dr. Elena Cho",
  role: "Neurologist",
  hospital: "Ashworth Neurology & MS Center",
};

export const authService = {
  async login(email: string, password: string): Promise<Clinician> {
    if (!email || !password) {
      throw new ApiError("Enter your email and password", "INVALID_CREDENTIALS", false);
    }
    if (!USE_MOCK_API) {
      return apiFetch<Clinician>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    }
    return mockDelay(DEMO_CLINICIAN, 700);
  },

  async logout(): Promise<void> {
    return mockDelay(undefined, 200);
  },
};
